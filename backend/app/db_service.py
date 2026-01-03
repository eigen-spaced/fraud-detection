"""Service layer for database operations on analyzed transactions."""

import logging
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db_models import AnalyzedTransaction
from app.models import FraudAnalysis

logger = logging.getLogger(__name__)


async def save_analysis(
    session: AsyncSession,
    analysis: FraudAnalysis,
    transaction_data: dict,
    model_version: str,
) -> Optional[AnalyzedTransaction]:
    """
    Save a single fraud analysis to the database.

    Args:
        session: Async database session
        analysis: FraudAnalysis object from the fraud detector
        transaction_data: Original transaction data dictionary
        model_version: Version of the model used for analysis

    Returns:
        AnalyzedTransaction if saved successfully, None otherwise
    """
    try:
        # Extract transaction timestamp
        timestamp_str = transaction_data.get("timestamp", datetime.utcnow().isoformat())
        if isinstance(timestamp_str, str):
            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        else:
            timestamp = timestamp_str

        # Create database record
        db_record = AnalyzedTransaction(
            transaction_id=analysis.transaction_id,
            timestamp=timestamp,
            merchant_name=transaction_data.get("merchant_name", "Unknown"),
            merchant_category=transaction_data.get("merchant_category", "unknown"),
            amount=Decimal(str(transaction_data.get("amount", 0))),
            classification=analysis.classification.value,
            risk_score=analysis.risk_score,
            risk_factors=analysis.risk_factors,
            explanation=analysis.explanation,
            model_version=model_version,
        )

        session.add(db_record)
        await session.commit()
        await session.refresh(db_record)

        logger.debug(
            f"Saved analysis for transaction {analysis.transaction_id} "
            f"with classification {analysis.classification.value}"
        )

        return db_record

    except Exception as e:
        logger.error(
            f"Failed to save analysis for transaction {analysis.transaction_id}: {str(e)}",
            exc_info=True,
        )
        await session.rollback()
        return None


async def save_batch_analyses(
    session: AsyncSession,
    analyses: list[FraudAnalysis],
    transactions_data: list[dict],
    model_version: str,
) -> int:
    """
    Save multiple fraud analyses to the database in a single transaction.

    Args:
        session: Async database session
        analyses: List of FraudAnalysis objects
        transactions_data: List of original transaction data dictionaries
        model_version: Version of the model used for analysis

    Returns:
        Number of successfully saved records
    """
    try:
        if len(analyses) != len(transactions_data):
            logger.warning(
                f"Mismatch between analyses ({len(analyses)}) "
                f"and transactions ({len(transactions_data)})"
            )
            return 0

        saved_count = 0

        for analysis, transaction_data in zip(analyses, transactions_data):
            # Extract transaction timestamp
            timestamp_str = transaction_data.get("timestamp", datetime.utcnow().isoformat())
            if isinstance(timestamp_str, str):
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            else:
                timestamp = timestamp_str

            # Create database record
            db_record = AnalyzedTransaction(
                transaction_id=analysis.transaction_id,
                timestamp=timestamp,
                merchant_name=transaction_data.get("merchant_name", "Unknown"),
                merchant_category=transaction_data.get("merchant_category", "unknown"),
                amount=Decimal(str(transaction_data.get("amount", 0))),
                classification=analysis.classification.value,
                risk_score=analysis.risk_score,
                risk_factors=analysis.risk_factors,
                explanation=analysis.explanation,
                model_version=model_version,
            )

            session.add(db_record)
            saved_count += 1

        # Commit all records in a single transaction
        await session.commit()

        logger.info(f"✅ Saved {saved_count} transaction analyses to database")

        return saved_count

    except Exception as e:
        logger.error(f"Failed to save batch analyses: {str(e)}", exc_info=True)
        await session.rollback()
        return 0


async def get_analysis_by_transaction_id(
    session: AsyncSession,
    transaction_id: str,
) -> Optional[AnalyzedTransaction]:
    """
    Retrieve an analyzed transaction by its transaction ID.

    Args:
        session: Async database session
        transaction_id: Transaction ID to search for

    Returns:
        AnalyzedTransaction if found, None otherwise
    """
    try:
        statement = select(AnalyzedTransaction).where(
            AnalyzedTransaction.transaction_id == transaction_id
        )
        result = await session.execute(statement)
        return result.scalar_one_or_none()

    except Exception as e:
        logger.error(
            f"Failed to retrieve analysis for transaction {transaction_id}: {str(e)}",
            exc_info=True,
        )
        return None


async def get_recent_analyses(
    session: AsyncSession,
    limit: int = 100,
    classification_filter: Optional[str] = None,
) -> list[AnalyzedTransaction]:
    """
    Retrieve recent analyzed transactions, optionally filtered by classification.

    Args:
        session: Async database session
        limit: Maximum number of records to return
        classification_filter: Optional filter by classification
            (e.g., 'fraudulent', 'suspicious', 'legitimate')

    Returns:
        List of AnalyzedTransaction records ordered by created_at descending
    """
    try:
        statement = select(AnalyzedTransaction)

        if classification_filter:
            statement = statement.where(AnalyzedTransaction.classification == classification_filter)

        statement = statement.order_by(AnalyzedTransaction.created_at.desc()).limit(limit)

        result = await session.execute(statement)
        return list(result.scalars().all())

    except Exception as e:
        logger.error(f"Failed to retrieve recent analyses: {str(e)}", exc_info=True)
        return []


async def get_sample_transactions(
    session: AsyncSession,
    scenario: str,
    limit: int = 5,
) -> list:
    """
    Retrieve random sample transactions from engineered_transactions table.

    Args:
        session: Async database session
        scenario: Filter scenario - 'fraud', 'legit', or 'mixed'
        limit: Maximum number of records to return (default 5, max 100)

    Returns:
        List of EngineeredTransaction records
    """
    try:
        from app.db_models import EngineeredTransaction
        from sqlalchemy import func

        # Build base query
        statement = select(EngineeredTransaction)

        # Apply scenario filter
        if scenario == "fraud":
            statement = statement.where(EngineeredTransaction.is_fraud == 1)
        elif scenario == "legit":
            statement = statement.where(EngineeredTransaction.is_fraud == 0)
        # 'mixed' scenario has no filter

        # Add random ordering and limit
        statement = statement.order_by(func.random()).limit(min(limit, 100))

        result = await session.execute(statement)
        transactions = list(result.scalars().all())

        logger.debug(
            f"Retrieved {len(transactions)} transactions for scenario '{scenario}'"
        )

        return transactions

    except Exception as e:
        logger.error(
            f"Failed to retrieve sample transactions: {str(e)}", exc_info=True
        )
        return []


async def get_database_stats(session: AsyncSession) -> dict:
    """
    Get statistics about the engineered_transactions table.

    Args:
        session: Async database session

    Returns:
        Dictionary with total_transactions, fraud_count, legit_count, fraud_percentage
    """
    try:
        from app.db_models import EngineeredTransaction
        from sqlalchemy import func

        # Get total count
        total_statement = select(func.count()).select_from(EngineeredTransaction)
        total_result = await session.execute(total_statement)
        total_count = total_result.scalar() or 0

        # Get fraud count
        fraud_statement = (
            select(func.count())
            .select_from(EngineeredTransaction)
            .where(EngineeredTransaction.is_fraud == 1)
        )
        fraud_result = await session.execute(fraud_statement)
        fraud_count = fraud_result.scalar() or 0

        # Calculate legit count and percentage
        legit_count = total_count - fraud_count
        fraud_percentage = (fraud_count / total_count * 100) if total_count > 0 else 0.0

        stats = {
            "total_transactions": total_count,
            "fraud_count": fraud_count,
            "legit_count": legit_count,
            "fraud_percentage": round(fraud_percentage, 2),
        }

        logger.debug(f"Database stats: {stats}")

        return stats

    except Exception as e:
        logger.error(f"Failed to retrieve database stats: {str(e)}", exc_info=True)
        return {
            "total_transactions": 0,
            "fraud_count": 0,
            "legit_count": 0,
            "fraud_percentage": 0.0,
        }
