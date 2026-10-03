"""
main.py - Complete Backend API for AI Infrastructure Monitor

Features:
- Real-time sensor data via simulator
- SQLite database storage
- Baseline recording and management
- Live data vs baseline comparison
- Anomaly detection with scoring
- Alert generation
- WebSocket for real-time dashboard updates
"""

import os
import sys
import json
import time
import asyncio
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

# Local modules
try:
    from database import (
        init_database, get_db, create_alert, get_alerts, get_active_alerts, 
        update_alert_status, create_maintenance_task, get_maintenance_tasks, update_maintenance_task
    )
    from simulator import SimulatorManager, MotorSimulator
    import ai_engine
    import severity_engine
    from dynamic_thresholds import threshold_engine
except ModuleNotFoundError:
    from backend.database import (
        init_database, get_db, create_alert, get_alerts, get_active_alerts, 
        update_alert_status, create_maintenance_task, get_maintenance_tasks, update_maintenance_task
    )
    from backend.simulator import SimulatorManager, MotorSimulator
    from backend import ai_engine
    from backend import severity_engine
    from backend.dynamic_thresholds import threshold_engine

# ============================================
# App State
# ============================================
sim_manager = SimulatorManager()
ws_clients = set()
latest_data = {}
comparison_results = {}
latest_hardware_telemetry = None
last_hardware_ping = 0
last_alert_state = {
    "fault_class": None,
    "severity": None,
    "timestamp": 0,
    "alert_id": None
}

def is_hardware_live() -> bool:
    return (time.time() * 1000 - last_hardware_ping) < 5000

# ============================================
# Pydantic Models
# ============================================

class ConditionRequest(BaseModel):
    condition: str = 'Normal_1'
    speed_rpm: Optional[int] = 1500

class SimulationConditionRequest(BaseModel):
    condition: str = 'Normal_1'
    speed_multiplier: Optional[float] = 1.0

class SimulationSpeedRequest(BaseModel):
    speed_multiplier: float = 1.0

class BaselineRequest(BaseModel):
    name: str = 'baseline'
    condition: str = 'healthy'
    speed_rpm: int = 1500
    duration_seconds: int = 10

class ComparisonRequest(BaseModel):
    baseline_id: int
    duration_seconds: int = 5

class AlertRule(BaseModel):
    asset_id: str = 'motor-001'
    vibration_threshold: float = 0.15
    temperature_threshold: float = 60.0

class MaintenanceTaskCreate(BaseModel):
    asset_id: str = 'motor-001'
    alert_id: Optional[int] = None
    title: str
    priority: str = 'medium'
    assigned_technician: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class MaintenanceTaskUpdate(BaseModel):
    status: Optional[str] = None
    assigned_technician: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    evidence: Optional[str] = None

# ============================================
# Lifespan
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown."""
    init_database()
    sim_manager.start('Normal_1', 1.0)
    
    # Start background task for WebSocket broadcasting
    broadcast_task = asyncio.create_task(broadcast_loop())
    
    yield
    
    sim_manager.stop()
    broadcast_task.cancel()

# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="AI Infrastructure Monitor",
    description="Real-time sensor monitoring with baseline comparison",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Background Broadcast Loop
# ============================================

# ============================================
# Background Broadcast Loop & Alert Deduplication Engine
# ============================================

def check_and_create_alert(sample: dict) -> Optional[dict]:
    """
    Evaluates incoming telemetry with severity_engine and implements alert deduplication.
    Generates a new alert ONLY when:
    - Fault class changes
    - Severity changes
    - Cooldown (300 seconds / 5 min) expires
    - No active alert exists for active fault
    """
    global last_alert_state
    if not sample or 'ai_prediction' not in sample or not sample['ai_prediction']:
        return None

    try:
        ai_pred = sample['ai_prediction']
        pred_class = ai_pred.get('predicted_class') or sample.get('fault_class') or 'Normal_1'
        confidence = float(ai_pred.get('confidence') or 0.0)

        features = {
            'rms': float(sample.get('rms') if sample.get('rms') is not None else sample.get('accel_rms', 0.0)),
            'sd': float(sample.get('sd') or 0.0),
            'kurtosis': float(sample.get('kurtosis') or 0.0),
            'crest': float(sample.get('crest') or 0.0),
            'max': float(sample.get('max') or 0.0),
            'min': float(sample.get('min') or 0.0),
            'skewness': float(sample.get('skewness') or 0.0),
        }

        severity_info = severity_engine.get_fault_severity(pred_class, confidence, features)
        severity = severity_info['severity']

        # Context-aware dynamic threshold evaluation
        baseline_ctx = sample.get('baseline_context') or threshold_engine.evaluate(sample)

        # If dynamic baseline detects a severe anomaly that elevates severity
        if baseline_ctx.get('status') == 'CRITICAL' and severity == 'WARNING':
            severity = 'CRITICAL'

        if severity == 'NORMAL' and baseline_ctx.get('status') in ['NORMAL', 'LEARNING']:
            last_alert_state['fault_class'] = 'Normal_1'
            last_alert_state['severity'] = 'NORMAL'
            return None

        now = time.time()
        cooldown_seconds = 300.0  # 5 minutes for prototype deduplication

        class_changed = (pred_class != last_alert_state.get('fault_class'))
        severity_changed = (severity != last_alert_state.get('severity'))
        cooldown_expired = (now - last_alert_state.get('timestamp', 0)) > cooldown_seconds

        if class_changed or severity_changed or cooldown_expired:
            profile_name = sample.get("profile_name") or sim_manager.active_profile
            motor_id = sample.get("motor_id") or ("MOTOR-12V-001" if profile_name == "dc_motor_12v" else "MOTOR-2HP-001")
            asset_id = sample.get("asset_id") or ("MOTOR-12V-001" if profile_name == "dc_motor_12v" else "MOTOR-2HP-001")

            alert_payload = {
                "motor_id": motor_id,
                "asset_id": asset_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "fault_class": pred_class,
                "human_readable_fault": severity_info['human_readable_fault'],
                "severity": severity,
                "confidence": confidence,
                "rms": features['rms'],
                "temperature": float(sample.get('simulated_temperature') or sample.get('temperature_c') or 28.0),
                "message": f"{severity_info['human_readable_fault']} ({pred_class}) - {severity_info['action_summary']}",
                "recommendation": baseline_ctx.get('directive') or severity_info['recommendation'],
                "details": baseline_ctx,
                "baseline_context": baseline_ctx,
                "status": "ACTIVE"
            }

            new_alert = create_alert(alert_payload)
            last_alert_state = {
                "fault_class": pred_class,
                "severity": severity,
                "timestamp": now,
                "alert_id": new_alert['id']
            }
            print(f"[ALERT CREATED] #{new_alert['id']} - {pred_class} ({severity})")
            return new_alert

    except Exception as err:
        print(f"[ALERT ERROR] {err}")

    return None

async def broadcast_loop():
    """Broadcast telemetry at 20 Hz / 500ms and stream alert WebSocket events on deduplicated alerts."""
    while True:
        try:
            reading = latest_hardware_telemetry if is_hardware_live() else sim_manager.get_latest()
            if reading:
                # Evaluate context-aware dynamic thresholds
                try:
                    threshold_engine.evaluate(reading)
                except Exception:
                    pass

                # 1. Check for deduplicated alert event
                new_alert = check_and_create_alert(reading)

                # 2. Broadcast telemetry message
                if ws_clients:
                    telemetry_msg = json.dumps({
                        'type': 'telemetry',
                        'data': reading
                    })
                    
                    alert_msg = json.dumps({
                        'type': 'alert',
                        'data': new_alert
                    }) if new_alert else None

                    disconnected = set()
                    for client in ws_clients:
                        try:
                            await client.send_text(telemetry_msg)
                            if alert_msg:
                                await client.send_text(alert_msg)
                        except Exception:
                            disconnected.add(client)
                    ws_clients -= disconnected
        except asyncio.CancelledError:
            break
        except Exception:
            pass
        await asyncio.sleep(0.5)

# ============================================
# WebSocket
# ============================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    ws_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client messages if needed
    except WebSocketDisconnect:
        ws_clients.discard(websocket)

# ============================================
# AI Engine Endpoints (Stage 2 & 5)
# ============================================

@app.get("/api/ai/status")
async def get_ai_status_endpoint(profile: Optional[str] = Query(None)):
    profile_to_use = profile or sim_manager.active_profile
    return ai_engine.get_ai_status(profile_to_use)

@app.post("/api/ai/predict")
async def predict_ai_endpoint(req: dict, profile: Optional[str] = Query(None)):
    features = req.get("features", req)
    prof = profile or req.get("profile") or sim_manager.active_profile
    return ai_engine.predict(features, profile=prof)

# ============================================
# Sensor / Simulator Endpoints
# ============================================

@app.get("/api/sensor/current")
async def get_current_sensor():
    """Get the latest sensor reading."""
    reading = latest_hardware_telemetry if is_hardware_live() else sim_manager.get_latest()
    if not reading:
        raise HTTPException(404, "No sensor data yet")
    return reading

@app.post("/api/telemetry/esp32")
async def receive_esp32_telemetry(data: dict):
    """Receive HTTP POST telemetry from ESP32 hardware or test script."""
    global latest_hardware_telemetry, last_hardware_ping
    last_hardware_ping = time.time() * 1000
    
    # Check if payload is for 12V DC motor profile
    if data.get("profile") == "dc_motor_12v" or "current_samples" in data or "curr_rms" in data:
        return await receive_esp32_dc_telemetry(data)

    # ESP32 currently has a digital vibration sensor.
    # Map its raw state into the telemetry structure expected by the dashboard.
    raw_accel_rms = (
        data.get("accel_rms")
        if data.get("accel_rms") is not None
        else data.get("vibration_raw")
    )

    accel_rms = float(raw_accel_rms) if raw_accel_rms is not None else None

    # For the current digital vibration sensor, use the same
    # value as the peak representation.
    accel_peak = accel_rms

    # Accept both the dashboard field name (temperature_c)
    # and the simple ESP32 field name (temperature)
    raw_temperature = (
        data.get("temperature_c")
        if data.get("temperature_c") is not None
        else data.get("temperature")
    )

    temperature_c = float(raw_temperature) if raw_temperature is not None else None
    battery_v = float(data["battery_v"]) if "battery_v" in data and data["battery_v"] is not None else None
    kurtosis = float(data["kurtosis"]) if "kurtosis" in data and data["kurtosis"] is not None else None
    skewness = float(data["skewness"]) if "skewness" in data and data["skewness"] is not None else None
    device_id = data.get("device_id", "ESP32-MOTOR-001")
    
    latest_hardware_telemetry = {
        "accel_rms": accel_rms,
        "accel_peak": accel_peak,
        "temperature_c": temperature_c,
        "vibration": bool(data.get("vibration", False)),
        "vibration_raw": data.get("vibration_raw"),
        "battery_v": battery_v,
        "kurtosis": kurtosis,
        "skewness": skewness,
        "device_id": device_id,
        "mode": "LIVE HARDWARE",
        "source": "hardware",
        "timestamp_ms": int(time.time() * 1000),
        "asset_id": "motor-001"
    }
    
    try:
        ai_res = ai_engine.predict(latest_hardware_telemetry)
        latest_hardware_telemetry["ai_ml_prediction"] = ai_res
        if ai_res.get("severity") in ["critical", "warning"]:
            with get_db() as conn:
                conn.execute(
                    "INSERT INTO alerts (asset_id, severity, type, message) VALUES (?, ?, ?, ?)",
                    ('motor-001', ai_res.get("severity"), 'hardware_anomaly', f"[LIVE HARDWARE] {ai_res.get('predicted_class')}: {ai_res.get('recommendation')}")
                )
    except Exception:
        pass
        
    return {
        "status": "ok",
        "mode": "LIVE HARDWARE",
        "hardware_ping": True,
        "telemetry": latest_hardware_telemetry
    }

@app.post("/api/telemetry/esp32/dc")
async def receive_esp32_dc_telemetry(data: dict):
    """
    Receive HTTP POST telemetry from real ESP32 + Hall-effect current sensor setup for 12 V DC Motor.
    Accepts raw current samples ('current_samples': [...]) or pre-computed 8 DC features.
    """
    global latest_hardware_telemetry, last_hardware_ping
    last_hardware_ping = time.time() * 1000

    device_id = data.get("device_id", "ESP32-DC-001")
    raw_v = data.get("voltage_v") if "voltage_v" in data else data.get("voltage")
    voltage = float(raw_v) if raw_v is not None else None

    raw_c = data.get("current_a") if "current_a" in data else data.get("current")
    current = float(raw_c) if raw_c is not None else None

    raw_speed = data.get("speed_rpm")
    speed_rpm = float(raw_speed) if raw_speed is not None else None

    raw_pwm = data.get("pwm")
    pwm = float(raw_pwm) if raw_pwm is not None else None

    raw_vib = data.get("vibration_rms") if "vibration_rms" in data else data.get("accel_rms")
    vib_rms = float(raw_vib) if raw_vib is not None else None

    power = round(voltage * current, 2) if (voltage is not None and current is not None) else None
    raw_temp = data.get("temperature_c")
    temp_c = float(raw_temp) if raw_temp is not None else None

    try:
        ai_res = ai_engine.predict(data, profile="dc_motor_12v")
    except ValueError as ve:
        raise HTTPException(400, f"ESP32 Payload Error: {str(ve)}")
    except Exception as e:
        raise HTTPException(500, f"DC Motor AI Inference Error: {str(e)}")

    telemetry_packet = {
        "timestamp_ms": int(time.time() * 1000),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "hardware",
        "mode": "LIVE HARDWARE (12 V DC Motor)",
        "device_id": device_id,
        "motor_id": "MOTOR-12V-001",
        "asset_id": "MOTOR-12V-001",
        "profile_name": "dc_motor_12v",
        "fault_class": ai_res.get("predicted_class"),
        "ground_truth": "LIVE_ESP32",
        
        "voltage": round(voltage, 2) if voltage is not None else None,
        "current": round(current, 3) if current is not None else None,
        "power": power,
        "speed_rpm": round(speed_rpm, 1) if speed_rpm is not None else None,
        "pwm": round(pwm, 1) if pwm is not None else None,
        "vibration_rms": round(vib_rms, 4) if vib_rms is not None else None,
        
        "accel_rms": round(vib_rms, 4) if vib_rms is not None else None,
        "accel_peak": round(vib_rms * 1.414, 4) if vib_rms is not None else None,
        "temperature_c": round(temp_c, 1) if temp_c is not None else None,
        "battery_v": round(voltage, 2) if voltage is not None else None,
        
        "ai_prediction": {
            "predicted_class": ai_res.get("predicted_class"),
            "confidence": ai_res.get("confidence"),
            "status": ai_res.get("status"),
            "severity": ai_res.get("severity"),
            "condition_score": ai_res.get("condition_score"),
            "anomaly_score": ai_res.get("anomaly_score"),
            "score_label": ai_res.get("score_label", "model-based condition score"),
            "recommendation": ai_res.get("recommendation", "")
        }
    }

    latest_hardware_telemetry = telemetry_packet
    sim_manager.set_profile("dc_motor_12v")

    if ai_res.get("severity") in ["critical", "warning"]:
        try:
            with get_db() as conn:
                conn.execute(
                    "INSERT INTO alerts (asset_id, severity, type, message) VALUES (?, ?, ?, ?)",
                    ('MOTOR-12V-001', ai_res.get("severity"), 'dc_hardware_anomaly', f"[LIVE HARDWARE DC] {ai_res.get('predicted_class')}: {ai_res.get('recommendation')}")
                )
        except Exception:
            pass

    return {
        "status": "ok",
        "mode": "LIVE HARDWARE (12 V DC Motor)",
        "device_id": device_id,
        "features": ai_res.get("features"),
        "prediction": ai_res,
        "telemetry": telemetry_packet
    }

@app.get("/api/ai/status")
async def get_ai_status_endpoint():
    """Get active AI model status, version, and metadata."""
    return ai_engine.get_ai_status()

@app.get("/api/ai/predict")
async def get_ai_predict(profile: Optional[str] = Query(None)):
    """Get AI ML model prediction for current sensor telemetry."""
    sample = latest_hardware_telemetry if is_hardware_live() else sim_manager.get_latest()
    if not sample:
        sample = {"accel_rms": 0.032, "accel_peak": 0.048, "temperature_c": 28.5}
    prof = profile or sample.get("profile_name") or sim_manager.active_profile
    try:
        return ai_engine.predict(sample, profile=prof)
    except Exception as e:
        raise HTTPException(400, f"AI prediction error: {str(e)}")

@app.post("/api/ai/predict")
async def post_ai_predict(payload: dict, profile: Optional[str] = Query(None)):
    """Run AI ML model prediction on actual feature input vector or dictionary."""
    prof = profile or payload.get("profile") or sim_manager.active_profile
    try:
        return ai_engine.predict(payload, profile=prof)
    except ValueError as ve:
        raise HTTPException(400, f"Feature Validation Error: {str(ve)}")
    except Exception as e:
        raise HTTPException(500, f"AI Inference Error: {str(e)}")

@app.get("/api/sensor/history")
async def get_sensor_history(count: int = Query(100, ge=1, le=5000)):
    """Get recent sensor readings."""
    return sim_manager.get_buffer(count)

# ============================================
# Simulation Control Endpoints (Stage 3)
# ============================================

@app.get("/api/simulation/status")
async def get_simulation_status():
    """Get current simulator status, ground truth condition, sequence, and speed."""
    return sim_manager.get_status()

@app.post("/api/simulation/start")
async def start_simulation(req: Optional[SimulationConditionRequest] = None):
    """Start dataset replay simulation."""
    cond = req.condition if req else 'Normal_1'
    speed = req.speed_multiplier if (req and req.speed_multiplier) else 1.0
    sim_manager.start(condition=cond, speed_multiplier=speed)
    return {"status": "ok", "message": "Simulation started", "simulation": sim_manager.get_status()}

@app.post("/api/simulation/stop")
async def stop_simulation():
    """Stop dataset replay simulation."""
    sim_manager.stop()
    return {"status": "ok", "message": "Simulation stopped", "simulation": sim_manager.get_status()}

@app.post("/api/simulation/pause")
async def pause_simulation():
    """Pause dataset replay simulation."""
    sim_manager.pause()
    return {"status": "ok", "message": "Simulation paused", "simulation": sim_manager.get_status()}

@app.post("/api/simulation/resume")
async def resume_simulation():
    """Resume dataset replay simulation."""
    sim_manager.resume()
    return {"status": "ok", "message": "Simulation resumed", "simulation": sim_manager.get_status()}

@app.post("/api/simulation/reset")
async def reset_simulation():
    """Reset simulation sequence counter and row index."""
    sim_manager.reset()
    return {"status": "ok", "message": "Simulation reset", "simulation": sim_manager.get_status()}

@app.post("/api/simulation/condition")
async def set_simulation_condition(req: SimulationConditionRequest):
    """Set simulation motor fault condition class."""
    try:
        sim_manager.set_condition(req.condition)
        if req.speed_multiplier:
            sim_manager.set_speed(req.speed_multiplier)
        reading = sim_manager.get_latest()
        if reading:
            check_and_create_alert(reading)
        return {"status": "ok", "condition": req.condition, "simulation": sim_manager.get_status()}
    except ValueError as ve:
        raise HTTPException(400, str(ve))

@app.post("/api/simulation/speed")
async def set_simulation_speed(req: SimulationSpeedRequest):
    """Set simulation replay speed multiplier (e.g. 0.5, 1.0, 2.0, 5.0, 10.0)."""
    try:
        sim_manager.set_speed(req.speed_multiplier)
        return {"status": "ok", "speed_multiplier": req.speed_multiplier, "simulation": sim_manager.get_status()}
    except ValueError as ve:
        raise HTTPException(400, str(ve))

@app.post("/api/sensor/condition")
async def set_condition(req: ConditionRequest):
    """Change the motor condition (supports dataset classes and legacy aliases)."""
    try:
        sim_manager.set_condition(req.condition)
        return {"status": "ok", "condition": req.condition, "simulation": sim_manager.get_status()}
    except ValueError as ve:
        raise HTTPException(400, str(ve))

@app.get("/api/motor-profile")
async def get_motor_profile():
    """Get active motor profile status."""
    return {
        "active_profile": sim_manager.active_profile,
        "profiles": [
            {"id": "cwru_2hp", "name": "2 HP Motor Bench", "asset_id": "MOTOR-2HP-001"},
            {"id": "dc_motor_12v", "name": "12 V DC Motor Prototype", "asset_id": "MOTOR-12V-001"}
        ],
        "ai_status": ai_engine.get_ai_status(sim_manager.active_profile)
    }

@app.post("/api/motor-profile")
async def set_motor_profile(payload: dict):
    """Set active motor profile ('cwru_2hp' or 'dc_motor_12v')."""
    global latest_hardware_telemetry
    profile = payload.get("profile") or payload.get("asset_id") or payload.get("profile_name")
    if not profile:
        raise HTTPException(400, "Profile name or asset_id required.")
    
    latest_hardware_telemetry = None

    if profile in ["dc_motor_12v", "MOTOR-12V-001", "12V_DC"]:
        sim_manager.set_profile("dc_motor_12v")
    else:
        sim_manager.set_profile("cwru_2hp")
        
    return {
        "status": "ok",
        "active_profile": sim_manager.active_profile,
        "asset_id": "MOTOR-12V-001" if sim_manager.active_profile == "dc_motor_12v" else "MOTOR-2HP-001",
        "ai_status": ai_engine.get_ai_status(sim_manager.active_profile)
    }

@app.get("/api/sensor/conditions")
async def list_conditions():
    """List available motor conditions for current profile."""
    if sim_manager.active_profile == "dc_motor_12v":
        return {
            "conditions": [
                {"id": "Normal Operation", "name": "Normal Operation", "type": "baseline", "description": "Normal steady-state operation"},
                {"id": "Loose Foundation", "name": "Loose Foundation", "type": "mechanical", "description": "Mechanically loosened foundation mount"},
                {"id": "Suboptimal Control (Speed Reg)", "name": "Suboptimal Control (Speed Reg)", "type": "control", "description": "Detuned speed-regulator gain coefficient"},
                {"id": "Suboptimal Control (Speed+Current Reg)", "name": "Suboptimal Control (Speed+Current Reg)", "type": "control", "description": "Detuned speed and current-regulator gain coefficients"}
            ]
        }
    return {
        "conditions": [
            {"id": "Normal_1", "name": "Normal Operation", "type": "baseline", "description": "Baseline healthy 2 HP motor"},
            {"id": "Ball_007_1", "name": "Ball Defect 0.007\"", "type": "bearing", "description": "Mild ball fault"},
            {"id": "Ball_014_1", "name": "Ball Defect 0.014\"", "type": "bearing", "description": "Moderate ball fault"},
            {"id": "Ball_021_1", "name": "Ball Defect 0.021\"", "type": "bearing", "description": "Severe ball fault"},
            {"id": "IR_007_1", "name": "Inner Race Defect 0.007\"", "type": "bearing", "description": "Mild inner race fault"},
            {"id": "IR_014_1", "name": "Inner Race Defect 0.014\"", "type": "bearing", "description": "Moderate inner race fault"},
            {"id": "IR_021_1", "name": "Inner Race Defect 0.021\"", "type": "bearing", "description": "Severe inner race fault"},
            {"id": "OR_007_6_1", "name": "Outer Race Defect 0.007\"", "type": "bearing", "description": "Mild outer race fault"},
            {"id": "OR_014_6_1", "name": "Outer Race Defect 0.014\"", "type": "bearing", "description": "Moderate outer race fault"},
            {"id": "OR_021_6_1", "name": "Outer Race Defect 0.021\"", "type": "bearing", "description": "Severe outer race fault"},
        ]
    }

# ============================================
# Baseline Endpoints
# ============================================

@app.post("/api/baselines/record")
async def record_baseline(req: BaselineRequest):
    """Record a new baseline by simulating motor data."""
    # Temporarily set condition
    old_condition = sim_manager.simulator.condition
    old_speed = sim_manager.simulator.speed_rpm
    
    sim_manager.set_condition(req.condition, req.speed_rpm)
    time.sleep(0.5)  # Let simulator stabilize
    
    # Generate baseline data
    baseline_data = sim_manager.generate_baseline(req.duration_seconds)
    
    # Restore previous condition
    sim_manager.set_condition(old_condition, old_speed)
    
    # Store in database
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO baselines (
                asset_id, name, speed, sample_count,
                accel_rms_mean, accel_rms_std, accel_rms_min, accel_rms_max,
                accel_peak_mean, accel_peak_std,
                temp_mean, temp_std, temp_min, temp_max,
                dominant_freq_mean, dominant_freq_std,
                band_energy_low_mean, band_energy_mid_mean, band_energy_high_mean,
                kurtosis_mean, kurtosis_std
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'motor-001', req.name, req.speed_rpm, baseline_data['sample_count'],
            baseline_data['accel_rms_mean'], baseline_data['accel_rms_std'],
            baseline_data['accel_rms_min'], baseline_data['accel_rms_max'],
            baseline_data['accel_peak_mean'], baseline_data['accel_peak_std'],
            baseline_data['temp_mean'], baseline_data['temp_std'],
            baseline_data['temp_min'], baseline_data['temp_max'],
            baseline_data['dominant_freq_mean'], baseline_data['dominant_freq_std'],
            baseline_data['band_energy_low_mean'], baseline_data['band_energy_mid_mean'],
            baseline_data['band_energy_high_mean'],
            baseline_data['kurtosis_mean'], baseline_data['kurtosis_std']
        ))
        baseline_id = cursor.lastrowid
        
        # Store individual samples for detailed comparison
        for i, sample in enumerate(baseline_data['samples']):
            conn.execute("""
                INSERT INTO baseline_windows (
                    baseline_id, window_index, accel_rms_x, accel_rms_y, accel_rms_z,
                    accel_peak, kurtosis_z, crest_factor_z, dominant_freq,
                    band_energy_low, band_energy_mid, band_energy_high, temperature_c
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                baseline_id, i,
                sample.get('accel_rms', 0), 0, 0,
                sample.get('accel_peak', 0), 0, 0, 0,
                0, 0, 0, sample.get('temperature_c', 25)
            ))
    
    return {
        "status": "ok",
        "baseline_id": baseline_id,
        "name": req.name,
        "condition": req.condition,
        "speed_rpm": req.speed_rpm,
        "sample_count": baseline_data['sample_count'],
        "stats": {
            "accel_rms_mean": baseline_data['accel_rms_mean'],
            "accel_rms_std": baseline_data['accel_rms_std'],
            "temp_mean": baseline_data['temp_mean'],
            "temp_std": baseline_data['temp_std'],
        }
    }

@app.get("/api/baselines")
async def list_baselines():
    """List all recorded baselines."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM baselines WHERE is_active=1 ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]

@app.get("/api/baselines/{baseline_id}")
async def get_baseline(baseline_id: int):
    """Get baseline details."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM baselines WHERE id=?", (baseline_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Baseline not found")
        return dict(row)

@app.delete("/api/baselines/{baseline_id}")
async def delete_baseline(baseline_id: int):
    """Delete a baseline."""
    with get_db() as conn:
        conn.execute("DELETE FROM baseline_windows WHERE baseline_id=?", (baseline_id,))
        conn.execute("DELETE FROM baselines WHERE id=?", (baseline_id,))
    return {"status": "deleted"}

# ============================================
# Context-Aware Dynamic Thresholds Endpoints (STEP 10)
# ============================================

@app.get("/api/dynamic-thresholds")
async def get_dynamic_thresholds(profile: Optional[str] = Query(None)):
    """Fetch context-aware baseline and dynamic threshold configuration for the specified profile."""
    prof = profile or sim_manager.active_profile
    reading = latest_hardware_telemetry if is_hardware_live() else sim_manager.get_latest()
    if reading and (reading.get("profile_name") == prof or reading.get("profile") == prof):
        eval_ctx = threshold_engine.evaluate(reading)
        return eval_ctx
    return threshold_engine.get_profile_baseline(prof)

class DynamicThresholdResetRequest(BaseModel):
    profile: Optional[str] = None

@app.post("/api/dynamic-thresholds/reset")
async def reset_dynamic_thresholds(req: DynamicThresholdResetRequest = None):
    """Reset dynamic thresholds baseline for learning recalibration."""
    prof = req.profile if req and req.profile else sim_manager.active_profile
    return threshold_engine.reset_profile_baseline(prof)

# ============================================
# Comparison Endpoints (THE KEY FEATURE)
# ============================================

@app.post("/api/compare")
async def run_comparison(req: ComparisonRequest):
    """
    Compare current motor state against a stored baseline.
    This is the core comparison feature.
    """
    # Get baseline
    with get_db() as conn:
        baseline = conn.execute(
            "SELECT * FROM baselines WHERE id=?", (req.baseline_id,)
        ).fetchone()
        if not baseline:
            raise HTTPException(404, "Baseline not found")
        baseline = dict(baseline)
    
    # Save current condition, switch temporarily if needed
    old_condition = sim_manager.simulator.condition
    
    # Generate current data samples
    current_samples = []
    for _ in range(req.duration_seconds * sim_manager.samples_per_second):
        current_samples.append(sim_manager.simulator.generate_sample())
    
    # Compute current statistics
    rms_vals = [s['accel_rms'] for s in current_samples]
    peak_vals = [s['accel_peak'] for s in current_samples]
    temp_vals = [s['temperature_c'] for s in current_samples]
    
    current_rms_mean = float(np.mean(rms_vals))
    current_rms_std = float(np.std(rms_vals))
    current_peak_mean = float(np.mean(peak_vals))
    current_temp_mean = float(np.mean(temp_vals))
    current_temp_std = float(np.std(temp_vals))
    
    # === Compute differences ===
    rms_diff = current_rms_mean - baseline['accel_rms_mean']
    rms_diff_pct = (rms_diff / (baseline['accel_rms_mean'] + 1e-10)) * 100
    
    temp_diff = current_temp_mean - baseline['temp_mean']
    
    peak_diff = current_peak_mean - baseline['accel_peak_mean']
    peak_diff_pct = (peak_diff / (baseline['accel_peak_mean'] + 1e-10)) * 100
    
    kurtosis_diff = 0  # Simplified
    
    # === Anomaly score (0-1, higher = more anomalous) ===
    # Normalized difference score
    rms_zscore = abs(rms_diff) / (baseline['accel_rms_std'] + 1e-10)
    temp_zscore = abs(temp_diff) / (baseline['temp_std'] + 1e-10)
    
    anomaly_score = min(1.0, (rms_zscore * 0.4 + temp_zscore * 0.3 + 
                              abs(peak_diff_pct) / 100 * 0.3))
    
    # === Health score (0-100) ===
    health_score = max(0, min(100, 100 - anomaly_score * 100))
    
    # === Severity ===
    if anomaly_score > 0.7:
        severity = 'critical'
    elif anomaly_score > 0.4:
        severity = 'high'
    elif anomaly_score > 0.15:
        severity = 'warning'
    else:
        severity = 'normal'
    
    # === Explanation ===
    explanations = []
    if abs(rms_diff_pct) > 20:
        direction = "increased" if rms_diff > 0 else "decreased"
        explanations.append(f"Vibration RMS has {direction} by {abs(rms_diff_pct):.1f}% compared to baseline")
    if temp_diff > 5:
        explanations.append(f"Temperature is {temp_diff:.1f}°C above baseline ({current_temp_mean:.1f}°C vs {baseline['temp_mean']:.1f}°C)")
    elif temp_diff < -5:
        explanations.append(f"Temperature is {abs(temp_diff):.1f}°C below baseline")
    if abs(peak_diff_pct) > 30:
        explanations.append(f"Peak vibration changed by {abs(peak_diff_pct):.1f}%")
    if not explanations:
        explanations.append("All measurements are within normal range compared to baseline")
    
    # === Per-window comparison ===
    window_count = min(len(current_samples), len(current_samples) // 10 + 1)
    window_step = max(1, len(current_samples) // window_count)
    window_comparisons = []
    
    for i in range(0, len(current_samples), window_step):
        chunk = current_samples[i:i+window_step]
        if not chunk:
            continue
        chunk_rms = float(np.mean([s['accel_rms'] for s in chunk]))
        chunk_temp = float(np.mean([s['temperature_c'] for s in chunk]))
        chunk_peak = float(np.mean([s['accel_peak'] for s in chunk]))
        
        w_rms_diff = ((chunk_rms - baseline['accel_rms_mean']) / (baseline['accel_rms_mean'] + 1e-10)) * 100
        w_temp_diff = chunk_temp - baseline['temp_mean']
        w_anomaly = min(1.0, abs(w_rms_diff) / 50 * 0.5 + abs(w_temp_diff) / 20 * 0.5)
        
        w_severity = 'normal'
        if w_anomaly > 0.7: w_severity = 'critical'
        elif w_anomaly > 0.4: w_severity = 'high'
        elif w_anomaly > 0.15: w_severity = 'warning'
        
        window_comparisons.append({
            'index': len(window_comparisons),
            'accel_rms': round(chunk_rms, 6),
            'accel_peak': round(chunk_peak, 6),
            'temperature_c': round(chunk_temp, 2),
            'baseline_rms': round(baseline['accel_rms_mean'], 6),
            'baseline_temp': round(baseline['temp_mean'], 2),
            'rms_diff_pct': round(w_rms_diff, 2),
            'temp_diff_c': round(w_temp_diff, 2),
            'anomaly_score': round(w_anomaly, 4),
            'severity': w_severity,
        })
    
    # === Store comparison in database ===
    feature_diffs = json.dumps({
        'rms_diff_pct': round(rms_diff_pct, 2),
        'peak_diff_pct': round(peak_diff_pct, 2),
        'temp_diff': round(temp_diff, 2),
        'rms_zscore': round(rms_zscore, 2),
        'temp_zscore': round(temp_zscore, 2),
    })
    
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO comparisons (
                asset_id, baseline_id, name, status,
                overall_health_score, anomaly_score, severity,
                vibration_diff_pct, vibration_baseline_rms, vibration_current_rms,
                temperature_diff_c, temperature_baseline_mean, temperature_current_mean,
                feature_diffs, explanation, sample_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'motor-001', req.baseline_id, f"Comparison vs {baseline['name']}", 'completed',
            health_score, anomaly_score, severity,
            round(rms_diff_pct, 2), baseline['accel_rms_mean'], current_rms_mean,
            round(temp_diff, 2), baseline['temp_mean'], current_temp_mean,
            feature_diffs, ' | '.join(explanations), len(current_samples)
        ))
        comparison_id = cursor.lastrowid
        
        # Store window details
        for wc in window_comparisons:
            conn.execute("""
                INSERT INTO comparison_windows (
                    comparison_id, window_index, accel_rms, accel_peak, temperature_c,
                    baseline_accel_rms, baseline_temp, rms_diff_pct, temp_diff_c,
                    anomaly_score, severity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                comparison_id, wc['index'], wc['accel_rms'], wc['accel_peak'], wc['temperature_c'],
                wc['baseline_rms'], wc['baseline_temp'], wc['rms_diff_pct'], wc['temp_diff_c'],
                wc['anomaly_score'], wc['severity']
            ))
        
        # Generate alert if needed
        if severity in ['high', 'critical']:
            conn.execute("""
                INSERT INTO alerts (asset_id, comparison_id, severity, type, message, details)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                'motor-001', comparison_id, severity,
                'anomaly_detected',
                f"Anomaly detected: {' | '.join(explanations)}",
                feature_diffs
            ))
    
    # Broadcast comparison result via WebSocket
    result = {
        'comparison_id': comparison_id,
        'baseline_name': baseline['name'],
        'health_score': health_score,
        'anomaly_score': round(anomaly_score, 4),
        'severity': severity,
        'vibration': {
            'baseline_rms': round(baseline['accel_rms_mean'], 6),
            'current_rms': round(current_rms_mean, 6),
            'diff_pct': round(rms_diff_pct, 2),
            'baseline_peak': round(baseline['accel_peak_mean'], 6),
            'current_peak': round(current_peak_mean, 6),
            'peak_diff_pct': round(peak_diff_pct, 2),
        },
        'temperature': {
            'baseline_mean': round(baseline['temp_mean'], 2),
            'current_mean': round(current_temp_mean, 2),
            'diff_c': round(temp_diff, 2),
            'baseline_std': round(baseline['temp_std'], 2),
            'current_std': round(current_temp_std, 2),
        },
        'explanations': explanations,
        'windows': window_comparisons,
    }
    
    return result

@app.get("/api/comparisons")
async def list_comparisons(limit: int = Query(20, ge=1, le=100)):
    """List recent comparisons."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM comparisons ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        results = []
        for r in rows:
            d = dict(r)
            if d.get('feature_diffs'):
                d['feature_diffs'] = json.loads(d['feature_diffs'])
            results.append(d)
        return results

@app.get("/api/comparisons/{comp_id}")
async def get_comparison(comp_id: int):
    """Get comparison details with window data."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM comparisons WHERE id=?", (comp_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Comparison not found")
        result = dict(row)
        if result.get('feature_diffs'):
            result['feature_diffs'] = json.loads(result['feature_diffs'])
        
        windows = conn.execute(
            "SELECT * FROM comparison_windows WHERE comparison_id=? ORDER BY window_index",
            (comp_id,)
        ).fetchall()
        result['windows'] = [dict(w) for w in windows]
        return result

# ============================================
# Alert Endpoints (Stage 5)
# ============================================

@app.get("/api/alerts/active")
async def list_active_alerts():
    return get_active_alerts()

@app.get("/api/alerts")
async def list_alerts(limit: int = Query(50), status: Optional[str] = None, severity: Optional[str] = None):
    return get_alerts(limit=limit, status=status, severity=severity)

@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert_endpoint(alert_id: int):
    alert = update_alert_status(alert_id, 'ACKNOWLEDGED')
    if not alert:
        raise HTTPException(404, "Alert not found")
    return alert

@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert_endpoint(alert_id: int):
    alert = update_alert_status(alert_id, 'RESOLVED')
    if not alert:
        raise HTTPException(404, "Alert not found")
    return alert

# ============================================
# Assets Endpoints
# ============================================

@app.get("/api/assets")
async def list_assets():
    """List all monitored assets with latest health context."""
    reading = sim_manager.get_latest()
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM assets").fetchall()
        assets = [dict(r) for r in rows]
        latest_comp = conn.execute("SELECT * FROM comparisons ORDER BY created_at DESC LIMIT 1").fetchone()
        open_alerts = conn.execute("SELECT COUNT(*) FROM alerts WHERE status='new'").fetchone()[0]
        
        for asset in assets:
            if asset['id'] == 'motor-001':
                asset['health_score'] = latest_comp['overall_health_score'] if latest_comp else 100
                asset['anomaly_score'] = latest_comp['anomaly_score'] if latest_comp else 0.0
                asset['severity'] = latest_comp['severity'] if latest_comp else 'normal'
                asset['open_alerts'] = open_alerts
                asset['latest_telemetry'] = reading
                asset['condition'] = sim_manager.simulator.condition
            else:
                asset['health_score'] = 98
                asset['anomaly_score'] = 0.02
                asset['severity'] = 'normal'
                asset['open_alerts'] = 0
        return assets

@app.get("/api/assets/{asset_id}")
async def get_asset(asset_id: str):
    """Get single asset detail with historical trends."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM assets WHERE id=?", (asset_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Asset not found")
        asset = dict(row)
        reading = sim_manager.get_latest() if asset_id == 'motor-001' else None
        comps = conn.execute("SELECT * FROM comparisons WHERE asset_id=? ORDER BY created_at DESC LIMIT 10", (asset_id,)).fetchall()
        alerts = conn.execute("SELECT * FROM alerts WHERE asset_id=? ORDER BY timestamp DESC LIMIT 10", (asset_id,)).fetchall()
        tasks = conn.execute("SELECT * FROM maintenance_tasks WHERE asset_id=? ORDER BY created_at DESC LIMIT 10", (asset_id,)).fetchall()
        
        asset['latest_telemetry'] = reading
        asset['recent_comparisons'] = [dict(c) for c in comps]
        asset['recent_alerts'] = [dict(a) for a in alerts]
        asset['maintenance_tasks'] = [dict(t) for t in tasks]
        return asset

# ============================================
# Maintenance Endpoints
# ============================================

@app.get("/api/maintenance")
async def list_maintenance(status: Optional[str] = None, technician: Optional[str] = None):
    """List maintenance tasks."""
    with get_db() as conn:
        query = "SELECT * FROM maintenance_tasks"
        params = []
        conds = []
        if status:
            conds.append("status=?")
            params.append(status)
        if technician:
            conds.append("assigned_technician=?")
            params.append(technician)
        if conds:
            query += " WHERE " + " AND ".join(conds)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]

@app.post("/api/maintenance")
async def create_maintenance(req: MaintenanceTaskCreate):
    """Create a new maintenance task."""
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO maintenance_tasks (
                asset_id, alert_id, title, priority, assigned_technician, due_date, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
        """, (
            req.asset_id, req.alert_id, req.title, req.priority, req.assigned_technician, req.due_date, req.notes
        ))
        task_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM maintenance_tasks WHERE id=?", (task_id,)).fetchone()
        return dict(row)

@app.patch("/api/maintenance/{task_id}")
async def update_maintenance(task_id: int, req: MaintenanceTaskUpdate):
    """Update maintenance task details or stage."""
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM maintenance_tasks WHERE id=?", (task_id,)).fetchone()
        if not existing:
            raise HTTPException(404, "Maintenance task not found")
        
        fields = []
        params = []
        if req.status is not None:
            fields.append("status=?")
            params.append(req.status)
        if req.assigned_technician is not None:
            fields.append("assigned_technician=?")
            params.append(req.assigned_technician)
        if req.priority is not None:
            fields.append("priority=?")
            params.append(req.priority)
        if req.due_date is not None:
            fields.append("due_date=?")
            params.append(req.due_date)
        if req.notes is not None:
            fields.append("notes=?")
            params.append(req.notes)
        if req.evidence is not None:
            fields.append("evidence=?")
            params.append(req.evidence)
            
        if fields:
            fields.append("updated_at=datetime('now')")
            query = f"UPDATE maintenance_tasks SET {', '.join(fields)} WHERE id=?"
            params.append(task_id)
            conn.execute(query, params)
            
        row = conn.execute("SELECT * FROM maintenance_tasks WHERE id=?", (task_id,)).fetchone()
        return dict(row)

# ============================================
# Dashboard Stats
# ============================================

@app.get("/api/stats")
async def get_stats():
    """Get dashboard summary statistics."""
    hardware_live = is_hardware_live()
    reading = latest_hardware_telemetry if hardware_live else sim_manager.get_latest()
    condition = sim_manager.simulator.condition
    
    try:
        ai_pred = ai_engine.predict(reading or {})
    except Exception:
        ai_pred = None
    
    with get_db() as conn:
        baseline_count = conn.execute("SELECT COUNT(*) FROM baselines WHERE is_active=1").fetchone()[0]
        comparison_count = conn.execute("SELECT COUNT(*) FROM comparisons").fetchone()[0]
        alert_count = conn.execute("SELECT COUNT(*) FROM alerts WHERE status='new'").fetchone()[0]
        latest_row = conn.execute(
            "SELECT * FROM comparisons ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
        
    latest_comparison = dict(latest_row) if latest_row else None
    if latest_comparison:
        latest_comparison['health_score'] = latest_comparison.get('overall_health_score', 94)
    else:
        is_h = condition == 'healthy'
        latest_comparison = {
            'health_score': 94 if is_h else 35,
            'overall_health_score': 94 if is_h else 35,
            'anomaly_score': 0.08 if is_h else 0.78,
            'severity': 'normal' if is_h else 'critical',
            'explanations': ['System operating within normal baseline parameters'] if is_h else ['Abnormal vibration RMS and temperature detected']
        }
    
    return {
        'current_condition': condition,
        'mode': 'LIVE HARDWARE' if hardware_live else 'SIMULATION MODE',
        'is_hardware_live': hardware_live,
        'sensor': reading,
        'baselines_count': baseline_count,
        'comparisons_count': comparison_count,
        'open_alerts': alert_count,
        'latest_comparison': latest_comparison,
        'ai_ml_prediction': ai_pred,
        'dynamic_thresholds': reading.get('baseline_context') if reading else threshold_engine.get_profile_baseline(sim_manager.active_profile)
    }

# ============================================
# Health Check
# ============================================

@app.get("/api")
async def api_info():
    return {"message": "AI Infrastructure Monitor API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok", "simulator_running": sim_manager.running}

# Mount static files for dashboard (Serves compiled dist/ if available, else raw dashboard/)
dist_dir = Path(__file__).parent.parent / "dashboard" / "dist"
dashboard_dir = dist_dir if dist_dir.exists() else (Path(__file__).parent.parent / "dashboard")
if dashboard_dir.exists():
    app.mount("/", StaticFiles(directory=str(dashboard_dir), html=True), name="dashboard")


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
