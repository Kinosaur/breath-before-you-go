import sys
from pathlib import Path

# Make data_pipeline importable from anywhere pytest is run
sys.path.insert(0, str(Path(__file__).parent.parent / "data_pipeline"))
