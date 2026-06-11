"""
Structured logging setup for the application.

Replaces all print() statements with proper leveled logging.
Uses JSON format in production for log aggregation tools.
"""

import logging
import sys

from backend.config import get_settings


def setup_logging(name: str = "yt_seo") -> logging.Logger:
    """
    Configure and return a logger instance.

    Args:
        name: Logger name (typically module name).

    Returns:
        Configured logger.
    """
    settings = get_settings()

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    # Avoid adding duplicate handlers on repeated calls
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (optional, for production)
    if not settings.debug:
        try:
            file_handler = logging.FileHandler("app.log", encoding="utf-8")
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except PermissionError:
            logger.warning("Could not create log file — using console only")

    return logger
