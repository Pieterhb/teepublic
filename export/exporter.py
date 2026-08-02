import pandas as pd
import logging
from pathlib import Path
from db.db import DatabaseManager
import json

logger = logging.getLogger(__name__)

class Exporter:
    def __init__(self, db_manager: DatabaseManager, output_config):
        self.db_manager = db_manager
        self.csv_path = output_config.csv_path
        self.json_path = output_config.json_path
        self.validation_report_path = output_config.validation_report_path
        
        # Ensure directories exist
        Path(self.csv_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.json_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.validation_report_path).parent.mkdir(parents=True, exist_ok=True)

    def export_csv(self):
        try:
            with self.db_manager.get_connection() as conn:
                df = pd.read_sql_query("SELECT * FROM designs", conn)
                df.to_csv(self.csv_path, index=False)
                logger.info(f"Successfully exported to {self.csv_path}")
        except Exception as e:
            logger.error(f"Failed to export CSV: {e}")

    def export_json(self):
        try:
            with self.db_manager.get_connection() as conn:
                conn.row_factory = dict_factory
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM designs")
                rows = cursor.fetchall()
                
                with open(self.json_path, 'w', encoding='utf-8') as f:
                    json.dump(rows, f, indent=2, ensure_ascii=False)
                logger.info(f"Successfully exported to {self.json_path}")
        except Exception as e:
            logger.error(f"Failed to export JSON: {e}")

    def generate_validation_report(self):
        try:
            with self.db_manager.get_connection() as conn:
                conn.row_factory = dict_factory
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM designs")
                rows = cursor.fetchall()
                
                report = {
                    "total_records": len(rows),
                    "valid_records": 0,
                    "invalid_records": 0,
                    "errors": []
                }
                
                for row in rows:
                    errors = []
                    if not row.get('title'):
                        errors.append("Missing title")
                    if not row.get('image_url'):
                        errors.append("Missing image_url")
                    
                    if errors:
                        report["invalid_records"] += 1
                        report["errors"].append({
                            "design_id": row.get('design_id'),
                            "url": row.get('teepublic_url'),
                            "errors": errors
                        })
                    else:
                        report["valid_records"] += 1
                        
                with open(self.validation_report_path, 'w', encoding='utf-8') as f:
                    json.dump(report, f, indent=2)
                logger.info(f"Generated validation report at {self.validation_report_path}")
        except Exception as e:
            logger.error(f"Failed to generate validation report: {e}")

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d
