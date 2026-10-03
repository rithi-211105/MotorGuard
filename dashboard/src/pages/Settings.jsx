import React, { useState } from 'react';
/**
 * Settings.jsx - System Settings & Technical Configuration Center
 * Deep Navy + Cyan Technical Industrial Theme (Step 7 Visual Redesign)
 */

import { 
  CLASS_HUMAN_NAMES, 
  IconSettings, 
  IconCpu, 
  IconServer, 
  IconRadio, 
  IconZap, 
  IconActivity, 
  IconPlay, 
  IconPause, 
  IconSquare, 
  IconRotateCcw,
  IconMotor,
  IconShield,
  EdgeArchitectureFlow
} from '../components/Common.jsx';

export function SettingsPage({ 
  stats, 
  sensor, 
  aiStatusData, 
  simulationStatus, 
  selectedCondition = 'Normal_1', 
  replaySpeed = 1.0,
  onConditionChange, 
  onSpeedChange,
  onStartSim,
  onStopSim,
  onPauseSim,
  onResumeSim,
  onResetSim,
  activeInfrastructure = 'cwru_2hp',
  activeProfile = 'cwru_2hp',
  isDC = false,
  connectionStatus
}) {
  const isDCMode = isDC || activeInfrastructure === 'dc_motor_12v' || activeProfile === 'dc_motor_12v';
  const assetId = isDCMode ? 'MOTOR-12V-001' : 'MOTOR-2HP-001';
  const assetName = isDCMode ? '12 V DC Motor Prototype' : '2 HP Motor Bench (CWRU)';

  // Alert threshold states
  const [vibThreshold, setVibThreshold] = useState(0.35);
  const [currThreshold, setCurrThreshold] = useState(2.5);
  const [tempThreshold, setTempThreshold] = useState(60.0);

  // Condition options for each profile
  const cwruClasses = [
    "Normal_1", "Ball_007_1", "Ball_014_1", "Ball_021_1",
    "IR_007_1", "IR_014_1", "IR_021_1", "OR_007_6_1", "OR_014_6_1", "OR_021_6_1"
  ];

  const dcClasses = [
    "Normal Operation",
    "Loose Foundation",
    "Suboptimal Control (Speed Reg)",
    "Suboptimal Control (Speed+Current Reg)"
  ];

  const availableClasses = isDCMode ? dcClasses : cwruClasses;
  const speedOptions = [0.5, 1.0, 2.0, 5.0, 10.0];
  const simState = simulationStatus?.state || 'RUNNING';

  // Real connection status detection
  const isHardwareLive = connectionStatus?.hardware === 'online' || Boolean(stats?.is_hardware_live || stats?.mode === 'LIVE HARDWARE' || sensor?.source === 'hardware');
  const isWsConnected = connectionStatus?.websocket === 'connected' || Boolean(stats || sensor);
  const isBackendOnline = connectionStatus?.backend === 'online';
  const isInternetOnline = connectionStatus?.internet === 'online';
  const isAiReady = aiStatusData ? aiStatusData.status !== 'error' : true;
  const isDbConnected = Boolean(stats?.db_connected !== false);
  const currentMode = connectionStatus?.mode || (isWsConnected ? (isInternetOnline ? 'online' : 'local') : 'offline');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Page Header */}
      <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              SYSTEM SETTINGS
            </h2>
            <span className="badge badge-online" style={{ fontSize: 10, padding: '3px 7px' }}>
              ● SIMULATOR {simState}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            MotorGuard monitoring and system configuration
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card-subtle)', padding: '5px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Profile:</span>
            <strong style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>{assetName}</strong>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({assetId})</span>
          </div>
        </div>
      </div>

      {/* 2. Top Status Cards Row */}
      <div className="settings-grid-layout">
        {/* Panel 1: Edge & Connectivity Status Panel (Section 17) */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title-wrap">
              <IconServer size={18} color="var(--accent-cyan)" />
              <div>
                <div className="settings-card-title">EDGE / CONNECTIVITY STATUS</div>
                <div className="settings-card-desc">Real-time edge hardware, local services, and processing architecture</div>
              </div>
            </div>
            <span className="badge" style={{ 
              fontSize: 10,
              backgroundColor: currentMode === 'online' ? 'var(--success-light)' : (currentMode === 'local' ? 'var(--accent-light)' : (currentMode === 'degraded' ? '#FEF3C7' : 'var(--danger-light)')),
              color: currentMode === 'online' ? 'var(--success)' : (currentMode === 'local' ? 'var(--accent-cyan)' : (currentMode === 'degraded' ? '#D97706' : 'var(--danger)')),
              border: `1px solid ${currentMode === 'online' ? 'var(--success-border)' : (currentMode === 'local' ? 'var(--accent-border)' : (currentMode === 'degraded' ? '#FDE68A' : 'var(--danger-border)'))}`,
              fontWeight: 800
            }}>
              ● {currentMode === 'online' ? 'ONLINE (HYBRID)' : (currentMode === 'local' ? 'LOCAL OPERATION' : (currentMode === 'degraded' ? 'DEGRADED' : 'OFFLINE'))}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Hardware Node */}
            <div className="connection-status-item">
              <span className="connection-status-name">
                <span style={{ color: isHardwareLive ? 'var(--success)' : 'var(--warning)', fontSize: 10 }}>●</span>
                HARDWARE NODE
              </span>
              <span className="badge" style={{ 
                fontSize: 10, 
                backgroundColor: isHardwareLive ? 'var(--success-light)' : 'var(--bg-card)', 
                color: isHardwareLive ? 'var(--success)' : 'var(--text-secondary)', 
                border: `1px solid ${isHardwareLive ? 'var(--success-border)' : 'var(--border)'}`,
                fontWeight: 700 
              }}>
                {isHardwareLive ? 'ESP32 ONLINE (LIVE)' : 'ESP32 (SIMULATED 20 Hz)'}
              </span>
            </div>

            {/* Backend */}
            <div className="connection-status-item">
              <span className="connection-status-name">
                <span style={{ color: isBackendOnline ? 'var(--success)' : 'var(--danger)', fontSize: 10 }}>●</span>
                BACKEND
              </span>
              <span className="badge" style={{ 
                fontSize: 10,
                backgroundColor: isBackendOnline ? 'var(--success-light)' : 'var(--danger-light)',
                color: isBackendOnline ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${isBackendOnline ? 'var(--success-border)' : 'var(--danger-border)'}`,
                fontWeight: 700
              }}>
                {isBackendOnline ? 'FASTAPI LOCAL HOST' : 'FASTAPI OFFLINE'}
              </span>
            </div>

            {/* Telemetry */}
            <div className="connection-status-item">
              <span className="connection-status-name">
                <span style={{ color: isWsConnected ? 'var(--success)' : 'var(--danger)', fontSize: 10 }}>●</span>
                TELEMETRY
              </span>
              <span className="badge" style={{ 
                fontSize: 10,
                backgroundColor: isWsConnected ? 'var(--success-light)' : 'var(--danger-light)',
                color: isWsConnected ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${isWsConnected ? 'var(--success-border)' : 'var(--danger-border)'}`,
                fontWeight: 700
              }}>
                {isWsConnected ? 'WEBSOCKET CONNECTED (20 Hz)' : 'WEBSOCKET DISCONNECTED'}
              </span>
            </div>

            {/* AI Processing */}
            <div className="connection-status-item">
              <span className="connection-status-name">
                <span style={{ color: isAiReady ? 'var(--accent-cyan)' : 'var(--danger)', fontSize: 10 }}>●</span>
                AI PROCESSING
              </span>
              <span className="badge" style={{ 
                fontSize: 10,
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-border)',
                fontWeight: 700
              }}>
                LOCAL RUNTIME (FASTAPI HOST)
              </span>
            </div>

            {/* Database */}
            <div className="connection-status-item">
              <span className="connection-status-name">
                <span style={{ color: isDbConnected ? 'var(--success)' : 'var(--danger)', fontSize: 10 }}>●</span>
                DATABASE
              </span>
              <span className="badge badge-online" style={{ fontSize: 10 }}>
                SQLITE (infra_monitor.db)
              </span>
            </div>

            {/* Internet Link */}
            <div className="connection-status-item">
              <span className="connection-status-name">
                <span style={{ color: isInternetOnline ? 'var(--success)' : 'var(--text-muted)', fontSize: 10 }}>●</span>
                INTERNET
              </span>
              <span className="badge" style={{ 
                fontSize: 10,
                backgroundColor: isInternetOnline ? 'var(--success-light)' : 'var(--bg-card)',
                color: isInternetOnline ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${isInternetOnline ? 'var(--success-border)' : 'var(--border)'}`,
                fontWeight: 700
              }}>
                {isInternetOnline ? 'ONLINE (OPTIONAL)' : 'OFFLINE (NOT REQUIRED)'}
              </span>
            </div>

            {/* Operating Mode */}
            <div className="connection-status-item">
              <span className="connection-status-name">
                <span style={{ color: 'var(--accent-cyan)', fontSize: 10 }}>●</span>
                OPERATING MODE
              </span>
              <strong style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {currentMode === 'online' ? 'ONLINE' : (currentMode === 'local' ? 'LOCAL EDGE' : (currentMode === 'degraded' ? 'DEGRADED' : 'OFFLINE'))}
              </strong>
            </div>
          </div>
        </div>

        {/* Panel 2: Motor Profile & Hardware Config */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title-wrap">
              <IconMotor size={18} color="var(--accent-cyan)" />
              <div>
                <div className="settings-card-title">MOTOR PROFILE &amp; HARDWARE</div>
                <div className="settings-card-desc">Active asset architecture and edge sensor bus</div>
              </div>
            </div>
            <span className="badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-border)', fontSize: 10, fontWeight: 700 }}>
              {isDCMode ? '12 V DC' : '2 HP CWRU'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>ACTIVE ASSET ID</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{assetId}</div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>TELEMETRY RATE</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>50 ms (20 Hz)</div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>SENSOR INTERFACE</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                {isDCMode ? 'INA219 I2C + ADXL345' : 'ADXL345 SPI + Tach'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>PROCESSING CORE</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>ESP32 Dual Core 240MHz</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 8 }}>
            Active Profile: <strong>{assetName}</strong>. Strict profile isolation ensures model features and telemetry streams remain fully separated.
          </div>
        </div>
      </div>

      {/* Visual Edge Architecture & Local-First Industrial Guarantee (Section 18 & 20) */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>EDGE-FIRST ARCHITECTURE PIPELINE</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--accent-light)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-border)' }}>
                LOCAL INDUSTRIAL MONITORING
              </span>
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Stage-by-stage execution tiers from edge sensor acquisition to local browser rendering
            </div>
          </div>
        </div>

        <EdgeArchitectureFlow isDC={isDCMode} isHardwareLive={isHardwareLive} />

        <div style={{ 
          padding: '10px 14px', 
          background: 'var(--bg-card-subtle)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 6,
          fontSize: 11,
          lineHeight: 1.5,
          color: 'var(--text-secondary)'
        }}>
          <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: 2 }}>
            INDUSTRIAL LOCAL-FIRST GUARANTEE
          </strong>
          MotorGuard is designed for local industrial monitoring and does not require cloud connectivity for the monitoring dashboard to continue operating when the local telemetry/backend path remains available.
        </div>
      </div>

      {/* 3. Simulation & Alert Controls Row */}
      <div className="settings-grid-layout">
        {/* Panel 3: Simulation Controls */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title-wrap">
              <IconPlay size={18} color="var(--accent-cyan)" />
              <div>
                <div className="settings-card-title">SIMULATION CONTROLS</div>
                <div className="settings-card-desc">Inject operating conditions and adjust replay speed</div>
              </div>
            </div>
            <span className="badge badge-online" style={{ fontSize: 10 }}>{simState}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  MOTOR CONDITION / FAULT CLASS
                </label>
                <select 
                  value={selectedCondition}
                  onChange={(e) => onConditionChange && onConditionChange(e.target.value)}
                  style={{ width: '100%', fontSize: 12, fontWeight: 700, padding: '7px 8px' }}
                >
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>
                      {CLASS_HUMAN_NAMES[cls] || cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  REPLAY SPEED
                </label>
                <select 
                  value={replaySpeed}
                  onChange={(e) => onSpeedChange && onSpeedChange(parseFloat(e.target.value))}
                  style={{ width: '100%', fontSize: 12, fontWeight: 700, padding: '7px 8px' }}
                >
                  {speedOptions.map(s => (
                    <option key={s} value={s}>{s}x Speed</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons with distinct color semantics */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                SIMULATION EXECUTION ACTIONS
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={onStartSim} 
                  disabled={simState === 'RUNNING'}
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  ▶ START
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={onPauseSim} 
                  disabled={simState !== 'RUNNING'}
                  style={{ fontSize: 11, padding: '5px 10px' }}
                >
                  ⏸ PAUSE
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={onResumeSim} 
                  disabled={simState === 'RUNNING'}
                  style={{ fontSize: 11, padding: '5px 10px' }}
                >
                  ⏯ RESUME
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={onResetSim}
                  style={{ fontSize: 11, padding: '5px 10px' }}
                >
                  🔄 RESET
                </button>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={onStopSim}
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  ⏹ STOP
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: Alert Threshold Sliders */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-title-wrap">
              <IconShield size={18} color="var(--accent-cyan)" />
              <div>
                <div className="settings-card-title">ALERT THRESHOLD LIMITS</div>
                <div className="settings-card-desc">Safety envelope triggers for automated alerting</div>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-cyan)' }}>USER DEFINED</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isDCMode ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>CURRENT LIMIT (SHUTOFF THRESHOLD)</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{currThreshold} A</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="6.0" 
                  step="0.1" 
                  value={currThreshold}
                  onChange={(e) => setCurrThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>RMS VIBRATION CRITICAL LIMIT</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{vibThreshold} g</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.5" 
                  step="0.05" 
                  value={vibThreshold}
                  onChange={(e) => setVibThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                />
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>TEMPERATURE LIMIT (THERMAL CUTOFF)</span>
                <span style={{ color: 'var(--danger)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{tempThreshold}°C</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="100" 
                step="1" 
                value={tempThreshold}
                onChange={(e) => setTempThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--danger)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI Model Specifications Card */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IconCpu size={20} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                AI MODEL ARCHITECTURE SPECIFICATIONS
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Active inference engine and trained weights specification
              </div>
            </div>
          </div>

          <span className="badge badge-online" style={{ fontSize: 10 }}>
            ● MODEL READY
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>CLASSIFIER TYPE</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 2 }}>
              {isDCMode ? 'RandomForest (100 trees)' : 'MLPClassifier (100, 50)'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>FEATURE DIMENSIONS</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {isDCMode ? '8 Electrical Features' : '7 Vibration Features'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>TRAINING BENCHMARK</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {isDCMode ? '12 V DC Rig Dataset' : 'CWRU 12k Drive End'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>INFERENCE LATENCY</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              &lt; 2.5 ms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
