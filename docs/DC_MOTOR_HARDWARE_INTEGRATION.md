# 12 V DC Motor Hardware Integration Guide (ESP32 + Hall-Effect Current Sensor)

This document specifies the exact communication protocol, hardware payload schema, feature extraction contracts, and operational verification procedures for integrating physical ESP32 microcontrollers with the InfraMonitor 12 V DC Motor AI pipeline (`dc_motor_12v`).

---

## A. ESP32 → FastAPI Communication Format

- **Protocol**: HTTP/1.1 POST or WebSocket Stream
- **Ingestion Endpoint**: `POST /api/telemetry/esp32/dc` (or `POST /api/telemetry/esp32`)
- **Content-Type**: `application/json`
- **Recommended Ingestion Rate**: 1 Hz to 10 Hz (Telemetry window updates)

---

## B. Sensor Fields and Units

| Field Name | Type | Unit | Description | Mandatory? |
| :--- | :--- | :--- | :--- | :--- |
| `device_id` | String | - | Identifier for physical ESP32 (e.g. `ESP32-DC-001`) | Yes |
| `current_samples` | Array[Float] | Amperes (A) | Raw current waveform samples (or raw ADC readings scaled to Amperes) | Yes (or pre-computed features) |
| `voltage_v` | Float | Volts (V) | Armature supply voltage | Optional (Defaults to `12.0 V`) |
| `current_a` | Float | Amperes (A) | Instantaneous / Mean armature current | Optional (Derived if missing) |
| `speed_rpm` | Float | RPM | Tachometer / Encoder measured speed | Optional (Defaults to `1200.0`) |
| `pwm` | Float | 0–255 | PWM duty cycle driving motor transistor/driver | Optional (Defaults to `150.0`) |
| `vibration_rms` | Float | g | Accelerometer vibration RMS | Optional (Defaults to `0.012 g`) |

---

## C. Current-Sampling Requirements

- **Sampling Rate ($f_s$)**: 1 kHz – 10 kHz (minimum 1 kHz recommended for capturing thyristor/driver ripple harmonics).
- **Window Length ($N$)**: 100 to 1000 samples per window (Minimum acceptable sample count: **32 samples**).
- **Scaling / Calibration**:
  $$I_{Amps} = \frac{V_{ADC\_volts} - V_{zero\_offset}}{Sensitivity_{V/A}}$$
- **Window Identification**: Each POST request represents exactly one complete time-domain window.

---

## D. Feature Calculation Requirements

The backend extracts the **exact 8 production electrical features** in canonical order:

1. **`curr_mean`**: Mean armature current
   $$\mu_I = \frac{1}{N} \sum_{i=1}^{N} I_i$$

2. **`curr_rms`**: Root Mean Square current
   $$RMS_I = \sqrt{\frac{1}{N} \sum_{i=1}^{N} I_i^2}$$

3. **`curr_std`**: Standard deviation of current
   $$\sigma_I = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (I_i - \mu_I)^2}$$

4. **`curr_peak`**: Maximum absolute peak current
   $$Peak_I = \max_{i} |I_i|$$

5. **`curr_p2p`**: Peak-to-peak current range
   $$P2P_I = \max_{i} (I_i) - \min_{i} (I_i)$$

6. **`curr_crest_factor`**: Ratio of peak to RMS current (with $\epsilon = 10^{-9}$ numerical safety)
   $$CF_I = \frac{Peak_I}{RMS_I + 10^{-9}}$$

7. **`curr_fft_peak`**: Maximum magnitude of Real FFT on DC-subtracted AC component
   $$FFT_{peak} = \max \left| \mathcal{F}(I_i - \mu_I) \right|$$

8. **`curr_fft_mean`**: Average magnitude of Real FFT spectral components
   $$FFT_{mean} = \text{mean} \left| \mathcal{F}(I_i - \mu_I) \right|$$

---

## E. Example ESP32 JSON Payload

### Option 1: Sending Raw Current Sample Array (Recommended)

```json
{
  "device_id": "ESP32-DC-001",
  "voltage_v": 12.05,
  "current_a": 0.94,
  "current_samples": [
    0.912, 0.945, 0.938, 0.952, 0.941, 0.930, 0.925, 0.948,
    0.955, 0.934, 0.928, 0.942, 0.950, 0.936, 0.929, 0.944,
    0.951, 0.937, 0.931, 0.946, 0.953, 0.935, 0.927, 0.941,
    0.949, 0.939, 0.933, 0.947, 0.954, 0.938, 0.930, 0.945
  ],
  "speed_rpm": 1150.0,
  "pwm": 145.0,
  "vibration_rms": 0.012
}
```

### Option 2: Sending Pre-Computed 8 Features (If computed on ESP32)

```json
{
  "device_id": "ESP32-DC-001",
  "profile": "dc_motor_12v",
  "voltage_v": 12.05,
  "current_a": 0.94,
  "curr_mean": 0.940,
  "curr_rms": 0.987,
  "curr_std": 0.045,
  "curr_peak": 1.102,
  "curr_p2p": 0.280,
  "curr_crest_factor": 1.116,
  "curr_fft_peak": 12.42,
  "curr_fft_mean": 1.15,
  "speed_rpm": 1150.0,
  "pwm": 145.0,
  "vibration_rms": 0.012
}
```

---

## F. Example Backend Response

```json
{
  "status": "ok",
  "mode": "LIVE HARDWARE (12 V DC Motor)",
  "device_id": "ESP32-DC-001",
  "features": {
    "curr_mean": 0.94,
    "curr_rms": 0.987,
    "curr_std": 0.045,
    "curr_peak": 1.102,
    "curr_p2p": 0.28,
    "curr_crest_factor": 1.116,
    "curr_fft_peak": 12.42,
    "curr_fft_mean": 1.15
  },
  "prediction": {
    "predicted_class": "Normal Operation",
    "confidence": 0.98,
    "status": "HEALTHY",
    "is_healthy": true,
    "severity": "normal",
    "condition_score": 98.0,
    "anomaly_score": 0.02,
    "score_label": "model-based condition score",
    "recommendation": "All motor vibration and electrical metrics are within nominal Operating Bounds. No maintenance required.",
    "inference_time_ms": 0.85
  },
  "telemetry": {
    "timestamp_ms": 1725430000000,
    "source": "hardware",
    "mode": "LIVE HARDWARE (12 V DC Motor)",
    "device_id": "ESP32-DC-001",
    "motor_id": "MOTOR-12V-001",
    "asset_id": "MOTOR-12V-001",
    "voltage": 12.05,
    "current": 0.94,
    "power": 11.33,
    "speed_rpm": 1150.0,
    "pwm": 145.0,
    "vibration_rms": 0.012
  }
}
```

---

## G. Wiring and Data-Flow Assumptions

1. **Hardware Wiring**:
   - Hall-Effect Current Sensor (e.g. ACS712 / ACS724 or INA219) connected to ESP32 Analog Input Pin (e.g. `GPIO34` / ADC1).
   - ESP32 Wi-Fi connected to the local network hosting the FastAPI backend.
2. **Data-Flow Architecture**:
   `[ESP32 Current Sensor]` $\xrightarrow{\text{HTTP POST JSON}}$ `[FastAPI /api/telemetry/esp32/dc]` $\xrightarrow{\text{8-Feature Extraction}}$ `[dc_motor_12v RF Model]` $\xrightarrow{\text{WebSocket Broadcast}}$ `[React Dashboard]`

---

## H. Commands to Start System

- **Start Backend API**:
  ```powershell
  python backend/main.py
  ```
- **Start Frontend Dashboard**:
  ```powershell
  npm run dev
  ```

---

## I. Tomorrow's Test Procedure

1. Power on ESP32 and target 12 V DC Motor bench.
2. Verify API accessibility from ESP32: `GET http://<SERVER_IP>:8000/health`.
3. Send test payload via `curl` or Postman to `POST http://<SERVER_IP>:8000/api/telemetry/esp32/dc`.
4. Confirm dashboard automatically switches mode banner to **`● LIVE HARDWARE (12 V DC Motor)`**.
5. Observe live Voltage, Current, Power, RPM, PWM, and AI Condition predictions on `http://localhost:3000`.
