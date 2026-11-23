from enum import Enum

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Queue Names
DEFAULT_QUEUE = "pixelpilot_tasks"

# Storage Folders
RAW_IMAGES_FOLDER = "raw"
PROCESSED_IMAGES_FOLDER = "processed"