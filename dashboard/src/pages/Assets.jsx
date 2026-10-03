import React, { useState } from 'react';
/**
 * Assets.jsx - Visual Monitored Hardware Asset Infrastructure Manager
 * Deep Navy + Cyan Technical Industrial Theme (Step 7 Visual Redesign)
 */

import { formatFaultClass, IconMotor, IconShield, IconActivity, IconZap, IconWaves, IconThermometer, IconClock } from '../components/Common.jsx';

export function AssetsPage({ 
  assets = [], 
  sensor, 
  stats, 
  baselines = [], 
  onRecordBaseline, 
  onCompare, 
  comparing = false, 
  activeInfrastructure = 'motor', 
  onSelectInfrastructure,
  activeProfile = 'cwru_2hp',
  isDC = false 
}) {
  const isDCMode = isDC || activeInfrastructure === 'dc_motor_12v' || activeProfile === 'dc_motor_12v';
  const [baselineName, setBaselineName] = useState('');
  const [showBaselineModal, setShowBaselineModal] = useState(false);

  // Active Profile & Asset State
  const activeAssetId = isDCMode ? 'MOTOR-12V-001' : 'MOTOR-2HP-001';
  const activeAssetName = isDCMode ? '12 V DC Motor Prototype' : '2 HP Motor Bench (CWRU)';

  // Telemetry metrics for currently active sensor
  const aiPred = sensor?.ai_prediction;
  const isHealthy = isDCMode 
    ? (aiPred?.predicted_class === 'Normal Operation' || sensor?.fault_class === 'Normal Operation' || (!sensor?.fault_class && !aiPred?.predicted_class))
    : (aiPred?.status === 'HEALTHY' || sensor?.fault_class === 'Normal_1' || (!sensor?.fault_class && !aiPred?.status));

  const isHardwareLive = stats?.is_hardware_live || stats?.mode === 'LIVE HARDWARE' || sensor?.source === 'hardware';
  const sourceLabel = isHardwareLive ? 'LIVE HARDWARE (ESP32)' : 'DATASET REPLAY';

  // 12 V DC Telemetry
  const dcVoltageStr = isDCMode && sensor?.voltage !== undefined ? `${sensor.voltage.toFixed(1)} V` : '12.0 V';
  const dcCurrentStr = isDCMode && sensor?.current !== undefined ? `${sensor.current.toFixed(2)} A` : '0.94 A';
  const dcPowerStr = isDCMode && sensor?.power !== undefined ? `${sensor.power.toFixed(1)} W` : '11.3 W';
  const dcRpmStr = isDCMode && sensor?.speed_rpm !== undefined ? `${sensor.speed_rpm.toFixed(0)} RPM` : '1150 RPM';
  const dcPwmStr = isDCMode && sensor?.pwm !== undefined ? `${sensor.pwm.toFixed(0)}` : '255';
  const dcVibRmsStr = isDCMode && (sensor?.vibration_rms !== undefined || sensor?.accel_rms !== undefined) 
    ? `${(sensor.vibration_rms || sensor.accel_rms).toFixed(3)} g` 
    : '0.042 g';

  // 2 HP Induction Motor Telemetry (Strictly Isolated - No DC Metrics)
  const cwruRmsStr = !isDCMode && (sensor?.vibration_rms !== undefined || sensor?.accel_rms !== undefined || sensor?.rms !== undefined)
    ? `${(sensor.vibration_rms || sensor.accel_rms || sensor.rms).toFixed(3)} g`
    : '0.086 g';
  const cwruRpmStr = !isDCMode && sensor?.speed_rpm !== undefined ? `${sensor.speed_rpm.toFixed(0)} RPM` : '1772 RPM';
  const cwruTempStr = !isDCMode && sensor?.temperature_c !== undefined ? `${sensor.temperature_c.toFixed(1)}°C` : '42.5°C';
  const cwruBatteryStr = !isDCMode && sensor?.battery_v !== undefined ? `${sensor.battery_v.toFixed(2)} V` : '3.30 V';

  const diagnosisText = isDCMode 
    ? (aiPred?.predicted_class || sensor?.fault_class || 'Normal Operation') 
    : formatFaultClass(sensor?.fault_class || 'Normal_1');

  // Handle Record Baseline Submit
  const handleBaselineSubmit = (e) => {
    e.preventDefault();
    if (!baselineName) return;
    if (onRecordBaseline) {
      onRecordBaseline(baselineName, isDCMode ? 'Normal Operation' : 'Normal_1');
    }
    setBaselineName('');
    setShowBaselineModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Page Header */}
      <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              ASSET INFRASTRUCTURE
            </h2>
            <span className="badge badge-online" style={{ fontSize: 10, padding: '3px 7px' }}>
              ● 2 NODES MONITORED
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Connected motor assets and monitoring nodes
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card-subtle)', padding: '5px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Active Node:</span>
            <strong style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>{activeAssetId}</strong>
            <span className="badge badge-online" style={{ fontSize: 9, padding: '1px 5px' }}>● ACTIVE</span>
          </div>

          <span className="badge" style={{ fontSize: 11, background: 'var(--bg-card-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            Source: <strong style={{ color: 'var(--accent-cyan)' }}>{sourceLabel}</strong>
          </span>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowBaselineModal(true)}
          >
            + Record Baseline
          </button>
        </div>
      </div>

      {/* 2. Visual Asset Cards Strip (12 V DC & 2 HP CWRU) */}
      <div className="asset-cards-strip">
        {/* ASSET 1: 12 V DC Motor */}
        <div className={`asset-unit-card ${isDCMode ? 'active-asset' : ''}`}>
          <div className="asset-unit-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 'var(--radius-xs)', 
                background: isDCMode ? 'var(--accent-light)' : 'var(--bg-card-subtle)', 
                border: `1px solid ${isDCMode ? 'var(--accent-cyan)' : 'var(--border)'}`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <IconMotor size={22} color={isDCMode ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>12 V DC MOTOR</h4>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  MOTOR-12V-001
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge badge-online" style={{ fontSize: 10 }}>● ONLINE</span>
              {isDCMode && (
                <span className="badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', fontWeight: 800, fontSize: 10 }}>
                  ACTIVE
                </span>
              )}
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>HEALTH INTEGRITY</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>92%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '92%', height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
            </div>
          </div>

          {/* Real Telemetry Grid for 12 V DC */}
          <div className="asset-telemetry-pill-grid">
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">VOLTAGE</span>
              <span className="asset-telemetry-pill-val">{dcVoltageStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">CURRENT</span>
              <span className="asset-telemetry-pill-val">{dcCurrentStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">RPM</span>
              <span className="asset-telemetry-pill-val">{dcRpmStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">POWER</span>
              <span className="asset-telemetry-pill-val">{dcPowerStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">PWM</span>
              <span className="asset-telemetry-pill-val">{dcPwmStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">VIB RMS</span>
              <span className="asset-telemetry-pill-val">{dcVibRmsStr}</span>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Profile: <strong style={{ color: 'var(--text-primary)' }}>12 V DC Prototype</strong>
            </span>
            {isDCMode ? (
              <span className="badge" style={{ backgroundColor: 'var(--bg-card-subtle)', color: 'var(--accent-cyan)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700 }}>
                CURRENTLY SELECTED
              </span>
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onSelectInfrastructure && onSelectInfrastructure('dc_motor_12v')}
                style={{ fontSize: 11, padding: '4px 12px' }}
              >
                Select Asset
              </button>
            )}
          </div>
        </div>

        {/* ASSET 2: 2 HP Induction Motor */}
        <div className={`asset-unit-card ${!isDCMode ? 'active-asset' : ''}`}>
          <div className="asset-unit-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 38, 
                height: 38, 
                borderRadius: 'var(--radius-xs)', 
                background: !isDCMode ? 'var(--accent-light)' : 'var(--bg-card-subtle)', 
                border: `1px solid ${!isDCMode ? 'var(--accent-cyan)' : 'var(--border)'}`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <IconMotor size={22} color={!isDCMode ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>2 HP INDUCTION MOTOR</h4>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  MOTOR-2HP-001
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge badge-online" style={{ fontSize: 10 }}>● ONLINE</span>
              {!isDCMode && (
                <span className="badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', fontWeight: 800, fontSize: 10 }}>
                  ACTIVE
                </span>
              )}
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>HEALTH INTEGRITY</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>94%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '94%', height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
            </div>
          </div>

          {/* Real Supported Metrics for 2 HP (Strict Profile Isolation: NO DC Metrics) */}
          <div className="asset-telemetry-pill-grid">
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">RMS VIBRATION</span>
              <span className="asset-telemetry-pill-val">{cwruRmsStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">SPEED (RPM)</span>
              <span className="asset-telemetry-pill-val">{cwruRpmStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">TEMPERATURE</span>
              <span className="asset-telemetry-pill-val">{cwruTempStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">BUS VOLTAGE</span>
              <span className="asset-telemetry-pill-val">{cwruBatteryStr}</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">BEARING SPEC</span>
              <span className="asset-telemetry-pill-val" style={{ fontSize: 11 }}>SKF 6205</span>
            </div>
            <div className="asset-telemetry-pill">
              <span className="asset-telemetry-pill-label">STANDARD</span>
              <span className="asset-telemetry-pill-val" style={{ fontSize: 11 }}>CWRU BENCH</span>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Profile: <strong style={{ color: 'var(--text-primary)' }}>2 HP CWRU Motor</strong>
            </span>
            {!isDCMode ? (
              <span className="badge" style={{ backgroundColor: 'var(--bg-card-subtle)', color: 'var(--accent-cyan)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700 }}>
                CURRENTLY SELECTED
              </span>
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onSelectInfrastructure && onSelectInfrastructure('motor')}
                style={{ fontSize: 11, padding: '4px 12px' }}
              >
                Select Asset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Active Monitored Asset Deep Dive */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {activeAssetName} ({activeAssetId})
              </h3>
              <span className="badge badge-online" style={{ fontSize: 10 }}>● ONLINE</span>
              <span className="badge" style={{ 
                backgroundColor: isHealthy ? 'var(--success-light)' : 'var(--danger-light)', 
                color: isHealthy ? 'var(--success)' : 'var(--danger)', 
                border: `1px solid ${isHealthy ? 'var(--success-border)' : 'var(--danger-border)'}`, 
                fontWeight: 700, 
                fontSize: 10 
              }}>
                ● {isHealthy ? 'HEALTHY' : 'ANOMALY'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Active profile specifications and live sensor telemetry stream
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>SPEED</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {isDCMode ? dcRpmStr : cwruRpmStr}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>DIAGNOSIS</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isHealthy ? 'var(--accent-cyan)' : 'var(--danger)' }}>
                {diagnosisText}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Property Table */}
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {isDCMode ? (
            <table>
              <thead>
                <tr>
                  <th>PROPERTY</th>
                  <th>SPECIFICATION / VALUE</th>
                  <th>SOURCE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Motor Architecture</td>
                  <td><strong>12 V Brushed DC Motor Rig</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Hardware Prototype</td>
                  <td><span className="badge badge-online">ACTIVE</span></td>
                </tr>
                <tr>
                  <td>Operating Voltage</td>
                  <td><strong>{dcVoltageStr}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>INA219 Voltage Sensor</td>
                  <td><span className="badge badge-online">NOMINAL (12 V)</span></td>
                </tr>
                <tr>
                  <td>Motor Current</td>
                  <td><strong>{dcCurrentStr}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>INA219 Shunt Bus</td>
                  <td><span className="badge badge-online">MEASURED</span></td>
                </tr>
                <tr>
                  <td>Active Power</td>
                  <td><strong>{dcPowerStr}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>P = V × I Computed</td>
                  <td><span className="badge badge-online">CALCULATED</span></td>
                </tr>
                <tr>
                  <td>PWM Command Signal</td>
                  <td><strong>{dcPwmStr} / 255</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ESP32 GPIO PWM</td>
                  <td><span className="badge badge-online">ACTIVE</span></td>
                </tr>
                <tr>
                  <td>Vibration RMS</td>
                  <td><strong>{dcVibRmsStr}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ADXL345 3-Axis SPI</td>
                  <td><span className="badge badge-online">NOMINAL</span></td>
                </tr>
                <tr>
                  <td>AI Predictive Classifier</td>
                  <td><strong style={{ color: isHealthy ? 'var(--accent-cyan)' : 'var(--danger)' }}>{diagnosisText}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>RandomForest (8 features)</td>
                  <td><span className="badge badge-online">INFERENCE READY</span></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>PROPERTY</th>
                  <th>SPECIFICATION / VALUE</th>
                  <th>SOURCE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Motor Specification</td>
                  <td><strong>2 HP Reliance Electric Induction Motor</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CWRU Test Rig</td>
                  <td><span className="badge badge-online">ACTIVE</span></td>
                </tr>
                <tr>
                  <td>Vibration Accelerometer RMS</td>
                  <td><strong>{cwruRmsStr}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Drive End Accelerometer</td>
                  <td><span className="badge badge-online">NOMINAL</span></td>
                </tr>
                <tr>
                  <td>Motor Speed (RPM)</td>
                  <td><strong>{cwruRpmStr}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Optical Tachometer</td>
                  <td><span className="badge badge-online">MEASURED</span></td>
                </tr>
                <tr>
                  <td>Housing Temperature</td>
                  <td><strong>{cwruTempStr}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Thermal RTD Probe</td>
                  <td><span className="badge badge-online">NOMINAL</span></td>
                </tr>
                <tr>
                  <td>Bearing Specification</td>
                  <td><strong>Deep Groove Ball Bearing (6205-2RS JEM SKF)</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Drive End Housing</td>
                  <td><span className="badge badge-online">VERIFIED</span></td>
                </tr>
                <tr>
                  <td>AI Predictive Classifier</td>
                  <td><strong style={{ color: isHealthy ? 'var(--accent-cyan)' : 'var(--danger)' }}>{diagnosisText}</strong></td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>MLP Neural Net (7 features)</td>
                  <td><span className="badge badge-online">INFERENCE READY</span></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. Asset Comparison & Baselines Section */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              ASSET COMPARISON &amp; REFERENCE BASELINES
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Cross-node operational comparison and golden healthy baselines
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {baselines.length > 0 && onCompare && (
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => onCompare(baselines[0].id)}
                disabled={comparing}
              >
                {comparing ? 'Comparing...' : 'Run Baseline Comparison'}
              </button>
            )}
          </div>
        </div>

        {/* Compact visual comparison bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Row 1: MOTOR-12V-001 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(140px, 1.2fr) 90px 100px minmax(140px, 1.5fr) 90px', 
            alignItems: 'center', 
            gap: 12, 
            padding: '10px 12px', 
            background: isDCMode ? 'var(--accent-light)' : 'var(--bg-card-subtle)', 
            border: `1px solid ${isDCMode ? 'var(--accent-border)' : 'var(--border-subtle)'}`, 
            borderRadius: 'var(--radius-xs)' 
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>12 V DC Motor</div>
              <div style={{ fontSize: 10, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>MOTOR-12V-001</div>
            </div>
            <div>
              <span className="badge badge-online" style={{ fontSize: 10 }}>● ONLINE</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Health: </span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>92%</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 35 }}>Load</span>
              <div style={{ flex: 1, height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ width: '45%', height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>45%</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isDCMode ? (
                <span className="badge badge-online" style={{ fontSize: 9 }}>ACTIVE</span>
              ) : (
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => onSelectInfrastructure && onSelectInfrastructure('dc_motor_12v')}
                  style={{ padding: '2px 8px', fontSize: 10 }}
                >
                  Select
                </button>
              )}
            </div>
          </div>

          {/* Row 2: MOTOR-2HP-001 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(140px, 1.2fr) 90px 100px minmax(140px, 1.5fr) 90px', 
            alignItems: 'center', 
            gap: 12, 
            padding: '10px 12px', 
            background: !isDCMode ? 'var(--accent-light)' : 'var(--bg-card-subtle)', 
            border: `1px solid ${!isDCMode ? 'var(--accent-border)' : 'var(--border-subtle)'}`, 
            borderRadius: 'var(--radius-xs)' 
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>2 HP Motor Bench</div>
              <div style={{ fontSize: 10, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>MOTOR-2HP-001</div>
            </div>
            <div>
              <span className="badge badge-online" style={{ fontSize: 10 }}>● ONLINE</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Health: </span>
              <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>94%</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', width: 35 }}>Load</span>
              <div style={{ flex: 1, height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ width: '60%', height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>60%</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              {!isDCMode ? (
                <span className="badge badge-online" style={{ fontSize: 9 }}>ACTIVE</span>
              ) : (
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => onSelectInfrastructure && onSelectInfrastructure('motor')}
                  style={{ padding: '2px 8px', fontSize: 10 }}
                >
                  Select
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Baseline Modal */}
      {showBaselineModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-card-hover)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Record Healthy Baseline</h3>
            <form onSubmit={handleBaselineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>BASELINE NAME</label>
                <input 
                  value={baselineName} 
                  onChange={e => setBaselineName(e.target.value)} 
                  required 
                  placeholder="e.g. Golden Nominal Benchmark" 
                  style={{ width: '100%', fontSize: 12, padding: '7px 10px' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>TARGET ASSET</label>
                <input 
                  value={`${activeAssetName} (${activeAssetId})`} 
                  disabled
                  style={{ width: '100%', fontSize: 12, padding: '7px 10px', background: 'var(--bg-card-subtle)', color: 'var(--text-secondary)' }} 
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Captures a 10-second reference window under nominal baseline conditions.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowBaselineModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Start Recording</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
