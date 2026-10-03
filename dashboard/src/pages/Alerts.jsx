import React, { useState, useMemo, useEffect } from 'react';
/**
 * Alerts.jsx - Equipment Incident & Event Monitoring Center
 * Deep Navy + Cyan Technical Industrial Theme (Step 8 Finalization)
 * Strict Dual-Profile Isolation: 12 V DC Motor Prototype vs 2 HP CWRU Motor Bench
 */

import { 
  formatFaultClass, 
  CLASS_HUMAN_NAMES,
  IconShield, 
  IconAlertTriangle, 
  IconCheck, 
  IconZap, 
  IconClock, 
  IconWrench,
  LearnedBaselineCard,
  generateAlertExplanation,
  EvidenceBar
} from '../components/Common.jsx';

export function AlertsPage({ 
  alerts = [], 
  sensor, 
  onAcknowledgeAlert, 
  onResolveAlert, 
  onCreateTask, 
  role = 'admin', 
  activeInfrastructure = 'motor',
  activeProfile = 'motor',
  isDC: isDCProp,
  connectionStatus
}) {
  const isDC = isDCProp !== undefined 
    ? Boolean(isDCProp) 
    : (activeInfrastructure === 'dc_motor_12v' || activeProfile === 'dc_motor_12v');

  const assetName = isDC ? '12 V DC Motor Prototype' : '2 HP Motor Bench';
  const assetId = isDC ? 'MOTOR-12V-001' : 'MOTOR-2HP-001';

  // Filters state
  const [filterSev, setFilterSev] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Work order modal state (Section 12)
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [workOrderForm, setWorkOrderForm] = useState({
    title: '',
    asset_id: '',
    priority: 'high',
    condition: '',
    recommendation: '',
    alert_id: null,
    assigned_technician: 'Alex Vance (Technician)',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  });

  // Clear selected alert on profile switch to prevent stale profile retention
  useEffect(() => {
    setSelectedAlertId(null);
  }, [isDC, activeInfrastructure, activeProfile]);

  // Strict Profile Isolation Filter
  const profileAlerts = useMemo(() => {
    return alerts.filter(a => {
      const aAsset = (a.asset_id || a.motor_id || '').toUpperCase();
      const aFault = (a.fault_class || '').toLowerCase();
      const aHuman = (a.human_readable_fault || '').toLowerCase();
      const aType = (a.type || '').toLowerCase();
      const aMsg = (a.message || '').toLowerCase();
      const aRec = (a.recommendation || '').toLowerCase();

      if (isDC) {
        // Strict DC Profile: Exclude any CWRU bearing faults and 2HP motor assets
        if (aAsset.includes('2HP') || aAsset === 'MOTOR-001' || aAsset === 'CWRU_2HP') return false;
        if (aFault.includes('ball') || aFault.includes('ir_') || aFault.includes('or_') || aFault.includes('normal_1')) return false;
        if (aHuman.includes('bearing') || aHuman.includes('inner race') || aHuman.includes('outer race') || aHuman.includes('ball defect')) return false;
        if (aMsg.includes('bearing') || aMsg.includes('inner race') || aMsg.includes('outer race')) return false;
        if (aRec.includes('bearing') || aRec.includes('spalling') || aRec.includes('raceway')) return false;
        return true;
      } else {
        // Strict 2 HP CWRU Profile: Exclude any DC motor faults and 12V motor assets
        if (aAsset.includes('12V') || aAsset.includes('DC_MOTOR')) return false;
        if (aFault.includes('loose foundation') || aFault.includes('suboptimal control') || aFault.includes('speed reg')) return false;
        if (aHuman.includes('loose foundation') || aHuman.includes('suboptimal control') || aHuman.includes('speed reg')) return false;
        if (aType.includes('dc') || aMsg.includes('dc hardware') || aMsg.includes('regulator') || aMsg.includes('current limit') || aMsg.includes('overcurrent')) return false;
        return true;
      }
    });
  }, [alerts, isDC]);

  // Real KPI Metrics derived strictly from existing profileAlerts
  const activeAlerts = useMemo(() => 
    profileAlerts.filter(a => (a.status || 'ACTIVE').toUpperCase() !== 'RESOLVED'),
    [profileAlerts]
  );
  
  const criticalCount = useMemo(() => 
    profileAlerts.filter(a => 
      (a.severity || '').toUpperCase() === 'CRITICAL' && 
      (a.status || 'ACTIVE').toUpperCase() !== 'RESOLVED'
    ).length,
    [profileAlerts]
  );

  const warningCount = useMemo(() => 
    profileAlerts.filter(a => 
      (a.severity || '').toUpperCase() === 'WARNING' && 
      (a.status || 'ACTIVE').toUpperCase() !== 'RESOLVED'
    ).length,
    [profileAlerts]
  );

  const totalEvents = profileAlerts.length;

  // Distribution totals for progress bars
  const criticalTotal = useMemo(() => profileAlerts.filter(a => (a.severity || '').toUpperCase() === 'CRITICAL').length, [profileAlerts]);
  const warningTotal = useMemo(() => profileAlerts.filter(a => (a.severity || '').toUpperCase() === 'WARNING').length, [profileAlerts]);
  const infoTotal = useMemo(() => profileAlerts.filter(a => ['INFO', 'NORMAL'].includes((a.severity || '').toUpperCase())).length, [profileAlerts]);
  const resolvedCount = useMemo(() => profileAlerts.filter(a => (a.status || '').toUpperCase() === 'RESOLVED').length, [profileAlerts]);

  // Filtered Alert List for Timeline Stream
  const filteredAlerts = useMemo(() => {
    return profileAlerts.filter(a => {
      const sev = (a.severity || 'WARNING').toUpperCase();
      const st = (a.status || 'ACTIVE').toUpperCase();

      if (filterSev !== 'all' && sev !== filterSev.toUpperCase()) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'ACTIVE' && st === 'RESOLVED') return false;
        if (filterStatus === 'ACKNOWLEDGED' && st !== 'ACKNOWLEDGED') return false;
        if (filterStatus === 'RESOLVED' && st !== 'RESOLVED') return false;
      }
      return true;
    });
  }, [profileAlerts, filterSev, filterStatus]);

  // Currently Selected Alert in Detail Panel
  const selectedAlert = useMemo(() => {
    if (selectedAlertId) {
      const found = filteredAlerts.find(a => a.id === selectedAlertId);
      if (found) return found;
    }
    return filteredAlerts.length > 0 ? filteredAlerts[0] : null;
  }, [selectedAlertId, filteredAlerts]);

  // Context-Aware Alert Baseline Extraction
  const alertBaselineCtx = useMemo(() => {
    if (!selectedAlert) return null;
    const expectedProfile = isDC ? 'dc_motor_12v' : 'cwru_2hp';
    if (selectedAlert.baseline_context && selectedAlert.baseline_context.profile === expectedProfile) {
      return selectedAlert.baseline_context;
    }
    if (selectedAlert.details) {
      try {
        const parsed = typeof selectedAlert.details === 'string' ? JSON.parse(selectedAlert.details) : selectedAlert.details;
        if (parsed?.baseline_context && parsed.baseline_context.profile === expectedProfile) {
          return parsed.baseline_context;
        }
      } catch (e) {}
    }
    if (sensor?.baseline_context && sensor.baseline_context.profile === expectedProfile) {
      return sensor.baseline_context;
    }
    return null;
  }, [selectedAlert, sensor, isDC]);

  // Deterministic Explainable Alert Analysis (STEP 11)
  const selectedExplanation = useMemo(() => {
    if (!selectedAlert) return null;
    return generateAlertExplanation(selectedAlert, alertBaselineCtx, sensor, isDC);
  }, [selectedAlert, alertBaselineCtx, sensor, isDC]);

  // Open pre-populated editable work order modal (Section 12)
  const openWorkOrderModal = (alertItem) => {
    if (!alertItem) return;
    const exp = generateAlertExplanation(alertItem, alertItem.baseline_context || alertBaselineCtx, sensor, isDC);
    const sev = (alertItem.severity || 'WARNING').toUpperCase();
    const priority = sev === 'CRITICAL' ? 'urgent' : (sev === 'WARNING' ? 'high' : 'medium');
    setWorkOrderForm({
      title: `Inspect ${sev}: ${exp.whatHappened}`,
      asset_id: alertItem.asset_id || alertItem.motor_id || assetId,
      priority,
      condition: exp.whatHappened,
      recommendation: exp.recommendation,
      alert_id: alertItem.id,
      assigned_technician: 'Alex Vance (Technician)',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
    });
    setShowWorkOrderModal(true);
  };

  const handleWorkOrderSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (connectionStatus?.backend === 'offline') {
      setActionNotice('Backend unavailable — action not sent.');
      setTimeout(() => setActionNotice(null), 4000);
      setShowWorkOrderModal(false);
      return;
    }
    if (onCreateTask) {
      await onCreateTask({
        asset_id: workOrderForm.asset_id,
        alert_id: workOrderForm.alert_id,
        title: workOrderForm.title,
        priority: workOrderForm.priority,
        assigned_technician: workOrderForm.assigned_technician,
        due_date: workOrderForm.due_date,
        notes: `${workOrderForm.condition} - ${workOrderForm.recommendation}`
      });
      setActionNotice(`Work Order created for ${workOrderForm.title}!`);
      setTimeout(() => setActionNotice(null), 3500);
    }
    setShowWorkOrderModal(false);
  };

  const handleSafeAcknowledge = (id) => {
    if (connectionStatus?.backend === 'offline') {
      setActionNotice('Backend unavailable — action not sent.');
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }
    onAcknowledgeAlert && onAcknowledgeAlert(id);
  };

  const handleSafeResolve = (id) => {
    if (connectionStatus?.backend === 'offline') {
      setActionNotice('Backend unavailable — action not sent.');
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }
    onResolveAlert && onResolveAlert(id);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  const isPaused = connectionStatus?.telemetryFreshness === 'STALE' || connectionStatus?.mode === 'offline';
  const evalAge = connectionStatus?.telemetryAgeSec ? Math.round(connectionStatus.telemetryAgeSec) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 1. Page Header */}
      <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ 
              fontSize: 22, 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.3px', 
              margin: 0 
            }}>
              ALERTS &amp; EVENTS
            </h2>
            {isPaused ? (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
                ⚠ ALERT ENGINE: MONITORING PAUSED (No fresh telemetry • Last eval: {evalAge}s ago)
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                ● ALERT ENGINE: ACTIVE
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Real-time equipment events and explainable condition warnings
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ 
            background: 'var(--bg-card-subtle)', 
            padding: '5px 10px', 
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Active Asset:</span>
            <strong style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>{assetName}</strong>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({assetId})</span>
          </div>

          <span className="badge" style={{ 
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 8px',
            backgroundColor: activeAlerts.length > 0 ? 'var(--warning-light)' : 'var(--success-light)',
            color: activeAlerts.length > 0 ? 'var(--warning)' : 'var(--success)',
            border: `1px solid ${activeAlerts.length > 0 ? 'var(--warning-border)' : 'var(--success-border)'}`
          }}>
            ● {activeAlerts.length > 0 ? `${activeAlerts.length} ACTIVE INCIDENTS` : 'ALL CLEAR'}
          </span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div style={{ 
          padding: '9px 14px', 
          background: 'var(--accent-light)', 
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-cyan)',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <IconCheck size={16} color="var(--accent-cyan)" />
          {actionNotice}
        </div>
      )}

      {/* 2. Top Alert Summary (KPI Strip) - Requirement 5 */}
      <div className="maint-kpi-grid">
        {/* TOTAL EVENTS */}
        <div className="maint-kpi-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
          <div className="maint-kpi-header">
            <span>TOTAL EVENTS</span>
            <IconShield size={15} color="var(--accent-cyan)" />
          </div>
          <div className="maint-kpi-value" style={{ color: 'var(--accent-cyan)', fontSize: 24 }}>
            {totalEvents}
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: 'var(--accent-cyan)' }}>●</span>
            <span>Recorded for {assetId}</span>
          </div>
        </div>

        {/* ACTIVE ALERTS */}
        <div className="maint-kpi-card" style={{ borderLeft: `3px solid ${activeAlerts.length > 0 ? 'var(--warning)' : 'var(--success)'}` }}>
          <div className="maint-kpi-header">
            <span>ACTIVE ALERTS</span>
            <IconAlertTriangle size={15} color={activeAlerts.length > 0 ? 'var(--warning)' : 'var(--success)'} />
          </div>
          <div className="maint-kpi-value" style={{ color: activeAlerts.length > 0 ? 'var(--warning)' : 'var(--success)', fontSize: 24 }}>
            {activeAlerts.length}
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: activeAlerts.length > 0 ? 'var(--warning)' : 'var(--success)' }}>●</span>
            <span>{activeAlerts.length > 0 ? 'Unresolved incidents' : 'System nominal'}</span>
          </div>
        </div>

        {/* CRITICAL */}
        <div className="maint-kpi-card" style={{ borderLeft: `3px solid ${criticalCount > 0 ? 'var(--danger)' : 'var(--border)'}` }}>
          <div className="maint-kpi-header">
            <span>CRITICAL</span>
            <IconAlertTriangle size={15} color={criticalCount > 0 ? 'var(--danger)' : 'var(--text-secondary)'} />
          </div>
          <div className="maint-kpi-value" style={{ color: criticalCount > 0 ? 'var(--danger)' : 'var(--text-primary)', fontSize: 24 }}>
            {criticalCount}
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: criticalCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>●</span>
            <span>{criticalCount > 0 ? 'Immediate action required' : 'No critical faults'}</span>
          </div>
        </div>

        {/* WARNINGS */}
        <div className="maint-kpi-card" style={{ borderLeft: `3px solid ${warningCount > 0 ? 'var(--warning)' : 'var(--border)'}` }}>
          <div className="maint-kpi-header">
            <span>WARNINGS</span>
            <IconAlertTriangle size={15} color={warningCount > 0 ? 'var(--warning)' : 'var(--text-secondary)'} />
          </div>
          <div className="maint-kpi-value" style={{ color: warningCount > 0 ? 'var(--warning)' : 'var(--text-primary)', fontSize: 24 }}>
            {warningCount}
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: warningCount > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>●</span>
            <span>{warningCount > 0 ? 'Elevated threshold warnings' : 'No active warnings'}</span>
          </div>
        </div>
      </div>

      {/* 3. Alert Severity Distribution Strip */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
            SEVERITY DISTRIBUTION
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            PROPORTIONAL EVENT COUNT
          </span>
        </div>

        {totalEvents === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>
            <IconCheck size={14} color="var(--success)" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            NO EVENTS RECORDED FOR THIS ASSET
          </div>
        ) : (
          <div className="alert-severity-summary">
            {/* Critical Row */}
            <div className="alert-severity-row">
              <span className="alert-severity-label" style={{ color: 'var(--danger)' }}>CRITICAL</span>
              <div className="alert-severity-track">
                <div 
                  className="alert-severity-fill" 
                  style={{ 
                    width: `${Math.round((criticalTotal / totalEvents) * 100)}%`, 
                    background: 'var(--danger)' 
                  }} 
                />
              </div>
              <span className="alert-severity-count" style={{ color: 'var(--danger)' }}>
                {criticalTotal}
              </span>
            </div>

            {/* Warning Row */}
            <div className="alert-severity-row">
              <span className="alert-severity-label" style={{ color: 'var(--warning)' }}>WARNING</span>
              <div className="alert-severity-track">
                <div 
                  className="alert-severity-fill" 
                  style={{ 
                    width: `${Math.round((warningTotal / totalEvents) * 100)}%`, 
                    background: 'var(--warning)' 
                  }} 
                />
              </div>
              <span className="alert-severity-count" style={{ color: 'var(--warning)' }}>
                {warningTotal}
              </span>
            </div>

            {/* Info Row */}
            <div className="alert-severity-row">
              <span className="alert-severity-label" style={{ color: 'var(--accent-cyan)' }}>INFO</span>
              <div className="alert-severity-track">
                <div 
                  className="alert-severity-fill" 
                  style={{ 
                    width: `${Math.round((infoTotal / totalEvents) * 100)}%`, 
                    background: 'var(--accent-cyan)' 
                  }} 
                />
              </div>
              <span className="alert-severity-count" style={{ color: 'var(--accent-cyan)' }}>
                {infoTotal}
              </span>
            </div>

            {/* Resolved Row */}
            <div className="alert-severity-row">
              <span className="alert-severity-label" style={{ color: 'var(--success)' }}>RESOLVED</span>
              <div className="alert-severity-track">
                <div 
                  className="alert-severity-fill" 
                  style={{ 
                    width: `${Math.round((resolvedCount / totalEvents) * 100)}%`, 
                    background: 'var(--success)' 
                  }} 
                />
              </div>
              <span className="alert-severity-count" style={{ color: 'var(--success)' }}>
                {resolvedCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3.5 Dynamic Learned Baseline Reference Card */}
      <LearnedBaselineCard 
        baselineContext={sensor?.baseline_context} 
        isDC={isDC} 
        compact={false}
        title="CURRENT MOTOR DYNAMIC BASELINE & DEVIATION THRESHOLDS" 
      />

      {/* 4. Two-Column Workspace: Live Event Stream (Left) & Selected Alert Details (Right) */}
      <div className="alerts-layout-grid">
        
        {/* Left Column: Live Event Stream / Timeline */}
        <div className="card" style={{ padding: '16px 18px' }}>
          
          {/* Header & Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                LIVE EVENT STREAM
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                Chronological timeline of equipment events
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select 
                value={filterSev} 
                onChange={e => setFilterSev(e.target.value)}
                style={{ 
                  padding: '4px 6px', 
                  fontSize: 11, 
                  fontWeight: 700,
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-xs)'
                }}
              >
                <option value="all">ALL SEVERITY</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="WARNING">WARNING</option>
                <option value="NORMAL">INFO / NORMAL</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{ 
                  padding: '4px 6px', 
                  fontSize: 11, 
                  fontWeight: 700,
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-xs)'
                }}
              >
                <option value="all">ALL STATUS</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          </div>

          {/* Timeline List / Empty State */}
          {filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px auto' }}>
                <IconCheck size={18} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                SYSTEM NOMINAL
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                No active events matching current filter criteria.
              </div>
            </div>
          ) : (
            <div className="alert-timeline-list">
              {filteredAlerts.map(alert => {
                const sev = (alert.severity || 'WARNING').toUpperCase();
                const statusStr = (alert.status || 'ACTIVE').toUpperCase();
                const isCrit = sev === 'CRITICAL';
                const isWarn = sev === 'WARNING';
                const isResolved = statusStr === 'RESOLVED';
                const isSelected = selectedAlert && selectedAlert.id === alert.id;

                const displayAsset = alert.asset_id || alert.motor_id || assetId;
                const faultTitle = alert.human_readable_fault || (isDC ? alert.fault_class : formatFaultClass(alert.fault_class)) || 'Operating Anomaly';
                const shortDesc = alert.message || alert.recommendation || `Condition anomaly detected in ${displayAsset}`;

                let cardSevClass = 'normal';
                if (isResolved) cardSevClass = 'resolved';
                else if (isCrit) cardSevClass = 'critical';
                else if (isWarn) cardSevClass = 'warning';

                return (
                  <div 
                    key={alert.id}
                    className={`alert-timeline-card ${cardSevClass} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedAlertId(alert.id)}
                  >
                    <div className="alert-timeline-left">
                      {/* Status indicator dot */}
                      <span style={{ 
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isResolved ? 'var(--success)' : (isCrit ? 'var(--danger)' : (isWarn ? 'var(--warning)' : 'var(--accent-cyan)')),
                        marginTop: 4,
                        flexShrink: 0
                      }} />

                      <div className="alert-timeline-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className="alert-timeline-title">
                            {faultTitle}
                          </span>
                          <span className="badge" style={{ 
                            fontSize: 9,
                            padding: '1px 5px',
                            backgroundColor: isCrit ? 'var(--danger-light)' : (isWarn ? 'var(--warning-light)' : 'var(--accent-light)'),
                            color: isCrit ? 'var(--danger)' : (isWarn ? 'var(--warning)' : 'var(--accent-cyan)'),
                            border: `1px solid ${isCrit ? 'var(--danger-border)' : (isWarn ? 'var(--warning-border)' : 'var(--accent-border)')}`
                          }}>
                            {sev}
                          </span>
                        </div>

                        {/* Quick technical metrics (Section 13) */}
                        {(() => {
                          const itemExp = generateAlertExplanation(alert, alert.baseline_context, sensor, isDC);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, marginTop: 2 }}>
                              <span style={{
                                fontWeight: 800,
                                color: isCrit ? '#DC2626' : (isWarn ? '#D97706' : '#16A34A'),
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {itemExp.baselineDeviationPct >= 0 ? `+${itemExp.baselineDeviationPct}%` : `${itemExp.baselineDeviationPct}%`} baseline deviation
                              </span>
                              <span style={{ color: '#94A3B8' }}>•</span>
                              <span style={{ color: '#64748B', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                {itemExp.confidencePct}% AI confidence
                              </span>
                            </div>
                          );
                        })()}

                        <div className="alert-timeline-meta" style={{ marginTop: 3 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {displayAsset}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <IconClock size={10} color="var(--text-secondary)" />
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          <span>•</span>
                          <span style={{ 
                            fontWeight: 700,
                            color: isResolved ? 'var(--success)' : (statusStr === 'ACKNOWLEDGED' ? 'var(--accent-cyan)' : 'var(--warning)')
                          }}>
                            {statusStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Inline Actions */}
                    <div className="alert-timeline-actions" onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {statusStr === 'ACTIVE' && (
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ fontSize: 10, padding: '2px 7px' }}
                            onClick={() => onAcknowledgeAlert && onAcknowledgeAlert(alert.id)}
                            title="Acknowledge alert"
                          >
                            Ack
                          </button>
                        )}
                        {statusStr !== 'RESOLVED' && (
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ fontSize: 10, padding: '2px 7px' }}
                            onClick={() => onResolveAlert && onResolveAlert(alert.id)}
                            title="Mark as resolved"
                          >
                            Resolve
                          </button>
                        )}
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => openWorkOrderModal(alert)}
                          title="Generate maintenance task"
                        >
                          Work Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Event Details & Directives (STEP 11 Explainable Alerts) */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div className="card-header" style={{ marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                ALERT DIAGNOSIS
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                Deterministic telemetry evidence &amp; maintenance directives
              </div>
            </div>
            <IconZap size={16} color="var(--accent-cyan)" />
          </div>

          {!selectedAlert ? (
            <div style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--text-secondary)', fontSize: 11 }}>
              Select an incident from the timeline stream to inspect structured telemetry evidence and dispatch maintenance.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* 1. Classification & Severity Banner */}
              <div style={{ 
                padding: '10px 12px', 
                background: 'var(--bg-card-subtle)', 
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: isPaused ? '#D97706' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isPaused ? '⚠ LAST KNOWN DIAGNOSIS (WAITING FOR FRESH DATA)' : 'LIVE DIAGNOSIS CLASSIFICATION'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                    {selectedExplanation?.whatHappened || selectedAlert.human_readable_fault || (isDC ? selectedAlert.fault_class : formatFaultClass(selectedAlert.fault_class)) || 'Operating Anomaly'}
                  </div>
                </div>

                <span className="badge" style={{ 
                  fontSize: 10,
                  fontWeight: 800,
                  backgroundColor: selectedAlert.severity === 'CRITICAL' ? 'var(--danger-light)' : (selectedAlert.severity === 'WARNING' ? 'var(--warning-light)' : 'var(--accent-light)'),
                  color: selectedAlert.severity === 'CRITICAL' ? 'var(--danger)' : (selectedAlert.severity === 'WARNING' ? 'var(--warning)' : 'var(--accent-cyan)'),
                  border: `1px solid ${selectedAlert.severity === 'CRITICAL' ? 'var(--danger-border)' : (selectedAlert.severity === 'WARNING' ? 'var(--warning-border)' : 'var(--accent-border)')}`
                }}>
                  ● {selectedAlert.severity || 'WARNING'}
                </span>
              </div>

              {/* 2. Distinction Strip: Confidence != Baseline Deviation != Severity (Section 10) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                padding: '10px 12px',
                background: '#FFFFFF',
                border: '1px solid #E1EBF5',
                borderRadius: 6
              }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid #E1EBF5', paddingRight: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                    AI CONFIDENCE
                  </span>
                  <strong style={{ fontSize: 15, fontWeight: 800, color: '#0B3B6E', fontFamily: 'var(--font-mono)' }}>
                    {selectedExplanation?.confidencePct ?? 87}%
                  </strong>
                  <span style={{ fontSize: 8, color: '#94A3B8', display: 'block' }}>Model certainty</span>
                </div>

                <div style={{ textAlign: 'center', borderRight: '1px solid #E1EBF5', paddingRight: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                    DEVIATION
                  </span>
                  <strong style={{ 
                    fontSize: 15, 
                    fontWeight: 800, 
                    color: Math.abs(selectedExplanation?.baselineDeviationPct || 0) > 20 ? '#DC2626' : '#D97706',
                    fontFamily: 'var(--font-mono)' 
                  }}>
                    {(selectedExplanation?.baselineDeviationPct ?? 0) >= 0 ? `+${selectedExplanation?.baselineDeviationPct ?? 0}%` : `${selectedExplanation?.baselineDeviationPct}%`}
                  </strong>
                  <span style={{ fontSize: 8, color: '#94A3B8', display: 'block' }}>vs learned mean</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                    SEVERITY
                  </span>
                  <strong style={{ 
                    fontSize: 15, 
                    fontWeight: 800, 
                    color: selectedAlert.severity === 'CRITICAL' ? '#DC2626' : (selectedAlert.severity === 'WARNING' ? '#D97706' : '#16A34A')
                  }}>
                    {selectedAlert.severity || 'WARNING'}
                  </strong>
                  <span style={{ fontSize: 8, color: '#94A3B8', display: 'block' }}>Operating impact</span>
                </div>
              </div>

              {/* 3. Why This Alert Triggered (Section 2 & 4) */}
              <div style={{ 
                padding: '10px 12px', 
                background: '#EAF4FB', 
                border: '1px solid #C8D9E8', 
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IconZap size={13} color="#159ED1" />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#0B3B6E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    WHY THIS ALERT TRIGGERED
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#123B68', lineHeight: 1.45, fontWeight: 500 }}>
                  {selectedExplanation?.whyItHappened || 'Current and vibration measurements exceeded the learned normal operating envelope.'}
                </div>
              </div>

              {/* 4. Structured Supporting Evidence (Section 3, 5, 6, 8) */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#0B3B6E', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  SUPPORTING TELEMETRY EVIDENCE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedExplanation?.evidence && selectedExplanation.evidence.length > 0 ? (
                    selectedExplanation.evidence.map((item, idx) => (
                      <EvidenceBar 
                        key={idx}
                        metric={item.metric}
                        shortMetric={item.shortMetric}
                        value={item.value}
                        baseline={item.baseline}
                        deviationPct={item.deviationPct}
                        status={item.status}
                        unit={item.unit}
                      />
                    ))
                  ) : (
                    <div style={{ fontSize: 11, color: '#64748B', padding: 8, background: '#F8FAFC', borderRadius: 6 }}>
                      No structured evidence points recorded.
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Operating Context Grid (Section 7) */}
              <div style={{
                padding: '10px 12px',
                background: '#FFFFFF',
                border: '1px solid #E1EBF5',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  OPERATING CONTEXT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 11 }}>
                  {isDC ? (
                    <>
                      <div style={{ background: '#F4F8FC', padding: '5px 8px', borderRadius: 4 }}>
                        <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>PWM COMMAND</span>
                        <strong style={{ color: '#0B3B6E', fontFamily: 'var(--font-mono)' }}>
                          {selectedExplanation?.operatingContext?.pwm ?? 145} / 255
                        </strong>
                      </div>
                      <div style={{ background: '#F4F8FC', padding: '5px 8px', borderRadius: 4 }}>
                        <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>SHAFT SPEED</span>
                        <strong style={{ color: '#0B3B6E', fontFamily: 'var(--font-mono)' }}>
                          {selectedExplanation?.operatingContext?.rpm ?? 1150} RPM
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ background: '#F4F8FC', padding: '5px 8px', borderRadius: 4 }}>
                        <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>MOTOR LOAD</span>
                        <strong style={{ color: '#0B3B6E' }}>
                          {selectedExplanation?.operatingContext?.load ?? '1 HP Nominal'}
                        </strong>
                      </div>
                      <div style={{ background: '#F4F8FC', padding: '5px 8px', borderRadius: 4 }}>
                        <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>OPERATING SPEED</span>
                        <strong style={{ color: '#0B3B6E', fontFamily: 'var(--font-mono)' }}>
                          {selectedExplanation?.operatingContext?.rpm ?? 1797} RPM
                        </strong>
                      </div>
                    </>
                  )}
                  <div style={{ background: '#F4F8FC', padding: '5px 8px', borderRadius: 4 }}>
                    <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>PROFILE</span>
                    <strong style={{ color: '#0B3B6E' }}>
                      {selectedExplanation?.operatingContext?.profile || (isDC ? '12 V DC Motor' : '2 HP CWRU Motor')}
                    </strong>
                  </div>
                  <div style={{ background: '#F4F8FC', padding: '5px 8px', borderRadius: 4 }}>
                    <span style={{ fontSize: 9, color: '#64748B', display: 'block' }}>BASELINE STATUS</span>
                    <strong style={{ color: selectedExplanation?.operatingContext?.baselineStatus?.includes('ABOVE') ? '#D97706' : '#16A34A' }}>
                      {selectedExplanation?.operatingContext?.baselineStatus || 'LEARNED'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 6. Actionable Maintenance Recommendation (Section 11) */}
              <div style={{ 
                padding: '10px 12px', 
                background: '#F0FDF4', 
                border: '1px solid #BBF7D0', 
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconWrench size={13} color="#16A34A" />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    RECOMMENDED ACTION
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#14532D', lineHeight: 1.45, fontWeight: 500 }}>
                  {selectedExplanation?.recommendation || (isDC 
                    ? 'Inspect motor foundation mounting, check shaft alignment, and verify regulator gain parameters.' 
                    : 'Inspect bearing raceway and rolling elements for mechanical spalling. Schedule vibration re-test.')}
                </div>
              </div>

              {/* 7. Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', fontSize: 11, fontWeight: 700 }}
                  onClick={() => openWorkOrderModal(selectedAlert)}
                >
                  <IconWrench size={13} />
                  CREATE MAINTENANCE WORK ORDER
                </button>

                <div style={{ display: 'flex', gap: 6 }}>
                  {selectedAlert.status === 'ACTIVE' && (
                    <button 
                      className="btn btn-outline" 
                      style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
                      onClick={() => handleSafeAcknowledge(selectedAlert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                  {selectedAlert.status !== 'RESOLVED' && (
                    <button 
                      className="btn btn-outline" 
                      style={{ flex: 1, padding: '7px 10px', fontSize: 11, color: 'var(--success)', borderColor: 'var(--success-border)' }}
                      onClick={() => handleSafeResolve(selectedAlert.id)}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* WORK ORDER CREATION MODAL (Section 12: Prepopulated & Fully Editable) */}
      {showWorkOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 59, 110, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 8,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 12px 36px rgba(11, 59, 110, 0.25)',
            border: '1px solid #C8D9E8',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              background: '#0B3B6E',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.02em' }}>
                  DISPATCH MAINTENANCE WORK ORDER
                </div>
                <div style={{ fontSize: 10, color: '#93C5FD', marginTop: 1 }}>
                  Pre-populated from explainable telemetry evidence • Editable
                </div>
              </div>
              <button 
                onClick={() => setShowWorkOrderModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleWorkOrderSubmit} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  WORK ORDER TITLE
                </label>
                <input 
                  type="text"
                  value={workOrderForm.title}
                  onChange={e => setWorkOrderForm({ ...workOrderForm, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid #CBD5E1',
                    color: '#0B3B6E',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    TARGET ASSET
                  </label>
                  <input 
                    type="text"
                    value={workOrderForm.asset_id}
                    onChange={e => setWorkOrderForm({ ...workOrderForm, asset_id: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid #CBD5E1',
                      color: '#0B3B6E',
                      fontWeight: 600
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    PRIORITY
                  </label>
                  <select 
                    value={workOrderForm.priority}
                    onChange={e => setWorkOrderForm({ ...workOrderForm, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid #CBD5E1',
                      color: '#0B3B6E',
                      fontWeight: 700,
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  CONDITION DETECTED
                </label>
                <input 
                  type="text"
                  value={workOrderForm.condition}
                  onChange={e => setWorkOrderForm({ ...workOrderForm, condition: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid #CBD5E1',
                    color: '#0B3B6E'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                  RECOMMENDED ACTION / WORK DIRECTIVE
                </label>
                <textarea 
                  rows={3}
                  value={workOrderForm.recommendation}
                  onChange={e => setWorkOrderForm({ ...workOrderForm, recommendation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid #CBD5E1',
                    color: '#0B3B6E',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    ASSIGNED TECHNICIAN
                  </label>
                  <input 
                    type="text"
                    value={workOrderForm.assigned_technician}
                    onChange={e => setWorkOrderForm({ ...workOrderForm, assigned_technician: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid #CBD5E1',
                      color: '#0B3B6E'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                    TARGET COMPLETION DATE
                  </label>
                  <input 
                    type="date"
                    value={workOrderForm.due_date}
                    onChange={e => setWorkOrderForm({ ...workOrderForm, due_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid #CBD5E1',
                      color: '#0B3B6E'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 10, borderTop: '1px solid #E1EBF5' }}>
                <button 
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '7px 14px', fontSize: 11 }}
                  onClick={() => setShowWorkOrderModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '7px 16px', fontSize: 11, fontWeight: 700 }}
                >
                  Confirm &amp; Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
