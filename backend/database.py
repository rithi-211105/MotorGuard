"""
database.py - SQLite Database for AI Infrastructure Monitor

Handles: sensor data storage, baseline management, comparison, alerts
"""

import sqlite3
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from contextlib import contextmanager
import threading

DB_PATH = Path(__file__).parent / 'infra_monitor.db'

# Thread-local storage for database connections
_local = threading.local()


def get_connection():
    """Get a thread-safe database connection."""
    if not hasattr(_local, 'conn') or _local.conn is None:
        _local.conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


@contextmanager
def get_db():
    """Context manager for database operations."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def init_database():
    """Initialize all database tables."""
    with get_db() as conn:
        conn.executescript("""
        -- ============================================
        -- Assets table
        -- ============================================
        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'motor',
            location TEXT DEFAULT 'Laboratory',
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now'))
        );

        -- ============================================
        -- Sensor readings (time-series data)
        -- ============================================
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL,
            timestamp_ms INTEGER NOT NULL,
            timestamp_iso TEXT NOT NULL,
            accel_x REAL,
            accel_y REAL,
            accel_z REAL,
            accel_rms REAL,
            accel_peak REAL,
            temperature_c REAL,
            current_a REAL,
            battery_v REAL,
            FOREIGN KEY (asset_id) REFERENCES assets(id)
        );
        CREATE INDEX IF NOT EXISTS idx_readings_asset_time 
            ON sensor_readings(asset_id, timestamp_ms DESC);

        -- ============================================
        -- Baselines (healthy reference data)
        -- ============================================
        CREATE TABLE IF NOT EXISTS baselines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL,
            name TEXT NOT NULL,
            speed TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            sample_count INTEGER DEFAULT 0,
            -- Statistical summary
            accel_rms_mean REAL,
            accel_rms_std REAL,
            accel_rms_min REAL,
            accel_rms_max REAL,
            accel_peak_mean REAL,
            accel_peak_std REAL,
            temp_mean REAL,
            temp_std REAL,
            temp_min REAL,
            temp_max REAL,
            dominant_freq_mean REAL,
            dominant_freq_std REAL,
            band_energy_low_mean REAL,
            band_energy_mid_mean REAL,
            band_energy_high_mean REAL,
            kurtosis_mean REAL,
            kurtosis_std REAL,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (asset_id) REFERENCES assets(id)
        );

        -- ============================================
        -- Baseline windows (individual window features for comparison)
        -- ============================================
        CREATE TABLE IF NOT EXISTS baseline_windows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            baseline_id INTEGER NOT NULL,
            window_index INTEGER,
            accel_rms_x REAL,
            accel_rms_y REAL,
            accel_rms_z REAL,
            accel_peak REAL,
            kurtosis_z REAL,
            crest_factor_z REAL,
            dominant_freq REAL,
            band_energy_low REAL,
            band_energy_mid REAL,
            band_energy_high REAL,
            temperature_c REAL,
            FOREIGN KEY (baseline_id) REFERENCES baselines(id)
        );
        CREATE INDEX IF NOT EXISTS idx_baseline_windows 
            ON baseline_windows(baseline_id);

        -- ============================================
        -- Comparison sessions
        -- ============================================
        CREATE TABLE IF NOT EXISTS comparisons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL,
            baseline_id INTEGER,
            name TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            status TEXT DEFAULT 'in_progress',
            -- Comparison results
            overall_health_score REAL DEFAULT 100,
            anomaly_score REAL DEFAULT 0,
            severity TEXT DEFAULT 'normal',
            -- Vibration comparison
            vibration_diff_pct REAL,
            vibration_baseline_rms REAL,
            vibration_current_rms REAL,
            -- Temperature comparison
            temperature_diff_c REAL,
            temperature_baseline_mean REAL,
            temperature_current_mean REAL,
            -- Frequency comparison
            freq_shift_hz REAL,
            dominant_freq_baseline REAL,
            dominant_freq_current REAL,
            -- Feature differences (JSON)
            feature_diffs TEXT,
            -- AI explanation
            explanation TEXT,
            sample_count INTEGER DEFAULT 0,
            FOREIGN KEY (asset_id) REFERENCES assets(id),
            FOREIGN KEY (baseline_id) REFERENCES baselines(id)
        );

        -- ============================================
        -- Comparison window details
        -- ============================================
        CREATE TABLE IF NOT EXISTS comparison_windows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comparison_id INTEGER NOT NULL,
            window_index INTEGER,
            timestamp_ms INTEGER,
            -- Current values
            accel_rms REAL,
            accel_peak REAL,
            temperature_c REAL,
            dominant_freq REAL,
            kurtosis_z REAL,
            -- Baseline values at same index
            baseline_accel_rms REAL,
            baseline_temp REAL,
            baseline_freq REAL,
            -- Differences
            rms_diff_pct REAL,
            temp_diff_c REAL,
            freq_diff_hz REAL,
            -- Per-window anomaly score
            anomaly_score REAL,
            severity TEXT,
            FOREIGN KEY (comparison_id) REFERENCES comparisons(id)
        );
        CREATE INDEX IF NOT EXISTS idx_comp_windows 
            ON comparison_windows(comparison_id);

        -- ============================================
        -- Alerts
        -- ============================================
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            motor_id TEXT DEFAULT 'MOTOR-2HP-001',
            asset_id TEXT NOT NULL DEFAULT 'motor-001',
            comparison_id INTEGER,
            timestamp TEXT DEFAULT (datetime('now')),
            fault_class TEXT,
            human_readable_fault TEXT,
            severity TEXT NOT NULL,
            confidence REAL,
            rms REAL,
            temperature REAL,
            type TEXT DEFAULT 'anomaly',
            message TEXT,
            recommendation TEXT,
            details TEXT,
            status TEXT DEFAULT 'ACTIVE'
        );

        -- ============================================
        -- Maintenance tasks
        -- ============================================
        CREATE TABLE IF NOT EXISTS maintenance_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL DEFAULT 'motor-001',
            alert_id INTEGER,
            title TEXT NOT NULL,
            priority TEXT DEFAULT 'medium',
            assigned_technician TEXT,
            status TEXT DEFAULT 'OPEN',
            due_date TEXT,
            notes TEXT,
            evidence TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- Dynamic Baselines table (Context-Aware Thresholds - STEP 10)
        CREATE TABLE IF NOT EXISTS dynamic_baselines (
            profile TEXT PRIMARY KEY,
            asset_id TEXT NOT NULL,
            baseline_json TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- Insert default assets
        INSERT OR IGNORE INTO assets (id, name, type, location) VALUES 
        ('motor-001', '2 HP CWRU Motor Test Bench', 'motor', 'Laboratory Test Bench'),
        ('MOTOR-2HP-001', '2 HP Motor Bench', 'motor', 'Laboratory Test Bench'),
        ('MOTOR-12V-001', '12 V DC Motor Prototype', 'dc_motor', 'Prototype Bench');
        """)

        # Automatically migrate pre-existing tables to add Stage 5 columns if missing
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(alerts)")
        existing_cols = [row[1] for row in cursor.fetchall()]

        alert_columns = [
            ('motor_id', "TEXT DEFAULT 'MOTOR-2HP-001'"),
            ('fault_class', "TEXT"),
            ('human_readable_fault', "TEXT"),
            ('confidence', "REAL"),
            ('rms', "REAL"),
            ('temperature', "REAL"),
            ('recommendation', "TEXT")
        ]

        for col_name, col_type in alert_columns:
            if col_name not in existing_cols:
                try:
                    cursor.execute(f"ALTER TABLE alerts ADD COLUMN {col_name} {col_type}")
                except Exception:
                    pass

    print("Database initialized successfully.")

# --- Dynamic Baselines Persistence (STEP 10) ---

def save_dynamic_baseline(profile: str, asset_id: str, baseline_dict: dict):
    """Save or update dynamic baseline state in SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO dynamic_baselines (profile, asset_id, baseline_json, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(profile) DO UPDATE SET
                asset_id = excluded.asset_id,
                baseline_json = excluded.baseline_json,
                updated_at = excluded.updated_at
        """, (profile, asset_id, json.dumps(baseline_dict)))

def load_dynamic_baseline(profile: str):
    """Load dynamic baseline state from SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT baseline_json FROM dynamic_baselines WHERE profile = ?", (profile,))
        row = cursor.fetchone()
        if row and row['baseline_json']:
            try:
                return json.loads(row['baseline_json'])
            except Exception:
                return None
    return None

# --- Stage 5 Helper Functions ---

def _enrich_alert_row(row_dict: dict) -> dict:
    """Helper to parse JSON details into baseline_context."""
    if not row_dict:
        return row_dict
    details = row_dict.get('details')
    if details and isinstance(details, str):
        try:
            parsed = json.loads(details)
            if isinstance(parsed, dict):
                row_dict['baseline_context'] = parsed
                row_dict['dynamic_thresholds'] = parsed
        except Exception:
            pass
    return row_dict

def create_alert(alert_data: dict) -> dict:
    """Create and persist a new alert in SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        raw_details = alert_data.get('details') or alert_data.get('baseline_context') or {}
        details_str = json.dumps(raw_details) if isinstance(raw_details, (dict, list)) else str(raw_details)
        cursor.execute("""
            INSERT INTO alerts (
                motor_id, asset_id, timestamp, fault_class, human_readable_fault, 
                severity, confidence, rms, temperature, message, recommendation, details, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_data.get('motor_id', 'MOTOR-2HP-001'),
            alert_data.get('asset_id', 'motor-001'),
            alert_data.get('timestamp', datetime.now(timezone.utc).isoformat()),
            alert_data.get('fault_class'),
            alert_data.get('human_readable_fault'),
            alert_data.get('severity', 'WARNING'),
            alert_data.get('confidence', 0.0),
            alert_data.get('rms', 0.0),
            alert_data.get('temperature', 28.0),
            alert_data.get('message', ''),
            alert_data.get('recommendation', ''),
            details_str,
            alert_data.get('status', 'ACTIVE')
        ))
        alert_id = cursor.lastrowid
        return get_alert_by_id(alert_id)

def get_alert_by_id(alert_id: int) -> dict:
    """Fetch alert dict by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
        row = cursor.fetchone()
        return _enrich_alert_row(dict(row)) if row else None

def get_alerts(limit: int = 50, status: str = None, severity: str = None) -> list:
    """Fetch list of alerts with optional status/severity filtering."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM alerts WHERE 1=1"
        params = []
        if status:
            query += " AND (status = ? OR (status = 'ACTIVE' AND ? = 'new'))"
            params.extend([status, status])
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [_enrich_alert_row(dict(r)) for r in rows]

def get_active_alerts() -> list:
    """Fetch currently active un-resolved alerts (status = ACTIVE or ACKNOWLEDGED)."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM alerts WHERE status IN ('ACTIVE', 'ACKNOWLEDGED', 'new') ORDER BY id DESC")
        rows = cursor.fetchall()
        return [_enrich_alert_row(dict(r)) for r in rows]

def update_alert_status(alert_id: int, new_status: str) -> dict:
    """Update status of an alert (e.g. ACKNOWLEDGED, RESOLVED)."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET status = ? WHERE id = ?", (new_status, alert_id))
        return get_alert_by_id(alert_id)

def create_maintenance_task(task_data: dict) -> dict:
    """Create and persist a new maintenance task in SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO maintenance_tasks (
                asset_id, alert_id, title, priority, assigned_technician, status, due_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task_data.get('asset_id', 'motor-001'),
            task_data.get('alert_id'),
            task_data.get('title', 'Routine Maintenance'),
            task_data.get('priority', 'medium'),
            task_data.get('assigned_technician', 'Unassigned'),
            task_data.get('status', 'OPEN'),
            task_data.get('due_date'),
            task_data.get('notes', '')
        ))
        task_id = cursor.lastrowid
        return get_maintenance_task_by_id(task_id)

def get_maintenance_task_by_id(task_id: int) -> dict:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM maintenance_tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_maintenance_tasks() -> list:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM maintenance_tasks ORDER BY id DESC")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

def update_maintenance_task(task_id: int, updates: dict) -> dict:
    with get_db() as conn:
        cursor = conn.cursor()
        set_clauses = []
        params = []
        for k, v in updates.items():
            if k in ['title', 'priority', 'assigned_technician', 'status', 'due_date', 'notes']:
                set_clauses.append(f"{k} = ?")
                params.append(v)
        if set_clauses:
            set_clauses.append("updated_at = datetime('now')")
            params.append(task_id)
            cursor.execute(f"UPDATE maintenance_tasks SET {', '.join(set_clauses)} WHERE id = ?", params)
        return get_maintenance_task_by_id(task_id)
    
    print("Database initialized successfully.")


if __name__ == '__main__':
    init_database()
    print(f"Database created at: {DB_PATH}")
