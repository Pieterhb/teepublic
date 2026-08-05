import yaml
from pathlib import Path
from dataclasses import dataclass

@dataclass
class CrawlerConfig:
    store_url: str
    user_agent: str
    timeout_seconds: int
    rate_limit_seconds: int
    max_retries: int
    concurrency: int

@dataclass
class DatabaseConfig:
    db_path: str

@dataclass
class OutputConfig:
    csv_path: str
    json_path: str
    validation_report_path: str

@dataclass
class EnrichmentConfig:
    enabled: bool
    provider: str
    taxonomy_path: str
    api_key: str = ""
    free_api_key: str = ""
    model: str = "gemini-2.5-flash-lite"

class AppConfig:
    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        
        self.crawler = CrawlerConfig(**data.get("crawler", {}))
        self.database = DatabaseConfig(**data.get("database", {}))
        self.output = OutputConfig(**data.get("output", {}))
        self.enrichment = EnrichmentConfig(**data.get("enrichment", {}))

def load_config(config_path: str = "config/config.yaml") -> AppConfig:
    return AppConfig(config_path)
