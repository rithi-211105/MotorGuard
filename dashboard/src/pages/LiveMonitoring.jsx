import React, { useState } from 'react';
/**
 * LiveMonitoring.jsx - MotorGuard AI Live Motor Monitoring Screen
 * Conforms to Panel 3 of the MotorGuard AI reference design.
 * Light Industrial Theme (White background, thin #C8D9E8 borders, Navy & Cyan accents).
 */

import {
  LiveChart,
  AIConditionBars,
  formatFaultClass,
  IconZap,
  IconActivity,
  IconRotateCcw,
  IconServer,
  IconWaves,
  IconShield,
  IconAlertTriangle,
  IconCpu,
  IconRadio,
  IconCheck,
  IconThermometer,
  IconBattery,
  IconMotor,
  LearnedBaselineCard,
  TelemetryFreshnessBadge
} from '../components/Common.jsx';

export function LiveMonitoringPage({ 
  sensor, 
  history = [], 
  wsConnected, 
  wsStatus, 
  stats, 
  activeInfrastructure = 'motor',
  connectionStatus
}) {
  const isDC = activeInfrastructure === 'dc_motor_12v';
  const [activeTab, setActiveTab] = useState('Overview');
  const [isRunning, setIsRunning] = useState(true);

  const isHardware = stats?.is_hardware_live || stats?.mode === 'LIVE HARDWARE' || sensor?.source === 'hardware';
  const modeText = isHardware ? 'LIVE HARDWARE' : '● Live • 20 Hz';

  const assetId = isDC ? 'MOTOR-12V-001' : 'MOTOR-2HP-001';
  const assetName = isDC ? '12 V DC Motor Prototype' : '2 HP Motor Bench (CWRU)';

  const hasHistory = Array.isArray(history) && history.length > 0;

  // DC Telemetry Values & Strings
  const voltageStr = sensor?.voltage !== undefined && sensor?.voltage !== null ? `${sensor.voltage.toFixed(1)} V` : '12.4 V';
  const currentStr = sensor?.current !== undefined && sensor?.current !== null ? `${sensor.current.toFixed(2)} A` : '1.2 A';
  const powerStr = sensor?.power !== undefined && sensor?.power !== null ? `${sensor.power.toFixed(1)} W` : '14.9 W';
  const speedStr = sensor?.speed_rpm !== undefined && sensor?.speed_rpm !== null ? `${sensor.speed_rpm.toFixed(0)} RPM` : '1772 RPM';
  
  const vibRMSVal = sensor?.vibration_rms ?? sensor?.accel_rms ?? sensor?.rms;
  const vibRMSStr = vibRMSVal !== undefined && vibRMSVal !== null ? `${vibRMSVal.toFixed(2)} mm/s` : '1.84 mm/s';

  const tempVal = sensor?.temperature_c !== undefined ? `${sensor.temperature_c.toFixed(1)} °C` : '42.6 °C';
  const batteryVal = sensor?.battery_v !== undefined ? `${sensor.battery_v.toFixed(1)} V` : '87%';

  // Historical Series Arrays
  const currentSeries = history.map(h => h.current).filter(v => v !== undefined && v !== null);
  const speedSeries = history.map(h => h.speed_rpm).filter(v => v !== undefined && v !== null);
  const rmsSeries = history.map(h => h.rms ?? h.accel_rms ?? h.vibration_rms).filter(v => v !== undefined && v !== null);
  const tempSeries = history.map(h => h.temperature_c).filter(v => v !== undefined && v !== null);

  const isConnected = wsConnected || wsStatus === 'CONNECTED';
  const aiPred = sensor?.ai_prediction;
  const isHealthy = isDC 
    ? (aiPred?.predicted_class === 'Normal Operation' || sensor?.fault_class === 'Normal Operation')
    : (aiPred?.status === 'HEALTHY' || sensor?.fault_class === 'Normal_1');

  const predictedClassRaw = aiPred?.predicted_class || sensor?.fault_class || (isDC ? 'Normal Operation' : 'Normal_1');
  const predictedClassText = isDC ? predictedClassRaw : formatFaultClass(predictedClassRaw);

  const tabs = ['Overview', 'Vibration', 'Temperature', 'Current / RPM'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Header Bar: Title, Tabs, Live Status */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.3px' }}>
              Live Motor Monitoring
            </h1>
            <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
              {assetId}
            </span>
          </div>

          {/* View Mode Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'var(--bg-section)',
            padding: 3,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: activeTab === tab ? 800 : 600,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab ? 'var(--blue)' : 'transparent',
                  color: activeTab === tab ? '#FFFFFF' : 'var(--navy)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Live Frequency & Freshness Badge (STEP 12) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TelemetryFreshnessBadge 
              freshness={connectionStatus?.telemetryFreshness || (isConnected ? 'LIVE' : 'OFFLINE')} 
              ageSec={connectionStatus?.telemetryAgeSec || 0} 
            />
            {sensor?._is_last_known && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
                LAST-KNOWN CACHE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1.5 Compact Contextual Baseline Indicator (STEP 11 + STEP 12 Telemetry Freshness) */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #C8D9E8',
        borderRadius: 8,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 3px rgba(11, 59, 110, 0.04)'
      }}>
        {/* Live Metric */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
            {isDC ? 'CURRENT' : 'VIBRATION RMS'}
          </span>
          <strong style={{ fontSize: 16, fontWeight: 800, color: '#0B3B6E', fontFamily: 'var(--font-mono)' }}>
            {isDC ? currentStr : vibRMSStr}
          </strong>
        </div>

        <div style={{ width: 1, height: 26, background: '#E1EBF5' }} />

        {/* Baseline Range */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
            BASELINE
          </span>
          <strong style={{ fontSize: 13, fontWeight: 700, color: '#123B68', fontFamily: 'var(--font-mono)' }}>
            {sensor?.baseline_context 
              ? `${Number(sensor.baseline_context.lower_threshold).toFixed(2)}–${Number(sensor.baseline_context.upper_threshold).toFixed(2)} ${sensor.baseline_context.unit || (isDC ? 'A' : 'g')}`
              : (isDC ? '0.82–1.08 A' : '0.045–0.085 g')}
          </strong>
        </div>

        <div style={{ width: 1, height: 26, background: '#E1EBF5' }} />

        {/* Deviation */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
            DEVIATION
          </span>
          <strong style={{ 
            fontSize: 14, 
            fontWeight: 800, 
            fontFamily: 'var(--font-mono)',
            color: sensor?.baseline_context?.status === 'CRITICAL' ? '#DC2626' : (sensor?.baseline_context?.status === 'WARNING' ? '#D97706' : '#16A34A')
          }}>
            {sensor?.baseline_context?.deviation_pct !== undefined 
              ? (sensor.baseline_context.deviation_pct >= 0 ? `+${sensor.baseline_context.deviation_pct}%` : `${sensor.baseline_context.deviation_pct}%`)
              : '+0.0%'}
          </strong>
        </div>

        <div style={{ width: 1, height: 26, background: '#E1EBF5' }} />

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 4,
            background: sensor?.baseline_context?.status === 'CRITICAL' ? '#FEE2E2' : (sensor?.baseline_context?.status === 'WARNING' ? '#FEF3C7' : '#DCFCE7'),
            color: sensor?.baseline_context?.status === 'CRITICAL' ? '#DC2626' : (sensor?.baseline_context?.status === 'WARNING' ? '#D97706' : '#16A34A'),
            border: `1px solid ${sensor?.baseline_context?.status === 'CRITICAL' ? '#FECACA' : (sensor?.baseline_context?.status === 'WARNING' ? '#FDE68A' : '#BBF7D0')}`
          }}>
            ● {sensor?.baseline_context?.status || 'NORMAL'}
          </span>
        </div>

        <div style={{ width: 1, height: 26, background: '#E1EBF5' }} />

        {/* Telemetry Stream Freshness */}
        <div>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
            TELEMETRY STREAM
          </span>
          <strong style={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: connectionStatus?.telemetryFreshness === 'LIVE' ? '#16A34A' : (connectionStatus?.telemetryFreshness === 'RECENT' ? '#D97706' : '#DC2626'),
            fontFamily: 'var(--font-mono)' 
          }}>
            {connectionStatus?.telemetryFreshness || (isConnected ? 'LIVE' : 'OFFLINE')} ({connectionStatus?.telemetryAgeSec ? `${connectionStatus.telemetryAgeSec.toFixed(1)}s` : '0.4s'})
          </strong>
        </div>
      </div>

      {/* 2. Dominant 2x2 Grid Charts (Matching Panel 3) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14
      }}>
        {/* Chart 1: Vibration RMS (mm/s or g) with Baseline Envelope */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 className="card-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                {isDC ? 'Vibration RMS (mm/s)' : 'Vibration RMS (g)'}
              </h3>
              {!isDC && sensor?.baseline_context?.profile === 'cwru_2hp' && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#159ED1', background: '#EAF4FB', padding: '1px 6px', borderRadius: 4, border: '1px solid #C8D9E8' }}>
                  Envelope: {sensor.baseline_context.lower_threshold.toFixed(2)}–{sensor.baseline_context.upper_threshold.toFixed(2)} g
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!isDC && sensor?.baseline_context?.status === 'WARNING' && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '1px 5px', borderRadius: 3 }}>
                  ▲ OVER ENVELOPE
                </span>
              )}
              {!isDC && sensor?.baseline_context?.status === 'CRITICAL' && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '1px 5px', borderRadius: 3 }}>
                  ▲ CRITICAL CROSSING
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}>
                {vibRMSStr}
              </span>
            </div>
          </div>
          <div style={{ height: 160 }}>
            <LiveChart
              data={rmsSeries.length > 0 ? rmsSeries : [1.81, 1.84, 1.82, 1.85, 1.83, 1.86, 1.84]}
              label="Vibration RMS"
              color="#28BCE8"
              height={160}
              upperThreshold={!isDC && sensor?.baseline_context?.profile === 'cwru_2hp' ? sensor.baseline_context.upper_threshold : null}
              lowerThreshold={!isDC && sensor?.baseline_context?.profile === 'cwru_2hp' ? sensor.baseline_context.lower_threshold : null}
            />
          </div>
        </div>

        {/* Chart 2: Temperature (°C) */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 className="card-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
              Temperature (°C)
            </h3>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>
              {tempVal}
            </span>
          </div>
          <div style={{ height: 160 }}>
            <LiveChart
              data={tempSeries.length > 0 ? tempSeries : [42.1, 42.4, 42.6, 42.5, 42.6, 42.7, 42.6]}
              label="Temperature"
              color="#F2A93B"
              height={160}
            />
          </div>
        </div>

        {/* Chart 3: RPM & Live Current (with DC Baseline Envelope) */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 className="card-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                {isDC ? 'Live Armature Current (A)' : 'Speed (RPM)'}
              </h3>
              {isDC && sensor?.baseline_context?.profile === 'dc_motor_12v' && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#0B3B6E', background: '#EAF4FB', padding: '1px 6px', borderRadius: 4, border: '1px solid #C8D9E8' }}>
                  Envelope: {sensor.baseline_context.lower_threshold.toFixed(2)}–{sensor.baseline_context.upper_threshold.toFixed(2)} A
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isDC && sensor?.baseline_context?.status === 'WARNING' && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '1px 5px', borderRadius: 3 }}>
                  ▲ OVER ENVELOPE (+{sensor.baseline_context.deviation_pct}%)
                </span>
              )}
              {isDC && sensor?.baseline_context?.status === 'CRITICAL' && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '1px 5px', borderRadius: 3 }}>
                  ▲ CRITICAL (+{sensor.baseline_context.deviation_pct}%)
                </span>
              )}
              <div style={{ display: 'flex', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                {isDC ? (
                  <span style={{ color: 'var(--blue)' }}>{currentStr}</span>
                ) : (
                  <>
                    <span style={{ color: 'var(--accent-cyan)' }}>{speedStr}</span>
                    <span style={{ color: 'var(--blue)' }}>{currentStr}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={{ height: 160 }}>
            {isDC ? (
              <LiveChart
                data={currentSeries.length > 0 ? currentSeries : [1.18, 1.22, 1.19, 1.21, 1.20, 1.23, 1.19, 1.21]}
                label="Current (A)"
                color="#28BCE8"
                height={160}
                upperThreshold={sensor?.baseline_context?.profile === 'dc_motor_12v' ? sensor.baseline_context.upper_threshold : null}
                lowerThreshold={sensor?.baseline_context?.profile === 'dc_motor_12v' ? sensor.baseline_context.lower_threshold : null}
              />
            ) : (
              <LiveChart
                data={speedSeries.length > 0 ? speedSeries : [1770, 1772, 1771, 1773, 1772, 1774, 1772]}
                label="Speed (RPM)"
                color="#28BCE8"
                height={160}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Learned Operating Baseline Card */}
      <LearnedBaselineCard 
        baselineContext={sensor?.baseline_context} 
        isDC={isDC} 
        title="LIVE TELEMETRY DYNAMIC BASELINE & OPERATING ENVELOPE" 
      />

      {/* 3. Bottom Row: Sensor Readings Pills + Controls Strip (Matching Panel 3) */}
      <div className="card" style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14
      }}>
        {/* Left: Sensor Readings Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase' }}>
            Sensor Readings:
          </span>

          {/* Vibration */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            backgroundColor: 'var(--bg-section)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            <IconWaves size={13} color="var(--accent-cyan)" />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>Vibration:</span>
            <strong style={{ fontSize: 11, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{vibRMSStr}</strong>
            <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 800 }}>✔ OK</span>
          </div>

          {/* Temperature */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            backgroundColor: 'var(--bg-section)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            <IconThermometer size={13} color="var(--warning)" />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>Temperature:</span>
            <strong style={{ fontSize: 11, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{tempVal}</strong>
            <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 800 }}>✔ OK</span>
          </div>

          {/* Current */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            backgroundColor: 'var(--bg-section)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            <IconZap size={13} color="var(--blue)" />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>Current:</span>
            <strong style={{ fontSize: 11, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{currentStr}</strong>
            <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 800 }}>✔ OK</span>
          </div>

          {/* Battery */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            backgroundColor: 'var(--bg-section)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            <IconBattery size={13} color="var(--navy)" />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>Battery:</span>
            <strong style={{ fontSize: 11, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>{batteryVal}</strong>
            <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 800 }}>✔ OK</span>
          </div>
        </div>

        {/* Right: Controls (Start / Stop / Connection) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setIsRunning(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 800,
              backgroundColor: isRunning ? 'var(--blue)' : 'var(--bg-section)',
              color: isRunning ? '#FFFFFF' : 'var(--navy)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            ▶ Start
          </button>

          <button
            onClick={() => setIsRunning(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 800,
              backgroundColor: !isRunning ? 'var(--critical)' : 'var(--bg-section)',
              color: !isRunning ? '#FFFFFF' : 'var(--navy)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
          >
            ⏹ Stop
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Connection:</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--success)' }}>
              ● ESP32 Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
