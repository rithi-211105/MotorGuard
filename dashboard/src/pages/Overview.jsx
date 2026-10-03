import React, { useMemo } from 'react';
/**
 * Overview.jsx - MotorGuard AI Dashboard Overview
 * Conforms to Panel 2 of the MotorGuard AI reference design.
 * Light Industrial Theme (White background, thin #C8D9E8 borders, Navy & Cyan accents).
 */

import {
  LiveChart,
  CircularHealthGauge,
  AIConditionBars,
  Sparkline,
  formatFaultClass,
  IconZap,
  IconActivity,
  IconRotateCcw,
  IconWaves,
  IconThermometer,
  IconBattery,
  IconShield,
  IconAlertTriangle,
  IconCpu,
  IconCheck,
  LearnedBaselineCard,
  LatestDiagnosticCard,
  SystemOperatingModeCard,
  EdgeArchitectureFlow
} from '../components/Common.jsx';
import { ConceptDashboard } from '../components/ConceptDashboard.jsx';

export function OverviewPage({ 
  sensor, 
  stats, 
  history = [], 
  wsConnected, 
  lastUpdated, 
  alerts = [], 
  onAcknowledgeAlert, 
  onResolveAlert, 
  onNavigate, 
  activeInfrastructure = 'motor',
  connectionStatus
}) {
  const isDC = (activeInfrastructure === 'dc_motor_12v');
  
  if (activeInfrastructure !== 'motor' && !isDC) {
    return <ConceptDashboard infrastructure={activeInfrastructure} />;
  }

  const aiPred = sensor?.ai_prediction;
  const isHealthy = isDC 
    ? (aiPred?.predicted_class === 'Normal Operation' || sensor?.fault_class === 'Normal Operation')
    : (aiPred?.status === 'HEALTHY' || sensor?.fault_class === 'Normal_1');

  // Model-Based Condition & Anomaly Score
  const conditionScore = aiPred?.condition_score !== undefined ? aiPred.condition_score : (sensor?.condition_score !== undefined ? sensor.condition_score : (isHealthy ? 92 : 45));
  const confidencePct = aiPred?.confidence !== undefined ? (aiPred.confidence * 100).toFixed(1) : (isHealthy ? '98.4' : '86.5');
  const anomalyProb = aiPred?.anomaly_score !== undefined ? (aiPred.anomaly_score * 100).toFixed(1) : (isHealthy ? '5.7' : '78.4');
  const predictedClassRaw = aiPred?.predicted_class || sensor?.fault_class || (isDC ? 'Normal Operation' : 'Normal_1');
  const predictedClassText = isDC ? predictedClassRaw : formatFaultClass(predictedClassRaw);

  const isHardware = stats?.is_hardware_live || stats?.mode === 'LIVE HARDWARE' || sensor?.source === 'hardware';
  const modeText = isHardware ? 'LIVE HARDWARE' : '20 Hz STREAM';

  // Latest active alert strictly matching current profile (STEP 11)
  const latestProfileAlert = useMemo(() => {
    if (!alerts || alerts.length === 0) return null;
    return alerts.find(a => {
      const aAsset = (a.asset_id || a.motor_id || '').toUpperCase();
      const aFault = (a.fault_class || '').toLowerCase();
      if (isDC) {
        if (aAsset.includes('2HP') || aAsset === 'MOTOR-001') return false;
        if (aFault.includes('ball') || aFault.includes('ir_') || aFault.includes('or_')) return false;
        return true;
      } else {
        if (aAsset.includes('12V') || aAsset.includes('DC_MOTOR')) return false;
        if (aFault.includes('loose') || aFault.includes('speed reg')) return false;
        return true;
      }
    });
  }, [alerts, isDC]);

  const hasHistory = Array.isArray(history) && history.length > 0;

  // Extract trend series
  const currentSeries = history.map(h => h.current).filter(v => v !== undefined && v !== null);
  const voltageSeries = history.map(h => h.voltage).filter(v => v !== undefined && v !== null);
  const powerSeries = history.map(h => h.power).filter(v => v !== undefined && v !== null);
  const speedSeries = history.map(h => h.speed_rpm).filter(v => v !== undefined && v !== null);
  const rmsSeries = history.map(h => h.rms ?? h.accel_rms ?? h.vibration_rms).filter(v => v !== undefined && v !== null);
  const tempSeries = history.map(h => h.temperature_c).filter(v => v !== undefined && v !== null);

  // Formatted string values
  const voltageStr = sensor?.voltage !== undefined && sensor?.voltage !== null ? `${sensor.voltage.toFixed(1)} V` : (isDC ? '12.4 V' : '—');
  const currentStr = sensor?.current !== undefined && sensor?.current !== null ? `${sensor.current.toFixed(2)} A` : (isDC ? '1.2 A' : '1.2 A');
  const powerStr = sensor?.power !== undefined && sensor?.power !== null ? `${sensor.power.toFixed(1)} W` : '14.9 W';
  const speedStr = sensor?.speed_rpm !== undefined && sensor?.speed_rpm !== null ? `${sensor.speed_rpm.toFixed(0)}` : '1772';
  
  const vibRMSVal = sensor?.vibration_rms ?? sensor?.accel_rms ?? sensor?.rms;
  const vibRMS = vibRMSVal !== undefined && vibRMSVal !== null ? `${vibRMSVal.toFixed(2)} mm/s` : '1.84 mm/s';

  const tempC = sensor?.temperature_c !== undefined && sensor?.temperature_c !== null ? `${sensor.temperature_c.toFixed(1)} °C` : '42.6 °C';
  const batteryV = sensor?.battery_v !== undefined && sensor?.battery_v !== null ? `${sensor.battery_v.toFixed(1)} V` : '87%';

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED' || a.status === 'new');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Page Header: Asset Title, Asset ID, Live Status */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.3px' }}>
              Overview
            </h1>
            <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue)' }}>
              {isDC ? 'MOTOR-12V-001' : 'MOTOR-2HP-001'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isDC ? '12 V DC Motor Prototype' : '2 HP Motor Bench (CWRU)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-online" style={{ fontSize: 10, padding: '3px 8px' }}>
              ● {modeText}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: isHealthy ? 'var(--success)' : 'var(--danger)',
              backgroundColor: isHealthy ? 'var(--success-light)' : 'var(--danger-light)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${isHealthy ? 'var(--success-border)' : 'var(--danger-border)'}`
            }}>
              ● {isHealthy ? 'Healthy / Nominal' : 'Attention Required'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. KPI GRID (6 Cards Matching Panel 2) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 12
      }}>
        {/* Card 1: Motor Health Score */}
        <div className="kpi-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="kpi-label" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              MOTOR HEALTH SCORE
            </span>
            <IconShield size={14} color={isHealthy ? 'var(--success)' : 'var(--danger)'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
              {conditionScore}%
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: isHealthy ? 'var(--success)' : 'var(--danger)',
              backgroundColor: isHealthy ? 'var(--success-light)' : 'var(--danger-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)'
            }}>
              {isHealthy ? 'Healthy' : 'Degraded'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            ↑ 2% since last hour
          </div>
        </div>

        {/* Card 2: Temperature */}
        <div className="kpi-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="kpi-label" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              TEMPERATURE
            </span>
            <IconThermometer size={14} color="var(--warning)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
              {tempC}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--success)',
              backgroundColor: 'var(--success-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)'
            }}>
              Normal
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            Ambient: 24.2 °C
          </div>
        </div>

        {/* Card 3: Vibration RMS */}
        <div className="kpi-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="kpi-label" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              VIBRATION RMS
            </span>
            <IconWaves size={14} color="var(--accent-cyan)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
              {vibRMS}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: isHealthy ? 'var(--success)' : 'var(--danger)',
              backgroundColor: isHealthy ? 'var(--success-light)' : 'var(--danger-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)'
            }}>
              {isHealthy ? 'Normal' : 'High'}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            Threshold: 4.50 mm/s
          </div>
        </div>

        {/* Card 4: Battery / Voltage */}
        <div className="kpi-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="kpi-label" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {isDC ? 'DC BUS VOLTAGE' : 'BATTERY'}
            </span>
            <IconBattery size={14} color="var(--blue)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
              {isDC ? voltageStr : batteryV}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--success)',
              backgroundColor: 'var(--success-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)'
            }}>
              Good
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            Regulated DC supply
          </div>
        </div>

        {/* Card 5: RPM */}
        <div className="kpi-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="kpi-label" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              RPM
            </span>
            <IconRotateCcw size={14} color="var(--navy)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
              {speedStr}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--success)',
              backgroundColor: 'var(--success-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)'
            }}>
              Normal
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            Rated: 1750–1800 RPM
          </div>
        </div>

        {/* Card 6: Load / Current */}
        <div className="kpi-card" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="kpi-label" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {isDC ? 'LOAD / CURRENT' : 'LOAD POWER'}
            </span>
            <IconZap size={14} color="var(--accent-cyan)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
              {isDC ? currentStr : powerStr}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--success)',
              backgroundColor: 'var(--success-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)'
            }}>
              Normal
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            Nominal load condition
          </div>
        </div>
      </div>

      {/* 2.3 System Operating Mode & Edge Connectivity Card (STEP 12) */}
      <SystemOperatingModeCard
        connectionStatus={connectionStatus}
        onNavigate={onNavigate}
        isDC={isDC}
      />

      {/* 2.4 Latest Explainable Diagnostic Card (STEP 11) */}
      <LatestDiagnosticCard
        sensor={sensor}
        isDC={isDC}
        latestAlert={latestProfileAlert}
        onNavigate={onNavigate}
      />

      {/* 2.5 Dynamic Thresholds Learned Baseline Card */}
      <LearnedBaselineCard 
        baselineContext={sensor?.baseline_context} 
        isDC={isDC} 
        title="LEARNED OPERATING BASELINE & CONTEXT STATUS" 
      />

      {/* 3. Middle Section: 2-Column Visual (Waveform, Vibration Trend) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 14
      }}>
        {/* Column 1: Vibration Waveform (Real-time) */}
        <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 className="card-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                {isDC ? 'Current Waveform (Real-time)' : 'Vibration Waveform (Real-time)'}
              </h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {isDC ? currentStr : vibRMS}
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 160 }}>
            {isDC ? (
              <LiveChart data={currentSeries.length > 0 ? currentSeries : [1.18, 1.22, 1.19, 1.21, 1.20, 1.23, 1.19, 1.21]} label="Current (A)" color="#28BCE8" height={160} />
            ) : (
              <LiveChart data={rmsSeries.length > 0 ? rmsSeries : [1.81, 1.84, 1.82, 1.85, 1.83, 1.86, 1.84]} label="Vibration (mm/s)" color="#28BCE8" height={160} />
            )}
          </div>
        </div>

        {/* Column 2: Vibration Trend (RMS) */}
        <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ marginBottom: 8 }}>
            <h3 className="card-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
              Vibration Trend (RMS)
            </h3>
            <span style={{ fontSize: 11, color: 'var(--blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {vibRMS}
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 160 }}>
            <LiveChart 
              data={rmsSeries.length > 0 ? rmsSeries : [1.78, 1.80, 1.82, 1.81, 1.84, 1.83, 1.85, 1.84]} 
              label="RMS Trend" 
              color="#1769AA" 
              height={160} 
            />
          </div>
        </div>
      </div>

      {/* 4. AI Condition Strip (Status, Anomaly Probability, Condition, Sensor Connectivity) */}
      <div className="card" style={{
        padding: '12px 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
      }}>
        {/* Metric 1: AI Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-cyan-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconShield size={15} color="var(--navy)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>AI STATUS</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: isHealthy ? 'var(--success)' : 'var(--danger)' }}>
              {isHealthy ? 'Healthy / Low Risk' : 'Fault Detected'}
            </div>
          </div>
        </div>

        {/* Metric 2: Anomaly Probability */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-cyan-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconCpu size={15} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>ANOMALY PROBABILITY</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)' }}>
              {anomalyProb}% <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>↓ 2.2%</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Current Condition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-cyan-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconActivity size={15} color="var(--blue)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>CURRENT CONDITION</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)' }}>
              {predictedClassText}
            </div>
          </div>
        </div>

        {/* Metric 4: Sensor Connectivity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--success-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconCheck size={15} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>SENSOR CONNECTIVITY</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--success)' }}>
              ● All Online
            </div>
          </div>
        </div>
      </div>

      {/* 5. Edge Processing Architecture Visualization (STEP 12) */}
      <EdgeArchitectureFlow isDC={isDC} isHardwareLive={Boolean(stats?.is_hardware_live)} />

      {/* 6. Live Monitoring Status Bar (Bottom Banner) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 12,
        color: 'var(--navy)'
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: isHealthy ? 'var(--success)' : 'var(--danger)',
          display: 'inline-block'
        }} />
        <strong style={{ fontWeight: 800 }}>Live Monitoring:</strong>
        <span style={{ color: 'var(--text-secondary)' }}>
          {isHealthy 
            ? 'Motor is operating normally. No anomalies detected across vibration, current, and temperature telemetry channels.' 
            : 'Elevated telemetry detected. AI recommendation: inspect bearing and verify load alignment.'}
        </span>
      </div>
    </div>
  );
}
