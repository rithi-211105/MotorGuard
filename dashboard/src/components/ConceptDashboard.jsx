import React from 'react';
/**
 * ConceptDashboard.jsx - Software Concept Demo for Bridge, Transformer, and Railway (Light Theme)
 */

export function ConceptDashboard({ infrastructure }) {
  const configs = {
    bridge: {
      title: 'Bridge Structural Health Monitoring',
      subtitle: 'Cable-Stayed Bridge Span #4',
      assetId: 'BRG-001',
      plannedSensors: [
        'Tri-Axial Modal Accelerometer (Vibration Strain & Resonance)',
        'Optical Fiber Strain Gauge (Deformation & Load Transfer)',
        'Thermal Expansion & Crack Sensor (Structural Movement)',
        'Piezoelectric Traffic Energy Harvester (Self-Powered Node)'
      ]
    },
    transformer: {
      title: 'Transformer Substation Health Monitoring',
      subtitle: 'Substation Step-Down Power Transformer',
      assetId: 'TRF-001',
      plannedSensors: [
        'Core Vibration & Acoustic Sensor (Partial Discharge)',
        'Oil Top/Bottom Winding RTD (Thermal Dissipation)',
        'Dissolved Gas Analyzer (DGA Anomaly Detection)',
        'Electromagnetic Flux Harvester (Self-Powered Substation Node)'
      ]
    },
    railway: {
      title: 'Railway Track Infrastructure Monitoring',
      subtitle: 'High-Speed Rail Track Section #12',
      assetId: 'RLW-001',
      plannedSensors: [
        'Rail Bed Dynamic Deflection Accelerometer (Axle Load Strain)',
        'Track Surface Geometry & Temperature Gauge (Thermal Buckling)',
        'Optical Rail Joint Defect Sensor (Wheel Impact Anomaly)',
        'Solar / Vibration Trackside Energy Harvester (Autonomous Node)'
      ]
    }
  };

  const config = configs[infrastructure] || configs.bridge;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 18, fontWeight: 800 }}>{config.title}</h2>
          <span className="card-subtitle">{config.subtitle} • Asset ID: {config.assetId}</span>
        </div>
        <span className="badge badge-concept" style={{ padding: '6px 12px' }}>
          SOFTWARE CONCEPT DEMO — FUTURE INTEGRATION
        </span>
      </div>

      {/* Concept Architecture & Hardware Sensor Topology */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Infrastructure Specifications</h3>
          </div>
          <div className="asset-summary-row">
            <span className="asset-summary-label">Asset Identifier</span>
            <span className="asset-summary-val">{config.assetId}</span>
          </div>
          <div className="asset-summary-row">
            <span className="asset-summary-label">Target Infrastructure</span>
            <span className="asset-summary-val">{config.title}</span>
          </div>
          <div className="asset-summary-row">
            <span className="asset-summary-label">Integration State</span>
            <span className="asset-summary-val" style={{ color: 'var(--warning)', fontWeight: 700 }}>Future Hardware Integration</span>
          </div>
          <div className="asset-summary-row">
            <span className="asset-summary-label">Execution Mode</span>
            <span className="asset-summary-val">Software Concept Demo</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Planned Hardware Sensor Nodes</h3>
          </div>
          <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {config.plannedSensors.map((sensorItem, idx) => (
              <li key={idx}>
                <strong style={{ color: 'var(--text-primary)' }}>{sensorItem.split(' (')[0]}</strong>
                {sensorItem.includes('(') ? ` (${sensorItem.split('(')[1]}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Clean Telemetry Placeholder Card */}
      <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
          REAL-TIME TELEMETRY STREAM PLACEHOLDER
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>
          Live waveform charts and AI predictive anomaly monitoring will activate when physical {config.title.toLowerCase()} IoT hardware nodes are paired.
        </div>
      </div>
    </div>
  );
}
