import asyncio
from sqlalchemy import create_engine
from app.config import settings
from scripts.seed_utils import merge_sparkov_csvs
from app.preprocess.feature_engineering import FeatureEngineer

async def main():
    engineer = FeatureEngineer()
    
    print("Gathering fragmented Sparkov data...")
    raw_df = merge_sparkov_csvs("./data/raw_sparkov")
    
    print("Running feature engineering (stateful rolling windows)...")
    engineered_df = engineer.engineer_features(raw_df)
    
    # 4. Load (Database)
    print("Loading engineered features into Postgres...")
    sync_url = settings.database_url.replace("postgresql+asyncpg", "postgresql")
    engine = create_engine(sync_url)
    
    # Load into the engineered table for the model
    engineered_df.to_sql("engineered_transactions", con=engine, if_exists="replace", index=False)
    
    print(f"Success! {len(engineered_df)} model-ready transactions seeded.")

if __name__ == "__main__":
    asyncio.run(main())
