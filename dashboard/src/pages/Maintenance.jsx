import React, { useState, useEffect } from 'react';
/**
 * Maintenance.jsx - Predictive Maintenance & Work Order Lifecycle Management
 * Deep Navy + Cyan Technical Industrial Theme (Step 7 Visual Redesign)
 */

import { api } from '../api.js';
import { LiveChart, IconShield, IconWrench, IconClock, IconActivity, IconCheck } from '../components/Common.jsx';

export function MaintenancePage({ 
  role = 'admin', 
  alerts = [], 
  onCreateTask, 
  activeInfrastructure = 'cwru_2hp', 
  activeProfile = 'cwru_2hp',
  isDC = false 
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isDCMode = isDC || activeInfrastructure === 'dc_motor_12v' || activeProfile === 'dc_motor_12v';
  const defaultAsset = isDCMode ? 'MOTOR-12V-001' : 'MOTOR-2HP-001';
  const assetDisplayName = isDCMode ? '12 V DC Motor' : '2 HP CWRU Motor';

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newAsset, setNewAsset] = useState(defaultAsset);
  const [newPriority, setNewPriority] = useState('medium');
  const [newTech, setNewTech] = useState('Alex Vance');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    setNewAsset(defaultAsset);
  }, [defaultAsset]);

  const stages = [
    { id: 'OPEN', label: 'OPEN' },
    { id: 'ASSIGNED', label: 'ASSIGNED' },
    { id: 'IN_PROGRESS', label: 'IN PROGRESS' },
    { id: 'INSPECTION', label: 'INSPECTION' },
    { id: 'REPAIR', label: 'REPAIR' },
    { id: 'TESTING', label: 'TESTING' },
    { id: 'RESOLVED', label: 'RESOLVED' },
  ];

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getMaintenance();
      if (data && data.length > 0) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error('Failed to load maintenance tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const taskPayload = {
        asset_id: newAsset,
        title: newTitle,
        priority: newPriority,
        assigned_technician: newTech,
        due_date: newDueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        notes: newNotes,
        status: 'OPEN'
      };
      await api.createMaintenance(taskPayload);
      if (onCreateTask) {
        onCreateTask(taskPayload);
      }
      setShowCreateModal(false);
      setNewTitle('');
      setNewNotes('');
      loadTasks();
    } catch (err) {
      console.error('Create task error:', err);
    }
  };

  const handleUpdateStage = async (taskId, newStatus) => {
    try {
      await api.updateMaintenance(taskId, { status: newStatus });
      loadTasks();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Update stage error:', err);
    }
  };

  // Real KPI calculations from existing tasks and state
  const openTasks = tasks.filter(t => (t.status || '').toUpperCase() !== 'RESOLVED');
  const resolvedTasks = tasks.filter(t => (t.status || '').toUpperCase() === 'RESOLVED');
  const urgentTasks = openTasks.filter(t => {
    const p = (t.priority || '').toLowerCase();
    return p === 'urgent' || p === 'high' || p === 'critical';
  });

  const maintenanceStatusText = urgentTasks.length > 0 
    ? 'ATTENTION REQ' 
    : (openTasks.length > 0 ? 'SCHEDULED' : 'OPTIMAL');

  const maintenanceStatusColor = urgentTasks.length > 0 
    ? 'var(--danger)' 
    : (openTasks.length > 0 ? 'var(--accent-cyan)' : 'var(--success)');

  // Calculate earliest upcoming due date if available
  const upcomingDueDate = openTasks
    .map(t => t.due_date)
    .filter(Boolean)
    .sort()[0];

  const nextInspectionLabel = upcomingDueDate 
    ? upcomingDueDate 
    : '7 DAYS';

  const degradationHistory = [99, 98, 97, 96, 95, 95, 94, 93, 93, 92, 92, 92];

  // Pipeline stage tracker based on highest active task stage
  const activeTaskStageIndex = tasks.length > 0
    ? Math.max(...tasks.map(t => stages.findIndex(s => s.id === (t.status || 'OPEN').toUpperCase())))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Page Header */}
      <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              PREDICTIVE MAINTENANCE
            </h2>
            <span className="badge badge-online" style={{ fontSize: 10, padding: '3px 7px' }}>
              ● MONITORING
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            Maintenance planning based on equipment condition
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card-subtle)', padding: '5px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Active Asset:</span>
            <strong style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>{assetDisplayName}</strong>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({defaultAsset})</span>
          </div>

          <span className="badge" style={{ 
            backgroundColor: urgentTasks.length > 0 ? 'var(--danger-light)' : 'var(--success-light)',
            color: urgentTasks.length > 0 ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${urgentTasks.length > 0 ? 'var(--danger-border)' : 'var(--success-border)'}`,
            fontWeight: 700,
            fontSize: 11
          }}>
            ● {urgentTasks.length > 0 ? 'ATTENTION' : 'HEALTHY'}
          </span>

          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            + Create Work Order
          </button>
        </div>
      </div>

      {/* 2. Maintenance KPI Strip */}
      <div className="maint-kpi-grid">
        <div className="maint-kpi-card" style={{ borderLeft: `3px solid ${maintenanceStatusColor}` }}>
          <div className="maint-kpi-header">
            <span>MAINTENANCE STATUS</span>
            <IconShield size={15} color={maintenanceStatusColor} />
          </div>
          <div className="maint-kpi-value" style={{ color: maintenanceStatusColor, fontSize: 22 }}>
            {maintenanceStatusText}
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: maintenanceStatusColor }}>●</span>
            <span>{urgentTasks.length > 0 ? `${urgentTasks.length} urgent task` : 'System nominal'}</span>
          </div>
        </div>

        <div className="maint-kpi-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
          <div className="maint-kpi-header">
            <span>NEXT INSPECTION</span>
            <IconClock size={15} color="var(--accent-cyan)" />
          </div>
          <div className="maint-kpi-value" style={{ color: 'var(--accent-cyan)', fontSize: 22 }}>
            {nextInspectionLabel}
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: 'var(--accent-cyan)' }}>●</span>
            <span>Routine shaft & bearing audit</span>
          </div>
        </div>

        <div className="maint-kpi-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div className="maint-kpi-header">
            <span>OPEN TASKS</span>
            <IconWrench size={15} color="var(--warning)" />
          </div>
          <div className="maint-kpi-value" style={{ color: 'var(--text-primary)', fontSize: 22 }}>
            {openTasks.length}
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: 'var(--success)' }}>●</span>
            <span>{resolvedTasks.length} resolved</span>
          </div>
        </div>

        <div className="maint-kpi-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="maint-kpi-header">
            <span>ASSET HEALTH</span>
            <IconActivity size={15} color="var(--success)" />
          </div>
          <div className="maint-kpi-value" style={{ color: 'var(--success)', fontSize: 22 }}>
            92%
          </div>
          <div className="maint-kpi-sub">
            <span style={{ color: 'var(--success)' }}>●</span>
            <span>Integrity index</span>
          </div>
        </div>
      </div>

      {/* 3. Visual Health / Degradation & Maintenance Timeline Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 14 }}>
        {/* Visual Health & Degradation Section */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              EQUIPMENT HEALTH & DEGRADATION
            </div>
            <span className="badge badge-online" style={{ fontSize: 10 }}>PROJECTED LIFETIME</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            {/* Health Meter Widget */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 105 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                CURRENT HEALTH
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
                92%
              </div>
              <div style={{ width: 46, height: 2, background: 'var(--accent-cyan)', margin: '4px 0' }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--success)', letterSpacing: '0.5px' }}>
                HEALTHY
              </div>
            </div>

            {/* Quick condition breakdown */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mechanical Wear:</span>
                <strong style={{ color: 'var(--text-primary)' }}>Nominal (8% decay)</strong>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ width: '92%', height: '100%', background: 'var(--accent-cyan)', borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                <span>Remaining Life: &gt; 8,400 Operating Hrs</span>
                <span>Audit Interval: 90 Days</span>
              </div>
            </div>
          </div>

          {/* Degradation Trend Chart */}
          <div style={{ marginTop: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              DEGRADATION TREND (HEALTH SCORE %)
            </div>
            <LiveChart 
              data={degradationHistory} 
              label="Health Index (%)" 
              color="var(--accent-cyan)" 
              height={130} 
            />
          </div>
        </div>

        {/* Maintenance Timeline */}
        <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              MAINTENANCE TIMELINE
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-cyan)' }}>PREDICTIVE CADENCE</span>
          </div>

          <div className="maint-timeline">
            {/* Step 1: Today */}
            <div className="maint-timeline-item">
              <div className="maint-timeline-node">
                <div className="maint-timeline-dot success" />
                <div className="maint-timeline-line" />
              </div>
              <div className="maint-timeline-content">
                <div className="maint-timeline-title">
                  <span>TODAY</span>
                  <span className="badge badge-online" style={{ fontSize: 9, padding: '1px 5px' }}>ACTIVE</span>
                </div>
                <div className="maint-timeline-desc">
                  Baseline calibrated &amp; real-time sensor telemetry online.
                </div>
              </div>
            </div>

            {/* Step 2: Next Inspection */}
            <div className="maint-timeline-item">
              <div className="maint-timeline-node">
                <div className="maint-timeline-dot active" />
                <div className="maint-timeline-line" />
              </div>
              <div className="maint-timeline-content">
                <div className="maint-timeline-title">
                  <span>NEXT INSPECTION (7 DAYS)</span>
                </div>
                <div className="maint-timeline-desc">
                  Shaft alignment &amp; optical speed sensor verification.
                </div>
              </div>
            </div>

            {/* Step 3: Lubrication */}
            <div className="maint-timeline-item">
              <div className="maint-timeline-node">
                <div className="maint-timeline-dot warning" />
                <div className="maint-timeline-line" />
              </div>
              <div className="maint-timeline-content">
                <div className="maint-timeline-title">
                  <span>LUBRICATION (30 DAYS)</span>
                </div>
                <div className="maint-timeline-desc">
                  Deep groove ball bearing regreasing (Shell Gadus S2 V220).
                </div>
              </div>
            </div>

            {/* Step 4: Full Service */}
            <div className="maint-timeline-item">
              <div className="maint-timeline-node">
                <div className="maint-timeline-dot" />
              </div>
              <div className="maint-timeline-content">
                <div className="maint-timeline-title">
                  <span>FULL SERVICE (90 DAYS)</span>
                </div>
                <div className="maint-timeline-desc">
                  Electrical winding insulation testing &amp; bearing overhaul.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 7-Stage Workflow Pipeline Tracker */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
          7-STAGE MAINTENANCE WORKFLOW PIPELINE
        </div>
        <div className="pipeline-tracker" style={{ padding: '4px 0', border: 'none', boxShadow: 'none' }}>
          {stages.map((st, idx) => {
            const isCurrent = idx === (activeTaskStageIndex >= 0 ? activeTaskStageIndex : 0);
            const isCompleted = idx < (activeTaskStageIndex >= 0 ? activeTaskStageIndex : 0);

            return (
              <div key={st.id} className={`pipeline-step ${isCurrent ? 'active' : isCompleted ? 'completed' : ''}`}>
                <div className="pipeline-dot">
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className="pipeline-label">{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Work Orders & Task Area */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              ACTIVE WORK ORDERS &amp; TASKS
            </h3>
            <span className="badge" style={{ fontSize: 10, background: 'var(--bg-card-subtle)', border: '1px solid var(--border)' }}>
              {tasks.length} total
            </span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Showing real assigned maintenance operations
          </div>
        </div>

        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📋</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>NO ACTIVE WORK ORDERS</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Click "+ Create Work Order" above to schedule maintenance.</div>
          </div>
        ) : (
          <div className="maint-task-list">
            {tasks.map(task => {
              const curStatus = (task.status || 'OPEN').toUpperCase();
              const prio = (task.priority || 'medium').toLowerCase();
              const isUrgent = prio === 'urgent' || prio === 'high' || prio === 'critical';
              const isResolved = curStatus === 'RESOLVED';

              return (
                <div key={task.id} className="maint-task-row">
                  {/* Task Title & Notes Preview */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isResolved ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isResolved ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    {task.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                        {task.notes}
                      </div>
                    )}
                  </div>

                  {/* Asset ID */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {task.asset_id || defaultAsset}
                    </span>
                  </div>

                  {/* Priority Badge */}
                  <div>
                    <span className="badge" style={{ 
                      backgroundColor: isUrgent ? 'var(--danger-light)' : (prio === 'medium' ? 'var(--warning-light)' : 'var(--accent-light)'),
                      color: isUrgent ? 'var(--danger)' : (prio === 'medium' ? 'var(--warning)' : 'var(--accent-cyan)'),
                      border: `1px solid ${isUrgent ? 'var(--danger-border)' : (prio === 'medium' ? 'var(--warning-border)' : 'var(--accent-border)')}`,
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: 'uppercase'
                    }}>
                      {prio}
                    </span>
                  </div>

                  {/* Technician */}
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    👤 {task.assigned_technician || 'Alex Vance'}
                  </div>

                  {/* Due Date */}
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    📅 {task.due_date || '—'}
                  </div>

                  {/* Actions & Stage Selection */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <select 
                      value={curStatus} 
                      onChange={(e) => handleUpdateStage(task.id, e.target.value)}
                      style={{ 
                        fontSize: 11, 
                        padding: '3px 6px', 
                        fontWeight: 700, 
                        color: isResolved ? 'var(--success)' : 'var(--accent-cyan)', 
                        background: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-xs)',
                        cursor: 'pointer'
                      }}
                    >
                      {stages.map(st => (
                        <option key={st.id} value={st.id}>{st.label}</option>
                      ))}
                    </select>

                    {!isResolved && (
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => handleUpdateStage(task.id, 'RESOLVED')}
                        title="Mark Resolved"
                        style={{ padding: '3px 8px', fontSize: 10 }}
                      >
                        ✓ Resolve
                      </button>
                    )}

                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedTask(task)}
                      style={{ padding: '3px 8px', fontSize: 10 }}
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 460, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-card-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Work Order Details</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedTask(null)} style={{ padding: '2px 8px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>TITLE:</span>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, marginTop: 2 }}>{selectedTask.title}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>ASSET:</span>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{selectedTask.asset_id || defaultAsset}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>PRIORITY:</span>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{selectedTask.priority}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>TECHNICIAN:</span>
                  <div>{selectedTask.assigned_technician || 'Alex Vance'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>DUE DATE:</span>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>{selectedTask.due_date || '—'}</div>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>CURRENT STAGE:</span>
                <div style={{ marginTop: 4 }}>
                  <select 
                    value={(selectedTask.status || 'OPEN').toUpperCase()} 
                    onChange={(e) => handleUpdateStage(selectedTask.id, e.target.value)}
                    style={{ width: '100%', fontSize: 12, padding: '5px 8px', fontWeight: 700 }}
                  >
                    {stages.map(st => (
                      <option key={st.id} value={st.id}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>NOTES / RECOMMENDATIONS:</span>
                <div style={{ background: 'var(--bg-card-subtle)', padding: 10, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', marginTop: 4, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {selectedTask.notes || 'No notes provided for this work order.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                {selectedTask.status !== 'RESOLVED' && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => {
                      handleUpdateStage(selectedTask.id, 'RESOLVED');
                      setSelectedTask(null);
                    }}
                  >
                    ✓ Mark as Resolved
                  </button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedTask(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating New Work Order */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-card-hover)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>Create Maintenance Work Order</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>TITLE / TASK</label>
                <input 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  required 
                  placeholder="e.g. Inspect Motor Mounting & Lubricate Bearings" 
                  style={{ width: '100%', fontSize: 12, padding: '7px 10px' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ASSET</label>
                  <select 
                    value={newAsset} 
                    onChange={e => setNewAsset(e.target.value)} 
                    style={{ width: '100%', fontSize: 12, padding: '7px 10px' }}
                  >
                    <option value="MOTOR-12V-001">MOTOR-12V-001 (12V DC)</option>
                    <option value="MOTOR-2HP-001">MOTOR-2HP-001 (2 HP CWRU)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>PRIORITY</label>
                  <select 
                    value={newPriority} 
                    onChange={e => setNewPriority(e.target.value)} 
                    style={{ width: '100%', fontSize: 12, padding: '7px 10px' }}
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                    <option value="urgent">URGENT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>ASSIGNED TO</label>
                  <input 
                    value={newTech} 
                    onChange={e => setNewTech(e.target.value)} 
                    style={{ width: '100%', fontSize: 12, padding: '7px 10px' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>DUE DATE</label>
                  <input 
                    type="date"
                    value={newDueDate} 
                    onChange={e => setNewDueDate(e.target.value)} 
                    style={{ width: '100%', fontSize: 12, padding: '6px 10px' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>DESCRIPTION / ACTION NOTES</label>
                <textarea 
                  value={newNotes} 
                  onChange={e => setNewNotes(e.target.value)} 
                  rows={2} 
                  placeholder="Specific maintenance actions or diagnostic recommendations..."
                  style={{ width: '100%', fontSize: 12, padding: '7px 10px' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Work Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
