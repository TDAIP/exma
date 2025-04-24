import logging
import json
import os

# Setup logging
logger = logging.getLogger(__name__)

class DataManager:
    """
    Manages application settings and data persistence
    """
    def __init__(self):
        self.settings = {
            "RATE_LIMIT_SECONDS": 60,  # Minimum time between uploads (60 seconds)
            "DEFAULT_TOKENS": 5,       # Each IP gets 5 tokens per day
            "MAINTENANCE_MODE": False, # Maintenance mode flag
            "MAINTENANCE_MESSAGE": "System is currently undergoing maintenance. Please try again later."
        }
        
        # Load settings from file if it exists
        self._load_settings()
    
    def _load_settings(self):
        """Load settings from storage"""
        try:
            if os.path.exists('settings.json'):
                with open('settings.json', 'r', encoding='utf-8') as f:
                    saved_settings = json.load(f)
                    self.settings.update(saved_settings)
                    logger.info("Settings loaded successfully")
        except Exception as e:
            logger.error(f"Error loading settings: {str(e)}")
    
    def _save_settings(self):
        """Save settings to storage"""
        try:
            with open('settings.json', 'w', encoding='utf-8') as f:
                json.dump(self.settings, f)
            logger.info("Settings saved successfully")
        except Exception as e:
            logger.error(f"Error saving settings: {str(e)}")
    
    def get_setting(self, key, default=None):
        """Get a setting value"""
        return self.settings.get(key, default)
    
    def update_setting(self, key, value):
        """Update a setting value"""
        if key in self.settings:
            self.settings[key] = value
            self._save_settings()
            logger.info(f"Updated setting {key}: {value}")
            return True
        return False
    
    def toggle_maintenance_mode(self, enable=True, message=None):
        """Toggle maintenance mode on/off"""
        self.settings["MAINTENANCE_MODE"] = enable
        if message and enable:
            self.settings["MAINTENANCE_MESSAGE"] = message
        self._save_settings()
        logger.info(f"Maintenance mode {'enabled' if enable else 'disabled'}")
        return True

# Create a singleton instance
data_manager = DataManager()