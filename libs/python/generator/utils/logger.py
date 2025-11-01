# -----------------------------------------------------------------------------
# File: logger.py
# Description: Global logger for batch generation
# -----------------------------------------------------------------------------

import logging
import shutil
from pathlib import Path
from typing import Optional

# Global logger instance
_logger: Optional[logging.Logger] = None
_log_file: Optional[Path] = None

# ANSI color codes for terminal output
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    # Foreground colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'

    # Bright foreground colors
    BRIGHT_BLACK = '\033[90m'
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'


def setup_logger(log_file: Path):
    """Setup global file logger for batch generation

    Args:
        log_file: Path to the log file (e.g., output_dir/run.log)
    """
    global _logger, _log_file

    _log_file = log_file

    # Create logger
    _logger = logging.getLogger("generator_batch")
    _logger.setLevel(logging.INFO)
    _logger.handlers.clear()

    # File handler
    fh = logging.FileHandler(log_file, mode='w', encoding='utf-8')
    fh.setFormatter(logging.Formatter('%(message)s'))
    _logger.addHandler(fh)
    _logger.propagate = False


def get_logger() -> Optional[logging.Logger]:
    """Get the global logger instance"""
    return _logger


def log_to_file(message: str):
    """Log message to file only (not console)

    Args:
        message: Message to log
    """
    if _logger:
        _logger.info(message)


def log_to_console(message: str, color: str = None):
    """Log message to both file and console with optional color

    Args:
        message: Message to log
        color: Optional ANSI color code (e.g., Colors.CYAN)
    """
    if _logger:
        _logger.info(message)

    if color:
        print(f"{color}{message}{Colors.RESET}")
    else:
        print(message)


def separator(char: str = "=") -> str:
    """Generate separator line matching terminal width

    Args:
        char: Character to use for separator (default: "=")

    Returns:
        Separator string
    """
    try:
        width = shutil.get_terminal_size().columns
    except:
        width = 80  # Fallback to 80 if terminal size cannot be determined
    return char * width