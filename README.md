# 🛡️ MotorGuard AI: Predictive Infrastructure Monitoring System
**Industrial Rotating Machinery Health & Edge-Assisted Anomaly Detection Platform**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Bundler-Vite%208-646CFF.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-success.svg)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Repository Description**: An industrial-grade AI & IoT predictive maintenance platform for rotating machinery (induction motors & DC testbenches). Integrates ESP32 edge telemetry, statistical vibration & current feature extraction, sub-millisecond neural network inference, dynamic operating envelopes ($\mu \pm k\sigma$), and an interactive real-time control-room dashboard.

---

### 🚀 Instant Deployment & Hosting Quicklinks
| Method | Command / Action | Output URL |
| :--- | :--- | :--- |
| **Local Run (Unified)** | `start.bat` *(Windows)* or `./start.sh` *(Linux/Mac)* | `http://localhost:8000` |
| **Docker Container** | `docker-compose up -d --build` | `http://localhost:8000` |
| **Frontend Static** | Built into `dashboard/dist` (GitHub Pages Action included) | `https://<username>.github.io/<repo>/` |
| **1-Click Cloud (Render)** | Deploy blueprint via `render.yaml` | Cloud-hosted FastAPI + React app |

---

## 📑 Comprehensive Documentation Index

1. [Project Overview](#1-project-overview)
2. [Complete System Architecture](#2-complete-system-architecture)
3. [Hardware Specifications & Physical Wiring](#3-hardware-specifications--physical-wiring)
4. [Datasets & Data Engineering](#4-datasets--data-engineering)
5. [Feature Extraction Mathematical Formulations](#5-feature-extraction-mathematical-formulations)
6. [Machine Learning Models & Architectures](#6-machine-learning-models--architectures)
7. [DC Motor ML Diagnostic Pipeline](#7-dc-motor-ml-diagnostic-pipeline)
8. [2 HP Induction Motor (CWRU) Diagnostic Pipeline](#8-2-hp-induction-motor-cwru-diagnostic-pipeline)
9. [Live Telemetry & Communication Architecture](#9-live-telemetry--communication-architecture)
10. [Two-Laptop Distributed Deployment Architecture](#10-two-laptop-distributed-deployment-architecture)
11. [Database Schema & Persistence Architecture](#11-database-schema--persistence-architecture)
12. [Dashboard Architecture & Page Specifications](#12-dashboard-architecture--page-specifications)
13. [Context-Aware Dynamic Thresholds Engine](#13-context-aware-dynamic-thresholds-engine)
14. [Explainable Context-Rich Alerts & Deduplication](#14-explainable-context-rich-alerts--deduplication)
15. [Edge-First vs. Local Server Architecture](#15-edge-first-vs-local-server-architecture)
16. [Multi-Speed Adaptive Modeling (Status & Analysis)](#16-multi-speed-adaptive-modeling-status--analysis)
17. [End-to-End Data Flow Scenarios](#17-end-to-end-data-flow-scenarios)
18. [Codebase & Repository File Structure](#18-codebase--repository-file-structure)
19. [API & WebSocket Technical Reference](#19-api--websocket-technical-reference)
20. [System Configuration & Network Parameters](#20-system-configuration--network-parameters)
21. [Step-by-Step Execution Guide (Windows / Linux)](#21-step-by-step-execution-guide-windows--linux)
22. [Troubleshooting & Operational Recovery](#22-troubleshooting--operational-recovery)
23. [Innovation Features: Verification Breakdown](#23-innovation-features-verification-breakdown)
24. [Viva / Project Review 2-Minute Defense Script](#24-viva--project-review-2-minute-defense-script)
25. [Comprehensive Viva Examination Q&A (35 Questions)](#25-comprehensive-viva-examination-qa-35-questions)
26. [Technical Limitations & Design Boundaries](#26-technical-limitations--design-boundaries)
27. [IMPORTANT: VERIFIED VS PROPOSED AUDIT MATRIX](#27-important-verified-vs-proposed-audit-matrix)

---

## 1. Project Overview

### What MotorGuard AI Does
**MotorGuard AI** is an industrial condition-monitoring and predictive maintenance (PdM) platform designed to detect mechanical and electrical faults in rotating electric motors before catastrophic failure occurs. The system unifies physical microcontroller-based sensor acquisition, statistical signal processing, edge feature extraction, machine learning classification, automated alert generation, baseline deviation tracking, and a real-time operations dashboard.

### The Problem Being Solved
Unplanned downtime of industrial electric motors accounts for billions of dollars in industrial manufacturing losses annually. Traditional maintenance operates under two suboptimal regimes:
1. **Run-to-failure (Reactive Maintenance)**: Equipment is run until it breaks, causing expensive collateral machinery damage, safety hazards, and unscheduled production outages.
2. **Calendar-based (Preventative Maintenance)**: Equipment is disassembled or components replaced at fixed time intervals regardless of actual physical wear, wasting operational component life and introducing human assembly errors.

MotorGuard AI implements **Condition-Based Predictive Maintenance (CBM/PdM)**. By continuously monitoring electrical waveforms (current) and mechanical signatures (vibration), the system detects micro-defects—such as rolling element spalls, loose foundations, and detuned motor drive regulators—at their earliest inception.

### Main Objective
1. Ingest real-time electrical telemetry from physical **ESP32** microcontrollers coupled to motor sensor hardware.
2. Provide pre-trained dual Machine Learning pipelines for two distinct machine profiles:
   - **2 HP Industrial Induction Motor**: 10-class bearing defect classification using high-frequency vibration signatures.
   - **12 V DC Motor Test Bench**: 4-class mechanical loosening and drive controller detuning diagnosis using motor current waveforms.
3. Compute dynamic statistical operating envelopes ($\mu \pm k\cdot\sigma$) that adapt to machine speed and load setpoints.
4. Provide a zero-cloud, 100% local, resilient control-room dashboard for factory technicians and reliability engineers.

### Key Features
- **Dual Motor Profile Support**: Instantaneous zero-reload toggling between high-voltage CWRU induction motor benchmarks and low-voltage physical 12 V DC testbenches.
- **Microsecond AI Inference**: Pre-trained Neural Network (`MLPClassifier`) and Random Forest models executing within 0.05 ms to 0.85 ms per sample.
- **Real-Time WebSocket Pipeline**: 20 Hz (50 ms) live telemetry streaming to web clients with automatic reconnect logic.
- **Smart Alert Deduplication Engine**: Sliding-window deduplication (5-minute cooldown) preventing operator notification fatigue while escalating on state changes.
- **Context-Aware Baseline Enveloping**: Statistical baseline estimation rejecting faulty samples online to prevent reference corruption.
- **Air-Gapped / Offline Guaranteed**: Operates entirely over local LAN or direct Wi-Fi hotspots without requiring external internet or third-party cloud subscriptions.

---

## 2. Complete System Architecture

MotorGuard AI is designed as a distributed, 4-tier industrial IoT monitoring architecture:

```
[ PHYSICAL MOTOR ASSET ] 
       │ (Vibration, Armature Current, Temperature, Speed)
       ▼
[ TIER 1: HARDWARE & EDGE SENSING ]
  ├── ESP32 Microcontroller (32-bit Xtensa Dual-Core @ 240 MHz)
  ├── ACS712-05B Hall-Effect Current Sensor (Analog ADC1_CH6 -> GPIO 34)
  ├── MPU6050 / ADXL345 I2C Accelerometer (SDA: GPIO 21, SCL: GPIO 22)
  └── Fast ADC Waveform Sampling (1 kHz, 64-sample windowing buffer)
       │
       │ HTTP/1.1 POST JSON over 802.11 b/g/n Wi-Fi (Local LAN)
       ▼
[ TIER 2: BACKEND SERVER & INGESTION ] (FastAPI / Python 3.10+ / Uvicorn)
  ├── POST /api/telemetry/esp32/dc & POST /api/telemetry/esp32
  ├── Active Profile Dispatcher ('cwru_2hp' vs. 'dc_motor_12v')
  ├── Dataset Replay Simulator (Continuous ground-truth playback when hardware offline)
  └── SQLite Persistence Engine (infra_monitor.db - WAL Mode)
       │
       ├──► [ FEATURE EXTRACTION SUBSYSTEM ]
       │      ├── Vibration: RMS, SD, Kurtosis, Crest Factor, Max, Min, Skewness
       │      └── Current: Mean, RMS, Std, Peak, P2P, Crest Factor, FFT Peak, FFT Mean
       │
       ├──► [ MACHINE LEARNING INFERENCE ENGINE ]
       │      ├── CWRU 2 HP: StandardScaler -> MLP Neural Network (32, 16) -> 10 Fault Classes
       │      └── DC Motor:  StandardScaler -> Random Forest (100 Trees) -> 4 Operational Classes
       │
       ├──► [ CONTEXT-AWARE DYNAMIC THRESHOLD ENGINE ]
       │      ├── Statistical Envelope: Lower/Upper Warning (2σ), Critical (3σ)
       │      └── Operational Context Scaling: PWM / RPM scaling factor
       │
       └──► [ SEVERITY & DEDUPLICATION ENGINE ]
              └── Severity: NORMAL / WARNING / CRITICAL -> 300s Deduplication Cooldown
       │
       │ WebSocket Broadcast (/ws) @ 20 Hz + Async REST APIs
       ▼
[ TIER 3: WEB CONTROL ROOM DASHBOARD ] (React 19 / Vite / Native CSS)
  ├── Real-time Oscilloscope & Spectrum Views
  ├── Live Fault Diagnosis & Class Probability Distributions
  ├── Context-Aware Envelope Overlays & Deviation Trends
  └── Work Order Creation, Asset Registry & Maintenance Kanban
```

### The Complete End-to-End Data Flow

```
1. Physical Current Sensor / Accelerometer
   └── Analog Hall-effect voltage signal generated across transducer.
2. ESP32 Analog-to-Digital Converter (ADC)
   └── Samples analog voltage at 1 kHz; applies calibration scaling into Amperes.
3. ESP32 Wi-Fi HTTP Client
   └── Encapsulates 64-sample time window into JSON payload; dispatches HTTP POST.
4. FastAPI Ingestion Endpoint (/api/telemetry/esp32/dc)
   └── Validates payload schema; checks packet timestamp; routes to active profile handler.
5. Digital Signal Feature Extraction (ai_engine.py)
   └── Computes statistical time-domain moments and real-valued FFT frequency metrics.
6. Scikit-Learn StandardScaler
   └── Scales canonical feature vector using pre-fitted training distribution parameters.
7. Machine Learning Classifier
   └── Executes forward inference; generates predicted class index and softmax class probabilities.
8. Severity & Threshold Engine
   └── Evaluates prediction against operational rules and dynamic standard-deviation envelope.
9. Database Storage (database.py)
   └── Persists alerts, baselines, and comparison sessions into SQLite.
10. WebSocket Server (/ws)
    └── Streams JSON packet containing telemetry, AI diagnosis, and baseline context to clients.
11. React 19 Frontend Dashboard
    └── Unpacks WebSocket payload; updates state; renders high-frequency oscilloscope charts.
```

---

## 3. Hardware Specifications & Physical Wiring

MotorGuard AI supports physical microcontroller telemetry through **ESP32** firmware located in `esp32_firmware/`.

### Microcontroller Specifications
- **Model**: ESP32-WROOM-32 / ESP32 DevKit v1
- **Architecture**: Xtensa Dual-Core 32-bit LX6 Microprocessor
- **Clock Frequency**: 240 MHz
- **Onboard Peripherals**: 12-bit SAR ADC (up to 18 channels), I2C, SPI, UART, 802.11 b/g/n Wi-Fi, Bluetooth v4.2 BR/EDR and BLE.

### Sensor Pinout & Interface Mapping

| Sensor Subsystem | Hardware Part Number | Communication Interface | ESP32 Pin Connection | Measured Parameter | Physical Units |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Armature Current** | ACS712-05B / INA219 | Analog ADC / I2C | **GPIO 34** (ADC1_CH6) or **GPIO 21/22** | Motor current draw | Amperes ($A$) |
| **Vibration** | MPU6050 / ADXL345 | I2C Protocol | **SDA: GPIO 21, SCL: GPIO 22** | 3-axis acceleration | $g$ ($9.81 \text{ m/s}^2$) |
| **Temperature** | DS18B20 / TMP117 | Dallas 1-Wire | **GPIO 4** (4.7 k$\Omega$ pull-up) | Casing surface temp | Celsius ($^\circ\text{C}$) |
| **Battery / Rail Voltage** | Resistor Voltage Divider | Analog ADC | **GPIO 35** (ADC1_CH7) | DC supply voltage | Volts ($V$) |
| **Optical Tachometer** | Slot-type Optocoupler | GPIO Interrupt | **GPIO 18** (RISING interrupt) | Shaft rotation frequency| Revolutions/min (RPM)|
| **Motor Ground** | Direct Wire | Electrical Common | **GND** | Circuit reference | $0 \text{ V}$ Common |

> [!IMPORTANT]
> **Common Ground Requirement**: When measuring a 12 V DC motor, the negative terminal of the 12 V external DC power supply **MUST** be tied directly to the ESP32 GND pin. Failure to establish a common ground causes ADC floating voltages and erratic current readings.

### Sampling Rates & Firmware Windows
1. **12 V DC Motor Firmware (`esp32_dc_motor_monitor.ino`)**:
   - **ADC Sampling Interval**: `1000 microseconds` ($1 \text{ kHz}$ sampling rate).
   - **Window Size (`SAMPLE_COUNT`)**: `64 samples` per packet.
   - **Ingestion Cadence**: Transmits every `200 ms` ($5 \text{ Hz}$ packet dispatch).
   - **Calibration Constants**:
     - ADC VREF: $3.3 \text{ V}$ (12-bit resolution: 0 to 4095).
     - Sensor Zero Offset: $1.65 \text{ V}$ (quiescent output at $0 \text{ A}$).
     - Sensitivity: $0.185 \text{ V/A}$ ($185 \text{ mV/A}$ for ACS712-05B).
     - Clamping: Noise below $0.02 \text{ A}$ is clamped to $0.0 \text{ A}$.

2. **Induction Motor Monitor Firmware (`esp32_motor_monitor.ino`)**:
   - **Sampling Window**: `200 samples` per window.
   - **Sampling Delay**: `5 ms` ($\sim 200 \text{ Hz}$ raw sampling).
   - **Computed on ESP32**: Accelerometer RMS ($g$), Peak Acceleration ($g$), Kurtosis estimator.

### Reality Check: Real Hardware Sensors vs. Dashboard Simulated Fields

To maintain technical integrity during project viva defense, distinguish between what is physically measured versus simulated or derived:

| Telemetry Variable | Actual Hardware Source in Firmware | Dashboard / Simulation Status |
| :--- | :--- | :--- |
| **Motor Current (`current_a`, `current_samples`)** | **REAL SENSOR**: Measured via ACS712 on ADC GPIO 34 | Replayed from dataset when hardware node offline |
| **DC Bus Voltage (`voltage_v`)** | **DERIVED / HARDWARE**: 12.0 V constant in sketch (or via GPIO 35 divider) | Simulated constant in CWRU profile |
| **Electrical Power (`power`)** | **DERIVED**: Calculated in backend as $P = V \times I$ | Calculated in backend |
| **Shaft RPM (`speed_rpm`)** | **CONFIGURED / DERIVED**: 1150 RPM baseline in sketch | Simulated or replayed from dataset |
| **CWRU Vibration Waveform** | **NOT MEASURED ON ESP32**: Real CWRU vibration requires lab accelerometers | **DATASET REPLAY**: Replayed from CWRU CSV files |
| **Energy Harvester Voltage (`battery_v`)** | **SYNTHETIC / ADC**: GPIO 34 battery divider in CWRU sketch | Simulated sinusoidal pattern in simulator.py |
| **Motor Temperature (`temperature_c`)** | **OPTIONAL HARDWARE**: DS18B20 code template provided | Model-coupled synthetic drift in simulator.py |

---

## 4. Datasets & Data Engineering

MotorGuard AI utilizes two distinct, rigorously validated scientific datasets representing different machinery categories:

```
                                      MOTORGUARD DATASETS
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
         [ CWRU BEARING DATASET ]                        [ BRUSHED DC SERVO DATASET ]
  • File: feature_time_48k_2048_load_1.csv         • File: Multi-Sensor Condition-Monitoring
  • Origin: Case Western Reserve University        • Machine: 3PI12.12 Brushed PM DC Servo
  • Asset: 2 HP Reliance Electric Induction       • Drive: 4-Quadrant Thyristor Converter
  • Samples: 2,300 feature vectors                 • Samples: 98 full experiment groups
  • Sampling: 48,000 samples/sec raw               • Signals: Armature Current (.bin), WAV, XLS
  • Classes: 10 Bearing Defect States              • Classes: 4 Health / Regulator States
```

---

### Dataset 1: CWRU Bearing Vibration Dataset
- **Full Name**: Case Western Reserve University Bearing Data Center Benchmark.
- **Repository File Location**: `ml/data/feature_time_48k_2048_load_1.csv`.
- **Physical Test Apparatus**:
  - Motor: 2 HP Reliance Electric three-phase induction motor.
  - Dynamometer: Attached to load motor via torque transducer.
  - Accelerometer Placement: Drive End (DE) bearing housing.
  - Raw Sampling Frequency: $48 \text{ kHz}$ ($48,000 \text{ samples/second}$).
  - Operational Load: Load 1 ($1 \text{ HP}$, motor running at $\approx 1772 \text{ RPM}$).
  - Window Slicing: Non-overlapping rectangular windows of $2,048 \text{ raw vibration points}$.
- **Dataset Volume**:
  - Total Sample Rows: **2,300 rows**.
  - Feature Dimensions: 7 time-domain features.
  - Training Set (80% Stratified Split): **1,840 samples**.
  - Testing Set (20% Stratified Split): **460 samples**.
  - Seed: Random Seed 42 with class stratification.
- **Class Breakdown (10 Target Classes, exactly 230 samples each)**:
  1. `Normal_1`: Healthy baseline bearing operation ($0.000''$ fault).
  2. `Ball_007_1`: Ball element defect, $0.007''$ ($7 \text{ mil}$) diameter.
  3. `Ball_014_1`: Ball element defect, $0.014''$ ($14 \text{ mil}$) diameter.
  4. `Ball_021_1`: Ball element defect, $0.021''$ ($21 \text{ mil}$) diameter.
  5. `IR_007_1`: Inner Race defect, $0.007''$ ($7 \text{ mil}$) depth.
  6. `IR_014_1`: Inner Race defect, $0.014''$ ($14 \text{ mil}$) depth.
  7. `IR_021_1`: Inner Race defect, $0.021''$ ($21 \text{ mil}$) depth.
  8. `OR_007_6_1`: Outer Race defect, $0.007''$ ($7 \text{ mil}$) depth, centered at 6 o'clock.
  9. `OR_014_6_1`: Outer Race defect, $0.014''$ ($14 \text{ mil}$) depth, centered at 6 o'clock.
  10. `OR_021_6_1`: Outer Race defect, $0.021''$ ($21 \text{ mil}$) depth, centered at 6 o'clock.

---

### Dataset 2: Multi-Sensor Brushed DC Servo Motor Dataset
- **Full Name**: Multi-Sensor Condition-Monitoring Dataset of a Brushed DC Servo Motor.
- **Repository Directory**: `Multi-Sensor Condition-Monitoring Dataset of a Bru/`.
- **Physical Test Apparatus**:
  - Motor: 3PI12.12 Brushed Permanent-Magnet DC Servo Motor.
  - Ratings: $625 \text{ W}$, rated armature voltage $110 \text{ V DC}$, rated current $12.5 \text{ A}$, rated torque $5.4 \text{ N}\cdot\text{m}$, rated speed $2,000 \text{ RPM}$.
  - Drive: 4-Quadrant Thyristor (SCR) Converter with armature voltage and current regulation.
  - Characteristic Signature: Prominent $300 \text{ Hz}$ converter ripple ($6 \times 50 \text{ Hz}$ fundamental mains frequency).
  - Raw Sensors: Rigol MSO5074 Oscilloscope current binary files (`.bin`), AV-160B vibrometer acoustic waveforms (`.wav`), AV-160B spot vibration readings (`.xls`).
- **Dataset Volume**:
  - Total Raw Files: **386 files** (98 BIN, 98 M4A, 98 WAV, 91 XLS, 1 STP, metadata.csv).
  - Total Experiment Groups: **98 unique experiments** across 13 speed setpoints ($1\%$ to $100\%$ of rated speed).
- **Target Health Classes (4 Operational Classes)**:
  1. `Normal Operation`: Nominal tuning, rigid foundation mount (from `normal_no_reversal` and `normal_with_reversal`).
  2. `Loose Foundation`: Foundation fastening bolts loosened (from `loose_foundation_no_reversal` and `loose_foundation_with_reversal`).
  3. `Suboptimal Control (Speed Reg)`: Detuned, non-optimal proportional-integral speed regulator gain coefficient (`suboptimal_control_*`).
  4. `Suboptimal Control (Speed+Current Reg)`: Dual detuning of both speed-regulator and current-regulator gain coefficients (`suboptimal_control_rt_*`).
- **Complementary Dynamic Telemetry (`MotorsData_rev.xlsx`)**:
  - Replays dynamic step responses (`StepLoaded-MotorA`), pseudo-random binary sequences (`PRBS7-MotorA`), and harmonic disturbances (`Sine10Hz-MotorA`) to model variable speed and load transients.

---

### How Training Data Differs from Live ESP32 Data
| Characteristic | Training Benchmark Datasets | Live ESP32 Telemetry |
| :--- | :--- | :--- |
| **Acquisition Instrument** | High-precision laboratory DAQs (Rigol MSO5074, 48 kHz CWRU DAQ) | Embedded ESP32 SAR ADC (12-bit) / ACS712 Hall Sensor |
| **Bandwidth** | DC up to 24 kHz (Nyquist frequency of 48 kHz CWRU) | DC up to 500 Hz (Nyquist frequency of 1 kHz ADC sampling) |
| **Signal Purity** | Clean laboratory ground with shielded coaxial BNC lines | Subject to breadboard trace noise, supply ripple, ADC non-linearity |
| **Window Structure** | Exact, pre-cut batches of 2,048 samples | Sliding micro-windows of 32 to 64 samples dispatched over Wi-Fi |
| **Feature Extraction** | Offline batch computation in Python (`pandas`, `scipy`) | Real-time stream computation inside `ai_engine.py` |

---

## 5. Feature Extraction Mathematical Formulations

Features convert raw fluctuating time-domain signals into a compact, stationary statistical representation that machine learning classifiers can ingest.

```
RAW TIME-SERIES SAMPLES: x = [x_1, x_2, x_3, ..., x_N]
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
TIME-DOMAIN STATISTICAL MOMENTS    FREQUENCY-DOMAIN SPECTRAL FEATURES
• RMS, Standard Deviation, Peak    • Discrete Fast Fourier Transform (FFT)
• Crest Factor, Kurtosis, Skewness • Spectral Peak, Spectral Mean Energy
```

### 1. Root Mean Square (RMS)
- **Mathematical Formula**:
  $$\text{RMS} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} x_i^2}$$
- **Input Signal**: Vibration acceleration $a(t)$ in $g$, or Armature Current $I(t)$ in $A$.
- **Why It Is Useful**: Represents the overall energy content and effective power of the signal. As bearings pit or foundations loosen, kinetic vibrational energy rises, driving RMS upward.
- **Where Calculated**: `ai_engine.py` (Line 186) & `simulator.py` (Line 123).
- **Nominal Healthy Example**: $0.075 \text{ g}$ (Induction), $0.940 \text{ A}$ (DC Motor).

### 2. Arithmetic Mean
- **Mathematical Formula**:
  $$\mu = \frac{1}{N} \sum_{i=1}^{N} x_i$$
- **Input Signal**: Armature current $I(t)$.
- **Why It Is Useful**: Represents the DC bias component. Crucial for DC motors to determine baseline loading and torque draw.
- **Where Calculated**: `ai_engine.py` (Line 185) & `dynamic_thresholds.py`.
- **Nominal Healthy Example**: $0.940 \text{ A}$ (Unloaded 12 V DC testbench).

### 3. Standard Deviation (SD)
- **Mathematical Formula**:
  $$\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^2}$$
- **Input Signal**: Vibration acceleration $a(t)$ or current $I(t)$.
- **Why It Is Useful**: Quantifies the dynamic dispersion around the mean. Mechanical looseness and torque ripple introduce wider fluctuations, increasing $\sigma$.
- **Where Calculated**: `ai_engine.py` (Line 187) & CWRU feature column `sd`.
- **Nominal Healthy Example**: $0.015 \text{ g}$ (Induction), $0.052 \text{ A}$ (DC Current).

### 4. Peak Acceleration / Peak Current
- **Mathematical Formula**:
  $$x_{\text{peak}} = \max_{i} |x_i|$$
- **Input Signal**: Vibration waveform or current samples.
- **Why It Is Useful**: Identifies the single most extreme transient shock or thyristor switching spike within the sample window.
- **Where Calculated**: `ai_engine.py` (Line 188) & CWRU feature column `max`.
- **Nominal Healthy Example**: $0.112 \text{ g}$ (Healthy), spiking to $>1.20 \text{ g}$ during ball faults.

### 5. Peak-to-Peak (P2P)
- **Mathematical Formula**:
  $$x_{\text{p2p}} = \max(x) - \min(x)$$
- **Input Signal**: Armature current window.
- **Why It Is Useful**: Measures the total envelope width of the signal, highly responsive to rotational imbalance and eccentric load variation.
- **Where Calculated**: `ai_engine.py` (Line 189) using `numpy.ptp()`.
- **Nominal Healthy Example**: $0.280 \text{ A}$.

### 6. Crest Factor
- **Mathematical Formula**:
  $$\text{Crest Factor} = \frac{x_{\text{peak}}}{\text{RMS} + \epsilon} \quad (\epsilon = 10^{-9})$$
- **Input Signal**: Vibration signal or current signal.
- **Why It Is Useful**: Ratio of peak impact to steady-state RMS energy. Early-stage bearing faults produce sharp, spiky impacts (high Crest Factor, low overall RMS). In severe late-stage wear, RMS increases and Crest Factor drops.
- **Where Calculated**: `ai_engine.py` (Line 190) & CWRU column `crest`.
- **Nominal Healthy Example**: $3.85$ (Vibration), $1.35$ (Current).

### 7. Kurtosis
- **Mathematical Formula**:
  $$\text{Kurtosis} = \frac{\frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^4}{\left( \frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^2 \right)^2}$$
- **Input Signal**: High-frequency vibration signal.
- **Why It Is Useful**: Measures the "tailedness" of the probability distribution. A healthy motor exhibits a Gaussian distribution ($\text{Kurtosis} \approx 3.0$). Repetitive metallic impacts from bearing surface cracks generate heavy-tailed distributions with Kurtosis exceeding $5.0$ to $20.0$.
- **Where Calculated**: CWRU column `kurtosis` & `esp32_motor_monitor.ino` (Line 124).
- **Nominal Healthy Example**: $3.10$ (Healthy), escalating to $8.50+$ under inner race damage.

### 8. Skewness
- **Mathematical Formula**:
  $$\text{Skewness} = \frac{\frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^3}{\left( \frac{1}{N} \sum_{i=1}^{N} (x_i - \mu)^2 \right)^{3/2}}$$
- **Input Signal**: Vibration acceleration.
- **Why It Is Useful**: Quantifies distributional asymmetry. Unidirectional rubbing or horizontal shaft misalignments pull the vibration distribution to one side.
- **Where Calculated**: CWRU column `skewness`.
- **Nominal Healthy Example**: $\pm 0.05$ (Symmetrical).

### 9. Real FFT Spectral Peak (`curr_fft_peak`)
- **Mathematical Formula**:
  $$X_k = \sum_{n=0}^{N-1} (x_n - \mu) \cdot e^{-j 2\pi k n / N}, \quad \text{FFT}_{\text{peak}} = \max_k |X_k|$$
- **Input Signal**: DC-subtracted current AC component: $I_{\text{ac}} = I(t) - \mu_I$.
- **Why It Is Useful**: Detects dominant harmonic energy spikes caused by thyristor converter commutation and stator slot harmonics.
- **Where Calculated**: `ai_engine.py` (Line 193) via `np.fft.rfft()`.
- **Nominal Healthy Example**: $12.42$ magnitude units.

### 10. Real FFT Spectral Mean (`curr_fft_mean`)
- **Mathematical Formula**:
  $$\text{FFT}_{\text{mean}} = \frac{1}{M} \sum_{k=1}^{M} |X_k|$$
- **Input Signal**: DC-subtracted current AC component.
- **Why It Is Useful**: Represents the overall broadband spectral noise floor. Control loop instability and speed regulator hunting significantly elevate broadband noise.
- **Where Calculated**: `ai_engine.py` (Line 194) via `np.fft.rfft()`.
- **Nominal Healthy Example**: $1.15$ magnitude units.

---

## 6. Machine Learning Models & Architectures

MotorGuard AI incorporates two dedicated machine learning models serialized in `backend/models/`:

```
                                  BACKEND MODEL ASSETS
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
      [ CWRU INDUCTION MOTOR MODEL ]                  [ 12 V DC MOTOR MODEL ]
  • File: backend/models/motor_best_model.joblib  • File: backend/models/dc_motor/model.joblib
  • Scaler: backend/models/motor_scaler.joblib    • Scaler: backend/models/dc_motor/scaler.joblib
  • Metadata: backend/models/model_metadata.json  • Metadata: backend/models/dc_motor/metadata.json
  • Architecture: Multi-Layer Perceptron (MLP)    • Architecture: Random Forest Classifier
  • Input: 7 Canonical Vibration Features         • Input: 8 Canonical Current Features
  • Output: 10 Fault Classes                      • Output: 4 Health / Control Classes
```

---

### Model 1: CWRU 2 HP Induction Motor Neural Network
- **Algorithm**: Multi-Layer Perceptron Classifier (`sklearn.neural_network.MLPClassifier`).
- **Input Features (7 dimensions)**:
  `['rms', 'sd', 'kurtosis', 'crest', 'max', 'min', 'skewness']`
- **Output Classes (10 classes)**:
  `['Ball_007_1', 'Ball_014_1', 'Ball_021_1', 'IR_007_1', 'IR_014_1', 'IR_021_1', 'Normal_1', 'OR_007_6_1', 'OR_014_6_1', 'OR_021_6_1']`
- **Preprocessing Pipeline**: `StandardScaler` ($z = \frac{x - \mu}{\sigma}$) fitted on training split.
- **Architecture & Hyperparameters**:
  - Hidden Layers: 2 hidden layers `(32, 16)` neurons.
  - Activation Function: Rectified Linear Unit (`relu`).
  - Solver: Adam Optimizer (`adam`).
  - Max Iterations: `500`.
  - Random Seed: `42`.
- **Benchmark Evaluation Metrics (460 Test Samples)**:
  - **Accuracy**: **87.39%** ($402 / 460$ correct).
  - **Macro Precision**: **87.67%**.
  - **Macro Recall**: **87.39%**.
  - **Macro F1-Score**: **87.30%**.
  - **Inference Latency**: **<0.1 ms / sample** (sub-millisecond execution).
  - **Model File Size**: $46.22 \text{ KB}$ ($47,328 \text{ bytes}$).
- **Key Per-Class Test F1-Scores**:
  - `Normal_1` (Healthy): **1.000 (100% Precision / 100% Recall)**.
  - `OR_007_6_1` (Outer Race 7 mil): **1.000 (100% Precision / 100% Recall)**.
  - `IR_007_1` (Inner Race 7 mil): **0.979**.
  - `OR_021_6_1` (Outer Race 21 mil): **0.978**.
  - `IR_021_1` (Inner Race 21 mil): **0.968**.
  - `IR_014_1` (Inner Race 14 mil): **0.918**.
  - `Ball_014_1` (Ball 14 mil): **0.918**.
  - `Ball_021_1` (Ball 21 mil): **0.739**.
  - `Ball_007_1` (Ball 7 mil): **0.620**.
  - `OR_014_6_1` (Outer Race 14 mil): **0.610**.

---

### Model 2: 12 V DC Motor Random Forest Classifier
- **Algorithm**: Random Forest Classifier (`sklearn.ensemble.RandomForestClassifier`).
- **Input Features (8 dimensions)**:
  `['curr_mean', 'curr_rms', 'curr_std', 'curr_peak', 'curr_p2p', 'curr_crest_factor', 'curr_fft_peak', 'curr_fft_mean']`
- **Output Classes (4 classes)**:
  1. `Loose Foundation`
  2. `Normal Operation`
  3. `Suboptimal Control (Speed Reg)`
  4. `Suboptimal Control (Speed+Current Reg)`
- **Preprocessing Pipeline**: `StandardScaler` fitted on 98 experiment groups.
- **Hyperparameters**:
  - Number of Trees (`n_estimators`): `100`.
  - Max Tree Depth (`max_depth`): `6`.
  - Random Seed: `42`.
  - Validation Scheme: 5-Fold Stratified Group K-Fold (`StratifiedGroupKFold`) grouped by `experiment_id` to strictly prevent speed-leakage between train and validation splits.
- **Cross-Validation Performance**:
  - **Grouped CV Accuracy**: **86.73%**.
  - **Grouped CV Macro F1**: **86.07%**.
  - **Model File Size**: $287.0 \text{ KB}$ ($293,865 \text{ bytes}$).
- **Feature Importance Ranking (Gini Impurity Drop)**:
  1. `curr_fft_mean`: **26.07%** (Broadband noise floor from detuned control loops).
  2. `curr_fft_peak`: **18.72%** (Thyristor commutation harmonic spike).
  3. `curr_mean`: **15.92%** (Armature DC load shift).
  4. `curr_crest_factor`: **14.96%** (Transient switching spike severity).
  5. `curr_rms`: **13.47%** (Total electrical energy draw).
  6. `curr_std`: **6.77%** (Current ripple variance).
  7. `curr_peak`: **2.20%** (Absolute current crest).
  8. `curr_p2p`: **1.89%** (Peak-to-peak current envelope).

---

### Confidence & Probability Calculation
In `backend/ai_engine.py`:
```python
probs = MODEL.predict_proba(scaled_vector)[0]
confidence = float(np.max(probs))
class_probabilities = {class_names[i]: float(probs[i]) for i in range(len(class_names))}
normal_prob = class_probabilities.get('Normal Operation', 0.0) # or 'Normal_1'

condition_score = round(normal_prob * 100, 2)            # 0 to 100% health score
prototype_anomaly_indicator = round(1.0 - normal_prob, 4) # 0.0 to 1.0 anomaly score
```

---

## 7. DC Motor ML Pipeline

The 12 V DC Motor diagnostic pipeline processes electrical signals step-by-step:

```
[ PHYSICAL HARDWARE ]
  ESP32 ADC1 (GPIO 34) samples ACS712 current waveform at 1 kHz (64 points)
       │
       │ HTTP POST JSON to /api/telemetry/esp32/dc {"current_samples": [...]}
       ▼
[ INGESTION LAYER ]
  FastAPI receives payload; validates numeric array length >= 32 samples
       │
       ▼
[ FEATURE EXTRACTION ] (extract_dc_features_from_current_samples)
  Computes 8 canonical electrical features:
  1. curr_mean         5. curr_p2p
  2. curr_rms          6. curr_crest_factor
  3. curr_std          7. curr_fft_peak (Real FFT on AC component)
  4. curr_peak         8. curr_fft_mean (Broadband spectral noise)
       │
       ▼
[ PREPROCESSING ]
  StandardScaler normalizes vector: z = (x - mean) / std
       │
       ▼
[ RANDOM FOREST INFERENCE ]
  100 Decision Trees evaluate scaled feature vector (max_depth = 6)
       │
       ▼
[ PREDICTION OUTPUT ] (4 Exact Classes)
  ├── 1. "Normal Operation"                    -> HEALTHY (Green)
  ├── 2. "Loose Foundation"                    -> WARNING (Yellow)
  ├── 3. "Suboptimal Control (Speed Reg)"       -> WARNING (Yellow)
  └── 4. "Suboptimal Control (Speed+Current)"   -> CRITICAL (Red)
```

---

## 8. 2 HP / CWRU ML Pipeline

The CWRU 2 HP Induction Motor diagnostic pipeline processes mechanical vibration signals:

```
[ ACCELEROMETER / DATASET REPLAY ]
  Replays 2,048-point drive-end vibration time windows from 48 kHz acquisition
       │
       ▼
[ FEATURE EXTRACTION ] (validate_and_extract_features)
  Extracts canonical 7 time-domain vibration metrics in exact sequence:
  [1: rms, 2: sd, 3: kurtosis, 4: crest, 5: max, 6: min, 7: skewness]
       │
       ▼
[ PREPROCESSING ]
  StandardScaler scales 7-feature vector against pre-saved CWRU training statistics
       │
       ▼
[ MULTI-LAYER PERCEPTRON (MLP) INFERENCE ]
  Feedforward Neural Network (Input 7 -> Dense 32 (ReLU) -> Dense 16 (ReLU) -> Dense 10 (Softmax))
       │
       ▼
[ PREDICTION OUTPUT ] (10 Exact Classes)
  ├── 'Normal_1'    : Baseline Healthy Motor
  ├── 'Ball_007_1'  : Mild Ball Defect (0.007" spall)
  ├── 'Ball_014_1'  : Moderate Ball Defect (0.014" spall)
  ├── 'Ball_021_1'  : Severe Ball Defect (0.021" spall)
  ├── 'IR_007_1'    : Mild Inner Race Defect (0.007" crack)
  ├── 'IR_014_1'    : Moderate Inner Race Defect (0.014" crack)
  ├── 'IR_021_1'    : Severe Inner Race Defect (0.021" crack)
  ├── 'OR_007_6_1'  : Mild Outer Race Defect (0.007" centered at 6 o'clock)
  ├── 'OR_014_6_1'  : Moderate Outer Race Defect (0.014" centered at 6 o'clock)
  └── 'OR_021_6_1'  : Severe Outer Race Defect (0.021" centered at 6 o'clock)
```

---

## 9. Live Telemetry Architecture

### REST vs. WebSocket Communication Matrix
- **REST Endpoints (`HTTP`)**: Used for asynchronous request-response transactions, such as profile switching (`POST /api/motor-profile`), baseline recording (`POST /api/baselines/record`), alert acknowledgement (`POST /api/alerts/{id}/acknowledge`), and ESP32 hardware packet injection (`POST /api/telemetry/esp32/dc`).
- **WebSocket Stream (`WS /ws`)**: High-throughput unidirectional push from backend to all connected browser clients. Broadcasts continuous telemetry frames at **20 Hz (every 50 ms)** without HTTP connection overhead.

### Live Telemetry Message Schema (`/ws`)
Every WebSocket message is a JSON string formatted under two message types:
1. `telemetry`: Regular 20 Hz state packet containing sensor readings, AI predictions, and baseline context.
2. `alert`: Real-time notification dispatched when an alert state change or escalation occurs.

#### Complete Telemetry Frame Example (12 V DC Motor):
```json
{
  "type": "telemetry",
  "data": {
    "timestamp_ms": 1725430000120,
    "timestamp": "2026-09-11T14:20:00.120Z",
    "source": "hardware",
    "mode": "LIVE HARDWARE (12 V DC Motor)",
    "device_id": "ESP32-DC-001",
    "motor_id": "MOTOR-12V-001",
    "asset_id": "MOTOR-12V-001",
    "profile_name": "dc_motor_12v",
    "fault_class": "Loose Foundation",
    "voltage": 12.02,
    "current": 1.150,
    "power": 13.82,
    "speed_rpm": 1150.0,
    "pwm": 145.0,
    "vibration_rms": 0.018,
    "ai_prediction": {
      "predicted_class": "Loose Foundation",
      "confidence": 0.9421,
      "status": "OPERATING ANOMALY DETECTED",
      "severity": "warning",
      "condition_score": 5.79,
      "anomaly_score": 0.9421,
      "score_label": "model-based condition score",
      "recommendation": "WARNING: Loose motor foundation / mechanical looseness detected. Inspect mounting hardware and foundation fastening."
    },
    "baseline_context": {
      "asset_id": "MOTOR-12V-001",
      "profile": "dc_motor_12v",
      "status": "WARNING",
      "confidence": 94,
      "primary_metric": "current",
      "primary_unit": "A",
      "current_value": 1.150,
      "baseline_mean": 0.940,
      "lower_threshold": 0.836,
      "upper_threshold": 1.044,
      "deviation_pct": 22.3,
      "context_summary": "RPM 1150 / PWM 145",
      "directive": "Current (1.150 A) is above learned operating envelope (0.836–1.044 A) for RPM 1150 / PWM 145. Inspect motor mounting rigidity."
    }
  }
}
```

---

## 10. Two-Laptop Distributed Deployment Architecture

In practical classroom demonstrations, laboratory evaluations, or project viva reviews, MotorGuard AI is deployed across **two separate laptops** on a shared local Wi-Fi network:

```
                  LOCAL WI-FI ROUTER OR MOBILE HOTSPOT
                   (Subnet: 192.168.1.0/24 or 192.168.43.0/24)
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│   LAPTOP A: HARDWARE & BACKEND   │        │     LAPTOP B: OPERATOR CLIENT    │
│   IP: 192.168.1.100              │        │     IP: 192.168.1.105            │
│                                  │        │                                  │
│ • Connected to ESP32 via Wi-Fi   │        │ • No Python or backend needed    │
│ • Runs FastAPI Server (Port 8000)│        │ • Runs Web Browser (Chrome/Edge) │
│ • Runs SQLite & ML Inference     │        │ • Accesses URL:                  │
│ • Hosts Built Frontend or Vite   │        │   http://192.168.1.100:3000  OR  │
│                                  │        │   http://192.168.1.100:8000      │
└──────────────────────────────────┘        └──────────────────────────────────┘
```

### Allocation of Roles & Processes
- **Laptop A (Server & Hardware Ingestion Host)**:
  - Runs the Python FastAPI server listening on `0.0.0.0:8000`.
  - Hosts the SQLite database (`infra_monitor.db`) and pre-trained `.joblib` model files.
  - Receives incoming HTTP POST telemetry from the physical ESP32.
  - Executes feature extraction, ML classification, and threshold evaluation.
  - Runs Vite dev server (`0.0.0.0:3000`) or serves compiled React assets directly from port 8000.
- **Laptop B (Remote Operator Dashboard)**:
  - Connects to the same Wi-Fi network.
  - Opens a standard web browser pointing to `http://192.168.1.100:3000` (or `http://192.168.1.100:8000`).
  - Automatically establishes a WebSocket connection to `ws://192.168.1.100:8000/ws`.
  - Operates the control room dashboard (acknowledges alerts, controls simulation, creates maintenance work orders).

### Network Configuration Rules
1. **Firewall Rule**: On Laptop A, the Windows Defender Firewall must allow incoming TCP traffic on **Port 8000** and **Port 3000**.
2. **Wi-Fi AP Isolation**: Avoid college campus eduroam / public Wi-Fi networks that enable **Client Isolation** (AP isolation blocks laptop-to-laptop and ESP32-to-laptop communication). Use a mobile hotspot or dedicated travel router.
3. **Firmware Target Update**: In `esp32_dc_motor_monitor.ino`:
   ```cpp
   const char* serverUrl = "http://192.168.1.100:8000/api/telemetry/esp32/dc";
   ```
   Replace `192.168.1.100` with the actual IPv4 address assigned to Laptop A via `ipconfig`.

---

## 11. Database Schema & Persistence Architecture

MotorGuard AI utilizes **SQLite 3** (`backend/infra_monitor.db`) with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and Foreign Key enforcement enabled.

```
                                  DATABASE: infra_monitor.db
                                              │
    ┌────────────────┬────────────────┬───────┴────────┬────────────────┬────────────────┐
    ▼                ▼                ▼                ▼                ▼                ▼
[ assets ]  [ sensor_readings ]  [ baselines ]  [ comparisons ]     [ alerts ]  [ maintenance_tasks ]
  id (PK)       id (PK)          id (PK)          id (PK)           id (PK)          id (PK)
  name          asset_id (FK)    asset_id (FK)    asset_id (FK)     asset_id (FK)    asset_id (FK)
  type          timestamp_ms     accel_rms_mean   baseline_id (FK)  severity         alert_id (FK)
  location      accel_rms        temp_mean        health_score      fault_class      title
  status        temperature_c    dominant_freq    anomaly_score     status           status
                current_a        kurtosis_mean    explanation       details (JSON)   assigned_tech
```

### Core Database Tables
1. **`assets`**:
   Monitored machinery registry (`motor-001`, `MOTOR-2HP-001`, `MOTOR-12V-001`).
2. **`sensor_readings`**:
   Time-series table indexing incoming telemetry: `(asset_id, timestamp_ms DESC)`. Stores triaxial acceleration, RMS, temperature, current, and battery voltage.
3. **`baselines`**:
   Golden healthy reference runs. Records statistical moments: mean, std, min, and max for RMS vibration, temperature, dominant spectral peak, and kurtosis.
4. **`baseline_windows`**:
   Stores windowed time slices of baseline recordings to support deep per-window delta comparisons.
5. **`comparisons`**:
   Saves session-level comparison runs between live operational data and recorded baselines. Stores overall health scores ($0\text{--}100$), vibration divergence percentage, frequency shift in Hz, and natural language AI explanations.
6. **`comparison_windows`**:
   Per-window anomaly scores and threshold excursions for comparison runs.
7. **`alerts`**:
   Records all generated fault events. Fields: `id`, `motor_id`, `asset_id`, `timestamp`, `fault_class`, `human_readable_fault`, `severity` (`NORMAL`, `WARNING`, `CRITICAL`), `confidence`, `rms`, `temperature`, `message`, `recommendation`, `details` (stores baseline context JSON), and `status` (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`).
8. **`maintenance_tasks`**:
   Digital work orders created manually or directly from alerts. Fields: `id`, `asset_id`, `alert_id`, `title`, `priority` (`low`, `medium`, `high`, `critical`), `assigned_technician`, `status` (`new`, `in_progress`, `completed`, `cancelled`), `due_date`, and `notes`.
9. **`dynamic_baselines`**:
   Key-value store persisting runtime context-aware baseline learning states across backend restarts for each profile (`profile` PRIMARY KEY, `asset_id`, `baseline_json`, `updated_at`).

---

## 12. Dashboard Architecture & Page Specifications

The frontend is an industrial Single Page Application (SPA) built with **React 19** and bundled with **Vite**. It employs a permanent Light Industrial palette (`#F4F8FC` surface, `#FFFFFF` cards, `#123B68` navy structure, and `#39C5ED` cyan accents).

```
DASHBOARD VIEW HIERARCHY
├── [ Topbar / Navigation Header ] -> Active Profile Switcher, Connection Popover, Live Indicator
├── [ Collapsible Sidebar ]        -> Direct routing between 9 operational views
└── [ Dynamic Content Workspace ]
      ├── 1. Login View             -> Role-based authentication (Admin vs Field Technician)
      ├── 2. Overview Page          -> High-density telemetry KPIs, active alerts, vibration trend
      ├── 3. Live Monitoring Page   -> Real-time multi-channel oscilloscopes & FFT spectrum
      ├── 4. AI Diagnosis Page      -> Live model confidence, confusion matrix, defect probabilities
      ├── 5. Alerts & Events Page   -> Tri-column timeline, severity breakdown, work-order dispatch
      ├── 6. Analytics Page         -> Baseline comparison sessions, RMS delta, temperature trend
      ├── 7. Energy Page            -> Energy harvesting voltage, power generation, battery SoC
      ├── 8. Maintenance Page       -> Digital work-order Kanban board & technician assignments
      ├── 9. Assets Registry Page   -> Motor fleet inventory, nameplate data, operating hours
      └── 10. Settings Page         -> Simulation controls, threshold tuning, LAN IP diagnostics
```

### Detailed Page Breakdown
1. **Login (`Login.jsx`)**:
   - Split-view layout featuring a technical motor schematic and role selector.
   - Roles: `Admin / Engineer` (Full configuration access) and `Field Technician` (Restricted to Overview, Live Monitor, Alerts, and Maintenance views).
2. **Overview (`Overview.jsx`)**:
   - Master command room displaying active machine condition badge, connection freshness (`LIVE`, `RECENT`, `STALE`), composite health score gauge ($0\text{--}100\%$), real-time RMS vibration charts, and active alert counters.
3. **Live Monitoring (`LiveMonitoring.jsx`)**:
   - High-speed oscilloscope charts rendering up to 100 historical telemetry points.
   - For DC Motor: Displays Voltage ($V$), Armature Current ($A$), Mechanical Power ($W$), and Shaft RPM.
   - For CWRU Motor: Displays Vibration Acceleration ($g$), Peak Acceleration, and Temperature ($^\circ\text{C}$).
4. **AI Diagnosis (`AIInsights.jsx`)**:
   - Displays real-time model predictions, model version, inference latency, classification probabilities for all classes, confusion matrix heatmap, and feature importance rankings.
5. **Alerts & Events (`Alerts.jsx`)**:
   - Three-column layout displaying severity metrics (Total, Critical, Warning), interactive chronological timeline, detailed telemetry evidence card, and "Create Maintenance Work Order" button.
6. **Analytics (`Analytics.jsx`)**:
   - Statistical delta comparison view comparing live runs against recorded golden baselines. Displays RMS variance percentage, temperature difference ($\Delta ^\circ\text{C}$), and frequency shift.
7. **Energy (`Energy.jsx`)**:
   - Monitors secondary energy harvesting parameters, storage capacitor voltage, and estimated power generation.
8. **Predictive Maintenance (`Maintenance.jsx`)**:
   - Work order tracking board supporting status progression: `Open` $\rightarrow$ `In Progress` $\rightarrow$ `Completed`. Enables assigning technicians and logging resolution notes.
9. **Assets (`Assets.jsx`)**:
   - Registry tracking connected physical assets (`MOTOR-12V-001`, `MOTOR-2HP-001`), nameplate electrical ratings, operational hours, and baseline management tools.
10. **Settings (`Settings.jsx`)**:
    - Control panel for dataset simulation (Start, Stop, Pause, Reset, Speed multiplier $0.1\times\text{--}10\times$), fault injection dropdown, dynamic threshold reset button, and edge connectivity diagnostics.

---

## 13. Context-Aware Dynamic Thresholds Engine

### Implementation Status: VERIFIED & FULLY IMPLEMENTED
The dynamic threshold engine is fully implemented in `backend/dynamic_thresholds.py` and persisted in `backend/database.py`.

### Mathematical Formulation
Static fixed thresholds trigger false alarms during motor acceleration or load changes. MotorGuard AI uses **Statistical Operating Envelopes** that continuously learn the nominal Gaussian distribution ($\mu, \sigma$) of healthy motor operation:

$$\text{Lower Warning Threshold} = \max(0, \mu_{\text{context}} - k_{\text{warn}} \cdot \sigma)$$
$$\text{Upper Warning Threshold} = \mu_{\text{context}} + k_{\text{warn}} \cdot \sigma$$
$$\text{Lower Critical Threshold} = \max(0, \mu_{\text{context}} - k_{\text{crit}} \cdot \sigma)$$
$$\text{Upper Critical Threshold} = \mu_{\text{context}} + k_{\text{crit}} \cdot \sigma$$

- **Warning Multiplier ($k_{\text{warn}} = 2.0$)**: Covers $\approx 95.45\%$ of nominal Gaussian variance.
- **Critical Multiplier ($k_{\text{crit}} = 3.0$)**: Covers $\approx 99.73\%$ of nominal Gaussian variance.

### Context-Aware Operational Scaling (DC Motor)
When motor PWM duty increases, nominal current draw naturally scales upward. MotorGuard AI scales the baseline mean dynamically according to the operating command:
$$\text{Context Factor} = 0.70 + 0.30 \cdot \left(\frac{\text{PWM}}{200.0}\right)$$
$$\mu_{\text{context}} = \mu_{\text{nominal}} \times \text{Context Factor}$$

### Baseline Online Learning & Fault Rejection
- When a motor runs in a healthy state (`Normal_1` or `Normal Operation`), incoming readings update the running cumulative mean:
  $$\mu_{k+1} = \mu_k + \frac{x_{k+1} - \mu_k}{\min(k, 150)}$$
- **Fault Sample Rejection**: If the AI model detects a fault or operating anomaly, the baseline update is **aborted immediately**:
  ```python
  if not is_nominal:
      return  # Do not corrupt baseline with fault samples
  ```
  This guarantees that abnormal spikes never expand the envelope to mask developing failures.

---

## 14. Explainable Context-Rich Alerts & Deduplication

### Implementation Status: VERIFIED & FULLY IMPLEMENTED
Implemented in `backend/severity_engine.py` and `backend/main.py`.

### Alert Generation Structure
An alert in MotorGuard AI is not merely a raw error string; it is an actionable engineering advisory composed of:
1. **Fault Classification**: Plain-English name (e.g., `"Inner Race Defect — 14 mil"`).
2. **Model Confidence**: Softmax probability percentage (e.g., `94.2% confidence`).
3. **Severity Level**: `NORMAL`, `WARNING`, or `CRITICAL`.
4. **Telemetry Evidence**: The numerical value and learned threshold envelope (e.g., `"Current (1.150 A) exceeds upper envelope (1.044 A)"`).
5. **Actionable Directive**: Immediate operational recommendation (e.g., `"Inspect foundation fastening bolts within 24–48 hours"`).

### Severity Mapping Logic
- **`CRITICAL` Severity**:
  - Assigned when severe bearing defects are detected ($0.021''$ spall size in Ball, IR, or OR).
  - Assigned when DC motor dual regulator detuning (`Suboptimal Control (Speed+Current Reg)`) is detected.
  - Assigned if RMS vibration exceeds physical critical limits ($>0.50 \text{ g}$).
- **`WARNING` Severity**:
  - Assigned to mild/moderate defects ($0.007''$ and $0.014''$ defects).
  - Assigned to mechanical looseness (`Loose Foundation`).
  - Assigned when telemetry breaches the $2\sigma$ statistical dynamic envelope.
- **`NORMAL`**: Nominal operation within envelope.

### Alert Deduplication Engine (Fatigue Prevention)
Industrial control rooms suffer from alert fatigue when a high-frequency sensor fires dozens of identical alerts every second. MotorGuard AI implements a **300-second (5-minute) sliding-window deduplication filter**:
- A new alert is written to the database and broadcast over WebSockets **ONLY IF**:
  1. The fault classification changes (e.g., transitions from `Normal_1` $\rightarrow$ `Ball_014_1`).
  2. The severity escalates (e.g., transitions from `WARNING` $\rightarrow$ `CRITICAL`).
  3. The 300-second cooldown period has elapsed since the last alert of that class.

> [!NOTE]
> **RUL Status**: Remaining Useful Life (RUL) estimation in hours is **NOT IMPLEMENTED** in this codebase. Alerts provide immediate severity and maintenance timeframes (e.g., "within 24 hours"), but regression-based RUL curve degradation modeling is reserved for future research.

---

## 15. Edge-First vs. Local Server Architecture

### Processing Breakdown: What Runs Where

| Architectural Layer | Physical Hardware Device | Computational Tasks Executed |
| :--- | :--- | :--- |
| **Edge Hardware Node** | **ESP32 Microcontroller** | • High-speed analog sampling ($1 \text{ kHz}$ ADC timer)<br>• Sensor calibration & zero-offset voltage conversion<br>• Local 64-sample buffer packaging<br>• JSON serialization & Wi-Fi transmission |
| **Local Ingestion & AI Server** | **FastAPI Host Laptop** | • Multi-channel HTTP & WebSocket endpoints<br>• 8-feature electrical & 7-feature vibration signal extraction<br>• Full ML inference (MLP Neural Net & Random Forest)<br>• Dynamic statistical threshold envelope updates<br>• SQLite database persistence |
| **Client Presentation** | **Operator Browser (React 19)** | • 20 Hz WebSocket packet unpacking<br>• Canvas / SVG oscilloscope chart rendering<br>• LocalStorage caching of last-known telemetry<br>• Interactive work-order dispatch |

### Clarification on "Edge Computing"
The ESP32 acts as a **smart digitized sensor transmitter**, not an on-chip deep learning accelerator. Machine learning inference is executed locally on the host laptop inside Python `scikit-learn` / `joblib`. The entire architecture is **100% Local / Air-Gapped**, meaning it operates on an isolated local network without any connection to external cloud APIs (AWS, Azure, or GCP).

---

## 16. Multi-Speed Adaptive Modeling (Status & Analysis)

### Implementation Status: PARTIALLY IMPLEMENTED (Heuristic) / FUTURE WORK (ML)
- **What IS Implemented**: The Context-Aware Dynamic Threshold Engine (`dynamic_thresholds.py`) contains linear heuristic compensation for DC motor current draw as a function of PWM command and shaft RPM:
  $$\text{Context Factor} = 0.70 + 0.30 \cdot \left(\frac{\text{PWM}}{200.0}\right)$$
- **What IS NOT Implemented (Future Work)**:
  - The machine learning models (`train_motor_ai.py` and `train_dc_motor.py`) do **NOT** use speed-normalized inputs or angular-domain order tracking.
  - In `train_dc_motor.py`, `speed_percent` was deliberately **excluded** from the input feature set to prevent data leakage during grouped cross-validation.
  - True Multi-Speed Adaptive Machine Learning (such as Computed Order Tracking, angular resampling via encoder pulses, or speed-conditioned Physics-Informed Neural Networks) is classified as **Proposed Future Work**.

---

## 17. End-to-End Data Flow Scenarios

### Example A: Physical Current Telemetry $\rightarrow$ AI Diagnosis
1. A physical 12 V DC motor runs with loose mounting bolts on the test bench.
2. The ACS712 current sensor outputs an analog waveform on ESP32 **GPIO 34**.
3. ESP32 firmware reads 64 samples at $1 \text{ kHz}$; mean current reads $1.15 \text{ A}$.
4. ESP32 sends HTTP POST payload to `http://192.168.1.100:8000/api/telemetry/esp32/dc`.
5. FastAPI receives payload; `ai_engine.py` computes 8 features (`curr_mean`, `curr_rms`, `curr_std`, `curr_peak`, `curr_p2p`, `curr_crest_factor`, `curr_fft_peak`, `curr_fft_mean`).
6. `StandardScaler` scales the 8 features; `RandomForestClassifier` classifies vector as **`Loose Foundation`** with $94.2\%$ confidence.
7. Severity engine assigns `WARNING` severity; dynamic threshold flags $+22.3\%$ current deviation above the nominal $0.94 \text{ A}$ baseline.
8. Telemetry and alert JSON packets broadcast over WebSocket `/ws`.
9. React dashboard updates topbar badge to **`● LIVE HARDWARE (12 V DC Motor)`** and alerts operator to inspect foundation fastening bolts.

### Example B: CWRU Dataset Replay $\rightarrow$ Neural Net Fault Detection
1. Operator switches dashboard profile to **2 HP Induction Motor (`cwru_2hp`)** and selects condition **`Inner Race Defect 0.014"` (`IR_014_1`)**.
2. Backend simulator (`simulator.py`) fetches raw time-series row from `feature_time_48k_2048_load_1.csv` where `fault == 'IR_014_1'`.
3. 7 canonical features extracted: $\text{RMS}=0.088 \text{ g}$, $\text{SD}=0.088 \text{ g}$, $\text{Kurtosis}=4.12$, $\text{Crest}=4.45$, $\text{Max}=0.412 \text{ g}$, $\text{Min}=-0.395 \text{ g}$, $\text{Skewness}=0.042$.
4. `motor_scaler.joblib` scales feature vector; `motor_best_model.joblib` (`MLPClassifier`) classifies row as **`IR_014_1`** with $98.1\%$ probability.
5. Severity engine marks fault as `WARNING` (`"Moderate Inner Race Bearing Defect (0.014")"`).
6. Alert written to `alerts` table in `infra_monitor.db`.
7. Dashboard AI Insights page updates probability bars and highlights Inner Race wear.

### Example C: Golden Baseline Recording & Delta Comparison
1. Technician runs healthy motor and clicks **"Record Golden Baseline"** on Assets page.
2. Backend collects 200 consecutive nominal samples over 10 seconds.
3. Computes statistical summary: Mean RMS $=0.075 \text{ g}$, RMS Std $=0.012 \text{ g}$, Dominant Frequency $=29.8 \text{ Hz}$.
4. Baseline saved into `baselines` table as Baseline #1 (`"Healthy Baseline"`).
5. Two weeks later, technician runs a live **Comparison** against Baseline #1.
6. Current RMS is $0.145 \text{ g}$ ($+93.3\%$ increase); temperature has risen $+8.5^\circ\text{C}$.
7. Comparison engine computes Anomaly Score $=0.84$ ($84\%$ anomaly) and Health Score $=16/100$.
8. Generates natural language advisory: *"Vibration RMS has increased by 93.3% | Temperature is 8.5°C above baseline | Urgent inspection required."*

---

## 18. Codebase & Repository File Structure

```
working-prototype/
│
├── backend/                              # Unified FastAPI Backend Engine
│   ├── main.py                           # API routing, WebSocket broadcaster, life-cycle manager
│   ├── ai_engine.py                      # Multi-profile AI inference & feature validation pipeline
│   ├── dynamic_thresholds.py             # Context-aware statistical operating envelope engine
│   ├── severity_engine.py                # ISO fault severity evaluation & alert deduplication
│   ├── database.py                       # SQLite database schemas, connection pooling & migrations
│   ├── simulator.py                      # CWRU 48 kHz & DC motor telemetry dataset replay engine
│   ├── infra_monitor.db                  # Local SQLite database file (WAL mode)
│   └── models/                           # Serialized Machine Learning Artifacts
│       ├── motor_best_model.joblib       # Pre-trained CWRU 10-Class MLP Neural Network
│       ├── motor_scaler.joblib           # Pre-fitted StandardScaler for CWRU features
│       ├── model_metadata.json           # CWRU training metrics, accuracy, and class names
│       └── dc_motor/                     # 12 V DC Motor Model Directory
│           ├── model.joblib              # Pre-trained 4-Class Random Forest Classifier
│           ├── scaler.joblib             # Pre-fitted StandardScaler for 8 electrical features
│           ├── metadata.json             # Grouped CV accuracy, F1-score & feature importances
│           └── feature_config.json       # Feature column ordering & class label mapping
│
├── dashboard/                            # React 19 Frontend Web Application
│   ├── index.html                        # HTML5 single-page application entry template
│   ├── vite.config.js                    # Vite bundler configuration (Port 3000)
│   ├── package.json                      # Node.js dependencies & scripts
│   ├── dist/                             # Compiled production bundle (HTML, JS, CSS)
│   └── src/
│       ├── main.jsx                      # React DOM mounting entrypoint
│       ├── app.jsx                       # Master state container, WebSocket client & auth controller
│       ├── api.js                        # Centralized REST API fetch wrapper functions
│       ├── styles.css                    # Industrial Navy/Cyan Light Design System stylesheet
│       ├── components/                   # Reusable UI Components
│       │   ├── Navbar.jsx                # Header bar, profile selector & connection status popover
│       │   ├── Sidebar.jsx               # Navigation drawer with icon links
│       │   ├── Login.jsx                 # Industrial dual-role authentication view
│       │   ├── LoadingScreen.jsx         # Startup splash screen & asset initialization
│       │   └── Common.jsx                # Metric cards, SVG badges, and freshness indicators
│       └── pages/                        # Control Room Route Views
│           ├── Overview.jsx              # System summary, primary KPIs, and active alerts
│           ├── LiveMonitoring.jsx        # Multi-channel real-time oscilloscope graphs
│           ├── AIInsights.jsx            # Deep AI diagnostics, probabilities & confusion matrix
│           ├── Alerts.jsx                # Event timeline, evidence cards, work order generator
│           ├── Analytics.jsx             # Baseline comparison analysis & historical trends
│           ├── Energy.jsx                # Energy harvesting telemetry & power metrics
│           ├── Maintenance.jsx           # Work order Kanban board & technician assignment
│           ├── Assets.jsx                # Fleet machinery inventory & baseline management
│           └── Settings.jsx              # Simulation playback controls & threshold calibration
│
├── esp32_firmware/                       # Microcontroller Embedded C++ Firmware
│   ├── esp32_dc_motor_monitor.ino        # 12 V DC Motor firmware (1 kHz ADC current sampling)
│   └── esp32_motor_monitor.ino           # Induction motor telemetry template (I2C / OneWire)
│
├── ml/                                   # Machine Learning Experimentation & Training
│   ├── data/
│   │   └── feature_time_48k_2048_load_1.csv  # 2,300-row CWRU bearing dataset
│   ├── dc_motor/
│   │   └── train_dc_motor.py             # DC motor 5-fold StratifiedGroupKFold training script
│   └── scripts/
│       ├── train_motor_ai.py             # CWRU MLP/RandomForest/SVM training pipeline
│       └── dataset_analysis.py           # Exploratory data analysis & statistical audits
│
├── Multi-Sensor Condition-Monitoring Dataset of a Bru/ # Raw Brushed DC Motor Dataset (386 files)
│   ├── metadata.csv                      # Dataset file manifest & experimental conditions
│   └── data/                             # Raw binary (.bin), audio (.wav), and spot readings (.xls)
│
├── MotorsData_rev.xlsx                    # Raw DC motor dynamic response data (Motor A/B)
├── requirements.txt                      # Python backend pip dependencies
├── start.bat                             # One-click Windows startup batch script
└── start.sh                              # One-click Linux/macOS startup bash script
```

---

## 19. API & WebSocket Technical Reference

### 1. System & Profile Endpoints
- **`GET /`**: Returns API root health check and version string.
- **`GET /health`**: Returns JSON `{"status": "ok", "simulator_running": true}`.
- **`GET /api/motor-profile`**:
  - Response: `{"active_profile": "dc_motor_12v", "profiles": [...], "ai_status": {...}}`.
- **`POST /api/motor-profile`**:
  - Request: `{"profile": "dc_motor_12v"}` (or `"cwru_2hp"`).
  - Response: Updates active backend motor profile without server restart.

### 2. Live Telemetry & Ingestion Endpoints
- **`GET /api/sensor/current`**: Returns the most recent telemetry packet.
- **`GET /api/sensor/history?count=100`**: Fetches buffer of last $N$ telemetry samples.
- **`POST /api/telemetry/esp32/dc`**:
  - Ingestion endpoint for physical 12 V DC Motor ESP32 node.
  - Accepts raw sample buffer `{"current_samples": [0.94, 0.95, ...]}` or pre-computed 8 features.
  - Automatically triggers 8-feature extraction, ML inference, and sets mode to `LIVE HARDWARE`.
- **`POST /api/telemetry/esp32`**:
  - Ingestion endpoint for induction motor hardware node (`accel_rms`, `accel_peak`, `temperature_c`, `battery_v`).

### 3. Artificial Intelligence Inference Endpoints
- **`GET /api/ai/status?profile=dc_motor_12v`**:
  - Returns active model architecture, version, class names, accuracy, and macro F1-score.
- **`POST /api/ai/predict`**:
  - Ingests custom feature dictionary or raw sample vector; returns predicted class, confidence, severity, and recommendation.

### 4. Dynamic Thresholds Endpoints
- **`GET /api/dynamic-thresholds?profile=dc_motor_12v`**:
  - Returns learned baseline mean, standard deviation, warning thresholds, critical thresholds, sample count, and directive.
- **`POST /api/dynamic-thresholds/reset`**:
  - Resets sample count to 0 and re-enters learning state.

### 5. Baselines & Comparison Endpoints
- **`POST /api/baselines/record`**: Records $N$ seconds of steady-state data as golden baseline.
- **`GET /api/baselines`**: Lists all active recorded baselines.
- **`POST /api/compare`**: Runs statistical comparison against selected baseline ID; computes anomaly score ($0\text{--}1$) and health score ($0\text{--}100$).

### 6. Alerts & Maintenance Endpoints
- **`GET /api/alerts?limit=50&status=ACTIVE`**: Returns active alerts.
- **`POST /api/alerts/{id}/acknowledge`**: Marks alert as `ACKNOWLEDGED`.
- **`POST /api/alerts/{id}/resolve`**: Marks alert as `RESOLVED`.
- **`GET /api/maintenance`**: Lists digital work orders.
- **`POST /api/maintenance`**: Creates new work order (`title`, `priority`, `assigned_technician`, `due_date`).
- **`PATCH /api/maintenance/{id}`**: Updates work order status or notes.

### 7. Simulation Replay Endpoints
- **`POST /api/simulation/start`**: Starts dataset replay.
- **`POST /api/simulation/stop`**: Stops replay.
- **`POST /api/simulation/condition`**: Injects fault condition (e.g., `{"condition": "Ball_014_1"}`).
- **`POST /api/simulation/speed`**: Sets speed multiplier (e.g., `{"speed_multiplier": 2.0}`).

### 8. High-Speed WebSocket Channel
- **`WS /ws`**: Continuous bidirectional WebSocket broadcasting telemetry and alert packets at 20 Hz.

---

## 20. System Configuration & Network Parameters

### Environment Variables & Ports
| Component | Default Port | Host Binding | Network Protocol |
| :--- | :--- | :--- | :--- |
| **FastAPI Backend** | **8000** | `0.0.0.0` (All interfaces) | HTTP / WebSocket |
| **Vite Frontend Dev** | **3000** | `127.0.0.1` (or `0.0.0.0`) | HTTP |
| **ESP32 Node** | Dynamic Port | Local Wi-Fi DHCP Client | HTTP Client / 802.11 b/g/n |

### Backend URL Configuration in Frontend
In `dashboard/src/api.js`, the frontend automatically detects whether it is running on the backend host:
```javascript
const API_BASE = window.location.origin.includes('8000') 
  ? window.location.origin 
  : 'http://localhost:8000';
```
If accessing from a remote laptop over Vite (Port 3000), update `dashboard/src/api.js` to point to Laptop A's IP address:
```javascript
const API_BASE = 'http://192.168.1.100:8000';
```

---

## 21. Step-by-Step Execution Guide (Windows / Linux)

### Prerequisites
1. **Python 3.10 to 3.12** installed (ensure `python` and `pip` are on PATH).
2. **Node.js v18.0.0+** and `npm` installed.

---

### Running on a Single Machine (Local Testing)

#### Step 1: Install Dependencies
Open PowerShell or Terminal in the project root directory:
```powershell
# 1. Install Python backend dependencies
pip install -r requirements.txt

# 2. Install Node.js dashboard dependencies
npm install
```

#### Step 2: Start the FastAPI Backend
```powershell
python backend/main.py
```
*The backend initializes SQLite tables, loads AI models, and starts listening on `http://localhost:8000`.*

#### Step 3: Start the React Dashboard
Open a second terminal window:
```powershell
npm run dev
```
*Open your web browser and navigate to `http://localhost:3000`.*

---

### Running in Two-Laptop Deployment Mode

#### On Laptop A (Server & Hardware Host - e.g., IP: 192.168.1.100):
1. Connect Laptop A to the demonstration Wi-Fi network.
2. Determine IPv4 address via terminal:
   ```powershell
   ipconfig
   ```
3. Start backend listening on all network interfaces:
   ```powershell
   python backend/main.py
   ```
4. Start Vite dashboard accessible across LAN:
   ```powershell
   npx vite --host 0.0.0.0 --port 3000
   ```

#### On Physical ESP32 Hardware:
1. Open `esp32_firmware/esp32_dc_motor_monitor.ino` in Arduino IDE.
2. Set Wi-Fi credentials and Laptop A's IP:
   ```cpp
   const char* ssid = "DEMO_WIFI_SSID";
   const char* password = "DEMO_PASSWORD";
   const char* serverUrl = "http://192.168.1.100:8000/api/telemetry/esp32/dc";
   ```
3. Select COM port and flash firmware. Open Serial Monitor at `115200 baud` to confirm HTTP 200 responses.

#### On Laptop B (Operator Client - e.g., IP: 192.168.1.105):
1. Connect Laptop B to the same demonstration Wi-Fi network.
2. Open Google Chrome or Microsoft Edge.
3. Navigate to:
   ```
   http://192.168.1.100:3000
   ```
   *(Or navigate directly to `http://192.168.1.100:8000` if serving compiled static assets).*

---

## 22. Troubleshooting & Operational Recovery

### 1. ESP32 Cannot Connect to Wi-Fi
- **Symptom**: Serial monitor prints repeating dots `.....` without obtaining an IP address.
- **Root Cause**: ESP32 only supports **2.4 GHz Wi-Fi**. It cannot connect to 5 GHz networks.
- **Resolution**: Ensure your Wi-Fi router or phone hotspot is broadcasting on 2.4 GHz band. Verify SSID and password in firmware.

### 2. Laptop B Cannot Open Dashboard (`ERR_CONNECTION_REFUSED`)
- **Symptom**: Laptop B browser times out when opening `http://192.168.1.100:3000`.
- **Root Cause**: Windows Defender Firewall on Laptop A is blocking incoming connections on port 3000 or 8000.
- **Resolution**: On Laptop A, open PowerShell as Administrator and run:
  ```powershell
  New-NetFirewallRule -DisplayName "MotorGuard Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
  New-NetFirewallRule -DisplayName "MotorGuard Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
  ```

### 3. Public Wi-Fi / AP Client Isolation Issue
- **Symptom**: Laptop A and Laptop B are connected to the same college Wi-Fi, but `ping 192.168.1.100` from Laptop B fails.
- **Root Cause**: Enterprise networks enforce **AP Isolation**, preventing connected wireless devices from communicating with one another.
- **Resolution**: Disconnect both laptops and the ESP32 from campus Wi-Fi; connect all devices to a smartphone 4G/5G mobile hotspot.

### 4. WebSocket Fails to Connect (`ws://... failed`)
- **Symptom**: Dashboard topbar displays orange badge: `RECONNECTING...`.
- **Root Cause**: Backend server on port 8000 is stopped, or browser blocked mixed-content WebSocket.
- **Resolution**: Confirm `python backend/main.py` is running in Laptop A terminal. Verify `http://localhost:8000/health` returns HTTP 200.

### 5. Dashboard Shows "SIMULATION MODE" Instead of Physical ESP32 Data
- **Symptom**: Motor current updates, but badge shows `SIMULATION MODE` instead of `LIVE HARDWARE`.
- **Root Cause**: The backend has not received a valid hardware packet within the last 5,000 milliseconds ($5 \text{ seconds}$).
- **Resolution**: Check ESP32 serial monitor. Verify that the ESP32 is receiving `[HTTP 200 OK]` responses from `/api/telemetry/esp32/dc`. Ensure the target IP in the `.ino` sketch matches Laptop A's current IP.

### 6. Arduino IDE Compile Error: `ArduinoJson.h: No such file or directory`
- **Symptom**: Sketch compilation aborts.
- **Resolution**: In Arduino IDE, open **Tools** $\rightarrow$ **Manage Libraries...**, search for **ArduinoJson**, and install version **6.x** (or 7.x).

---

## 23. Innovation Features: Verification Breakdown

### 1. Actually Implemented (100% Operational in Source Code)
- **Dual Machine Learning Classification Pipelines**: Pre-trained MLP (CWRU 10-Class) and Random Forest (DC Motor 4-Class) models serialized in `.joblib` and executing live inferences.
- **Real-Time 20 Hz WebSocket Streaming**: Live broadcast stream dispatching structured telemetry, condition scores, and baseline context.
- **Context-Aware Dynamic Thresholds Engine**: Statistical baseline learning calculating $\mu \pm 2\sigma$ and $\mu \pm 3\sigma$ envelopes while scaling DC nominal current dynamically with PWM.
- **Fault Sample Baseline Rejection**: Online algorithm rejecting anomalous vectors to prevent baseline corruption.
- **Explainable Alert Deduplication Engine**: 5-minute sliding window filter preventing alert fatigue and generating structured directives.
- **Dual Hardware & Dataset Replay Architecture**: Auto-switching between physical ESP32 current telemetry and high-frequency dataset replay.
- **Profile Isolation Guardrails**: Zero cross-contamination between DC motor electrical metrics and CWRU mechanical bearing metrics.
- **SQLite Database Persistence**: Full database persistence for assets, time-series readings, comparison sessions, alerts, and work orders.

### 2. Partially Implemented (Operational with Heuristic Scope)
- **Multi-Speed Dynamic Scaling**: Implemented at the **threshold baseline layer** via linear PWM/RPM context scaling ($0.70 + 0.30 \cdot \frac{\text{PWM}}{200}$), but **NOT** integrated at the ML feature level.
- **Edge Feature Extraction**: Basic RMS, peak, and mean calculations run on the ESP32, but full 8-feature extraction and FFT spectral analysis are offloaded to the local server host.

### 3. Proposed / Future Work (Not Implemented)
- **Remaining Useful Life (RUL) Prognostics**: Continuous Weibull hazard modeling or LSTM regression estimating remaining operating hours to mechanical failure.
- **On-Chip TinyML Microcontroller Inference**: Compiling TensorFlow Lite for Microcontrollers (TFLM) or Edge Impulse C++ models to run directly inside ESP32 SRAM.
- **Angular Domain Order Tracking**: Resampling vibration signals synchronously with encoder pulse edges to remove speed-dependent frequency smearing.

---

## 24. Viva / Project Review 2-Minute Defense Script

> *"Good morning, respected examiners. Today, I am presenting **MotorGuard AI**, an industrial predictive maintenance and rotating machinery health monitoring platform.*
> 
> *The industrial problem we address is unplanned motor downtime. Conventional maintenance is either reactive—waiting for motors to burn out—or calendar-based—replacing healthy parts prematurely. MotorGuard AI implements automated condition-based monitoring using an edge-assisted, local-first architecture.*
> 
> *Our system is structured into four layers: First, at the hardware tier, an ESP32 microcontroller samples armature current from an ACS712 Hall-effect sensor at 1 kHz and packages raw waveforms. Second, these packets are transmitted over local Wi-Fi to a high-performance FastAPI backend. Third, our backend signal processing layer extracts canonical statistical and spectral features—such as RMS, Crest Factor, Kurtosis, and real-valued FFT spectral components. Fourth, these features feed into two pre-trained machine learning pipelines: an MLP Neural Network classifying 10 fine-grained bearing defects from the CWRU benchmark, and a Random Forest Classifier diagnosing mechanical looseness and regulator gain detuning on a 12 V DC motor test bench.*
> 
> *Beyond simple classification, MotorGuard AI introduces two key innovations: First, a **Context-Aware Dynamic Threshold Engine** that learns statistical standard-deviation envelopes ($\mu \pm 2\sigma, 3\sigma$) and dynamically scales with motor speed, while actively rejecting faulty data to avoid baseline corruption. Second, an **Explainable Alert Deduplication Engine** that prevents control-room alarm fatigue using a 5-minute cooldown window, mapping confidence and telemetry evidence into actionable maintenance directives.*
> 
> *The entire system operates 100% locally over LAN, guaranteeing complete operational security in air-gapped industrial facilities. Thank you, and I am now ready for your technical questions."*

---

## 25. Comprehensive Viva Examination Q&A (35 Questions)

### Category A: Datasets & Signal Processing
1. **Q: What specific benchmark dataset was used for the induction motor bearing model?**  
   *A:* The Case Western Reserve University (CWRU) Bearing Data Center benchmark, specifically Drive-End accelerometer data sampled at $48 \text{ kHz}$ under Load 1 ($1 \text{ HP}$, $\approx 1772 \text{ RPM}$), sliced into 2,048-point windows (`feature_time_48k_2048_load_1.csv`).
2. **Q: What machine was used for the DC motor dataset?**  
   *A:* A 3PI12.12 brushed permanent-magnet DC servo motor ($625 \text{ W}$, $110 \text{ V DC}$, $12.5 \text{ A}$, $2000 \text{ RPM}$) driven by a 4-quadrant thyristor converter from the Multi-Sensor Condition-Monitoring Dataset of a Brushed DC Motor.
3. **Q: Why does the DC motor current exhibit a prominent 300 Hz line?**  
   *A:* The motor is powered by a 6-pulse three-phase thyristor converter. Commutation produces ripple at $6 \times 50 \text{ Hz} = 300 \text{ Hz}$, which is a normal drive signature, not an equipment fault.
4. **Q: What is the mathematical definition and physical significance of Kurtosis?**  
   *A:* Kurtosis is the fourth normalized statistical moment: $\frac{\frac{1}{N}\sum(x_i - \mu)^4}{\sigma^4}$. For normal Gaussian vibration, Kurtosis is $\approx 3.0$. Sharp impacts from spalling bearings create heavy distribution tails, elevating Kurtosis above $5.0$.
5. **Q: What is the Crest Factor and why is it useful in early fault detection?**  
   *A:* Crest Factor is the ratio of peak acceleration to RMS value ($\frac{\text{Peak}}{\text{RMS}}$). In early-stage micro-cracks, peak impact spikes are high while overall RMS energy is low, making Crest Factor highly sensitive to incipient defects.
6. **Q: What features are extracted from the DC motor current waveform?**  
   *A:* Eight canonical features: `curr_mean`, `curr_rms`, `curr_std`, `curr_peak`, `curr_p2p`, `curr_crest_factor`, `curr_fft_peak`, and `curr_fft_mean`.
7. **Q: Why is mean subtracted before computing the FFT in current feature extraction?**  
   *A:* Subtracting the mean removes the large DC offset component ($0 \text{ Hz}$ bin). This prevents the zero-frequency bin from dominating the spectrum and allows sensitive detection of thyristor ripple harmonics and control loop noise.
8. **Q: How does the system handle small floating-point denominators when calculating Crest Factor?**  
   *A:* A tiny epsilon term ($\epsilon = 10^{-9}$) is added to the denominator ($\frac{\text{Peak}}{\text{RMS} + 10^{-9}}$) to prevent division-by-zero runtime exceptions during motor standstill.

### Category B: Machine Learning & Preprocessing
9. **Q: What machine learning architecture is deployed for CWRU bearing diagnosis?**  
   *A:* A Multi-Layer Perceptron (`MLPClassifier`) neural network with two hidden layers `(32, 16)` neurons, ReLU activation, Adam solver, trained over an 80/20 stratified split.
10. **Q: What is the test accuracy and F1-score of the deployed CWRU neural network?**  
    *A:* Exact test accuracy is **87.39%** ($402/460$ samples), Macro Precision is **87.67%**, and Macro F1-Score is **87.30%** (verified from `model_metadata.json`).
11. **Q: What model is used for the DC motor, and why was it chosen?**  
    *A:* A `RandomForestClassifier` with 100 trees and max depth of 6. Random Forest handles non-linear tabular feature interactions effectively, provides feature importance rankings, and resists overfitting on small experimental groups.
12. **Q: Why is StandardScaler necessary prior to MLP and Random Forest classification?**  
    *A:* Features have wildly differing physical scales—Kurtosis ranges from 2 to 20, whereas RMS vibration ranges from 0.05 to 0.5. Without standard scaling ($z = \frac{x - \mu}{\sigma}$), features with larger absolute scales disproportionately dominate gradient descent and distance metrics.
13. **Q: What validation strategy was used to train the DC motor model?**  
    *A:* 5-Fold Stratified Group K-Fold (`StratifiedGroupKFold`) grouped by `experiment_id`. This ensures entire speed setpoints and operational conditions remain together, strictly preventing data leakage between training and validation folds.
14. **Q: What was the most important feature identified by the Random Forest model for DC motor diagnosis?**  
    *A:* `curr_fft_mean` ($26.07\%$ importance), which measures broadband spectral current noise caused by detuned regulator control loops.
15. **Q: How does the system calculate confidence and condition score?**  
    *A:* Softmax output probabilities are extracted via `predict_proba`. Confidence is $\max(P)$. Condition score is the probability of the healthy class multiplied by 100: $P(\text{Healthy}) \times 100\%$. Anomaly indicator is $1.0 - P(\text{Healthy})$.

### Category C: Hardware, Embedded & Network Architecture
16. **Q: What microcontroller is used, and what is its clock frequency?**  
    *A:* Espressif ESP32-WROOM-32 (Xtensa Dual-Core 32-bit LX6 running at $240 \text{ MHz}$).
17. **Q: What is the sampling rate and window size in the ESP32 DC motor firmware?**  
    *A:* $1 \text{ kHz}$ sampling rate ($1000 \mu s$ delay) taking a window of 64 raw ADC samples per telemetry packet, dispatched every $200 \text{ ms}$ ($5 \text{ Hz}$).
18. **Q: Why must the ESP32 ground pin be connected to the 12 V DC motor ground?**  
    *A:* To establish an electrical common reference. Without a common ground, the ADC input pin floats, producing random floating ADC readings.
19. **Q: What protocol connects the ESP32 to the backend?**  
    *A:* HTTP/1.1 REST POST carrying JSON payloads over local 802.11 b/g/n Wi-Fi.
20. **Q: How does the backend communicate live data to the frontend dashboard?**  
    *A:* Over an asynchronous WebSocket connection (`ws://<IP>:8000/ws`) streaming full JSON telemetry packets at $20 \text{ Hz}$ ($50 \text{ ms}$ interval).
21. **Q: How does the dashboard automatically know physical hardware is connected?**  
    *A:* If the backend receives an HTTP POST from the ESP32 within the last 5 seconds, `is_hardware_live()` returns True, and the backend sets `mode: "LIVE HARDWARE"` in the WebSocket broadcast.
22. **Q: How does the two-laptop setup operate during a demonstration?**  
    *A:* Laptop A runs the FastAPI backend and database listening on `0.0.0.0:8000`. Laptop B opens the web dashboard in Chrome via Laptop A's IP address (`http://192.168.1.100:3000`). Both connect over a shared local Wi-Fi hotspot.

### Category D: Advanced Features, Diagnostics & Thresholds
23. **Q: How does the Context-Aware Dynamic Threshold Engine work?**  
    *A:* It calculates Gaussian statistical envelopes: Warning ($\mu \pm 2\sigma$) and Critical ($\mu \pm 3\sigma$). For DC motors, $\mu$ dynamically scales with commanded PWM and RPM using a linear context factor ($0.70 + 0.30 \cdot \frac{\text{PWM}}{200}$).
24. **Q: How does the threshold engine avoid baseline corruption during motor faults?**  
    *A:* When incoming telemetry is classified as a fault (not `Normal_1` or `Normal Operation`), the baseline learning update function immediately aborts, preventing anomalous data from corrupting the envelope.
25. **Q: What is the alert deduplication window and why is it implemented?**  
    *A:* A 300-second (5-minute) cooldown. It prevents repetitive sensor alarms from overwhelming the operator, only re-alerting if severity escalates or fault class transitions.
26. **Q: What database technology is used, and how is it optimized for concurrency?**  
    *A:* SQLite 3 (`infra_monitor.db`) operating with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and connection pooling using thread-local storage.
27. **Q: Is Remaining Useful Life (RUL) implemented in this project?**  
    *A:* No. The system implements fault detection, classification, and severity alerting, but regression-based RUL prognostics in hours is classified as future work.
28. **Q: Is Multi-Speed Adaptive Machine Learning implemented?**  
    *A:* Partially. Heuristic operational scaling is implemented in the dynamic threshold engine, but speed-adaptive ML (angular order tracking) is classified as future work.
29. **Q: Can this platform operate without an active Internet connection?**  
    *A:* Yes, 100%. The entire architecture—ESP32, FastAPI, SQLite, Scikit-learn, and React—is self-contained and operates in air-gapped industrial LAN environments.
30. **Q: What happens to the frontend dashboard if the backend server restarts?**  
    *A:* The React frontend maintains reconnect logic every $2500 \text{ ms}$, caches the last-known telemetry state in `localStorage`, displays a yellow "RECONNECTING" badge, and resumes automatically when the backend returns online.
31. **Q: What are the exact 4 classes of the DC Motor model?**  
    *A:* `Normal Operation`, `Loose Foundation`, `Suboptimal Control (Speed Reg)`, and `Suboptimal Control (Speed+Current Reg)`.
32. **Q: What are the exact 10 classes of the CWRU Induction Motor model?**  
    *A:* `Normal_1`, `Ball_007_1`, `Ball_014_1`, `Ball_021_1`, `IR_007_1`, `IR_014_1`, `IR_021_1`, `OR_007_6_1`, `OR_014_6_1`, and `OR_021_6_1`.
33. **Q: What role does the `MotorsData_rev.xlsx` workbook play?**  
    *A:* It provides empirical dynamic step-response and frequency-response telemetry records (Motor A/B) used by the simulator to replay realistic DC motor voltage, current, and speed transients.
34. **Q: What is the difference between Edge processing and Server processing in this architecture?**  
    *A:* The ESP32 edge node performs ADC acquisition, calibration, and window buffering. The server laptop executes feature extraction, machine learning classification, threshold calculations, and database storage.
35. **Q: What would be required to run the ML models directly on the ESP32?**  
    *A:* Exporting the model weights into C/C++ arrays using TensorFlow Lite for Microcontrollers (TFLM) or TinyML quantization (int8/float16) to execute forward inference within the ESP32's 520 KB internal SRAM.

---

## 26. Technical Limitations & Design Boundaries

To ensure complete transparency and defend the project honestly in academic evaluations:
1. **Air-Gapped Local Inference Only**: Inference runs on the local server laptop in Python, not inside cloud serverless endpoints or on the microcontroller silicon.
2. **Current Sensor Bandwidth Limit**: The ACS712 Hall-effect sensor has an internal analog bandwidth of $80 \text{ kHz}$, but the ESP32 software timer samples at $1 \text{ kHz}$ ($500 \text{ Hz}$ Nyquist frequency). High-frequency bearing acoustic emissions ($>5 \text{ kHz}$) cannot be captured by the physical ESP32 ADC.
3. **No Continuous RUL Regression**: The system does not output a continuous Weibull hazard degradation curve or estimated operational hours remaining.
4. **Synthetic Simulator Fields**: When running under CWRU induction motor simulation mode, temperature and battery voltage are model-coupled synthetic variables used for control room interface demonstration.
5. **No Speed-Order Tracking**: Vibration signals are analyzed in the stationary time and frequency domains; variable-speed non-stationary smearing is not compensated for via angular encoder resampling.

---

## 27. IMPORTANT: VERIFIED VS PROPOSED AUDIT MATRIX

The following table audits every major architectural subsystem against the actual codebase, proving exact implementation fidelity:

| Feature / Subsystem | Verification Status | Primary Evidence / Source File | Technical Explanation |
| :--- | :--- | :--- | :--- |
| **CWRU 10-Class Bearing Fault Classifier** | **IMPLEMENTED** | `backend/models/motor_best_model.joblib`<br>`backend/models/model_metadata.json`<br>`ml/scripts/train_motor_ai.py` | Multi-Layer Perceptron (MLP) trained on 2,300 CWRU samples across 10 classes. Evaluated on 460 test samples with 87.39% accuracy and 87.30% Macro F1-Score. |
| **DC Motor 4-Class Diagnostic Classifier** | **IMPLEMENTED** | `backend/models/dc_motor/model.joblib`<br>`backend/models/dc_motor/metadata.json`<br>`ml/dc_motor/train_dc_motor.py` | Random Forest Classifier (100 trees) trained on 98 experiment groups using 5-fold StratifiedGroupKFold. Achieves 86.73% Grouped CV accuracy across 4 classes. |
| **Dual Motor Profile Switching** | **IMPLEMENTED** | `backend/main.py` (Line 595)<br>`dashboard/src/components/Navbar.jsx` | Runtime toggling between `cwru_2hp` and `dc_motor_12v` with strict profile isolation preventing cross-metric contamination. |
| **ESP32 12 V DC Motor Firmware** | **IMPLEMENTED** | `esp32_firmware/esp32_dc_motor_monitor.ino` | C++ Arduino sketch executing 1 kHz ADC sampling on GPIO 34 (ACS712), buffering 64 samples, and posting JSON to `/api/telemetry/esp32/dc` at 5 Hz. |
| **Real-Time 20 Hz WebSocket Pipeline** | **IMPLEMENTED** | `backend/main.py` (Lines 248–304)<br>`dashboard/src/app.jsx` (Lines 191–260) | Async broadcast loop streaming JSON telemetry frames and event alerts at 50 ms cadence with client reconnect logic. |
| **8-Feature DC Current Extraction** | **IMPLEMENTED** | `backend/ai_engine.py` (Lines 172–207)<br>`docs/DC_MOTOR_HARDWARE_INTEGRATION.md` | Extracts mean, RMS, std, peak, P2P, crest factor, FFT peak, and FFT mean from raw current arrays $\ge 32$ samples. |
| **7-Feature CWRU Vibration Extraction** | **IMPLEMENTED** | `backend/ai_engine.py` (Lines 128–170)<br>`ml/scripts/train_motor_ai.py` | Validates and extracts canonical vector: `['rms', 'sd', 'kurtosis', 'crest', 'max', 'min', 'skewness']`. |
| **Context-Aware Dynamic Thresholds** | **IMPLEMENTED** | `backend/dynamic_thresholds.py`<br>`backend/database.py` (Lines 281–305) | Computes $\mu \pm 2\sigma$ (warning) and $\mu \pm 3\sigma$ (critical) envelopes; dynamically scales DC current baseline with PWM command. |
| **Fault Sample Baseline Rejection** | **IMPLEMENTED** | `backend/dynamic_thresholds.py` (Lines 237–241) | Aborts baseline cumulative mean updates when incoming telemetry indicates an operational fault, preventing baseline corruption. |
| **Alert Deduplication Engine** | **IMPLEMENTED** | `backend/main.py` (Lines 161–246)<br>`backend/severity_engine.py` | 300-second (5-minute) sliding-window cooldown preventing alert fatigue while allowing state transitions and escalations. |
| **Two-Laptop LAN Deployment** | **IMPLEMENTED** | `backend/main.py` (Line 1221)<br>`docs/DC_MOTOR_HARDWARE_INTEGRATION.md` | Uvicorn binds to `0.0.0.0:8000`, enabling cross-laptop network telemetry, dashboard viewing, and remote maintenance dispatch. |
| **SQLite Persistence (WAL Mode)** | **IMPLEMENTED** | `backend/database.py`<br>`backend/infra_monitor.db` | 9 relational tables tracking assets, telemetry, golden baselines, comparison windows, alerts, work orders, and dynamic baselines. |
| **React 19 Light Industrial Dashboard** | **IMPLEMENTED** | `dashboard/src/`<br>`dashboard/src/styles.css` | 9 full pages: Overview, Live Monitor, AI Insights, Alerts, Analytics, Assets, Maintenance, Energy, and Settings. |
| **Multi-Speed Dynamic Scaling** | **PARTIALLY IMPLEMENTED** | `backend/dynamic_thresholds.py` (Lines 302–318) | Heuristic operational scaling is implemented for baseline threshold envelopes, but speed-adaptive ML modeling is not. |
| **Hardware Accelerometer Sampling** | **PARTIALLY IMPLEMENTED** | `esp32_firmware/esp32_motor_monitor.ino` | Template sketch provides I2C pinout and structure, but uses mock random functions in the template placeholder. Physical DC motor current on GPIO 34 is fully real. |
| **Remaining Useful Life (RUL) Modeling** | **NOT IMPLEMENTED** | N/A (Confirmed absent in code audit) | System provides severity advisories and maintenance urgency, but continuous regression RUL in hours is not implemented. |
| **Microcontroller On-Chip TinyML** | **FUTURE WORK** | N/A (Offloaded to local server host) | Machine learning models run in Python on the host laptop. Direct on-chip execution via TFLM is proposed for future work. |
| **Angular Domain Order Tracking** | **FUTURE WORK** | N/A (Stationary frequency analysis only) | Resampling vibration signals synchronously with encoder pulse edges to remove speed-dependent frequency smearing is future work. |

---
*MotorGuard AI — Built with FastAPI, Scikit-Learn, React 19, and ESP32 Microcontrollers.*
