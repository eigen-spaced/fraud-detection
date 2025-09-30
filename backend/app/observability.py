"""OpenTelemetry observability configuration."""
import logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def setup_observability():
    """Initialize OpenTelemetry tracing."""
    if not settings.otel_enabled:
        logger.info("OpenTelemetry disabled")
        return
    
    # Set up tracer provider
    provider = TracerProvider()
    processor = BatchSpanProcessor(ConsoleSpanExporter())
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
    
    logger.info(f"OpenTelemetry initialized for service: {settings.otel_service_name}")


def instrument_app(app):
    """Instrument FastAPI app with OpenTelemetry."""
    if settings.otel_enabled:
        FastAPIInstrumentor.instrument_app(app)
        logger.info("FastAPI instrumented with OpenTelemetry")