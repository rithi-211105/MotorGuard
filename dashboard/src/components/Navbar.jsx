import React, { useState } from 'react';
/**
 * Navbar.jsx - MotorGuard AI Technical Topbar Header
 * Conforms to MotorGuard AI Reference Guide (Panels 2–8).
 * Light Industrial Theme (White background, thin #C8D9E8 border, Navy & Cyan accents).
 * NO theme toggle button or dark mode logic.
 */

import { CLASS_HUMAN_NAMES, IconSearch, IconBell, IconMotor } from './Common.jsx';

export function Navbar({ 
  activeInfrastructure = 'motor', 
  onSelectInfrastructure, 
  isHardwareLive = false, 
  condition = 'Normal_1', 
  onConditionChange, 
  wsConnected = false,
  wsStatus = 'CONNECTED',
  speedMultiplier = 1.0,
  onSpeedChange,
  openAlertsCount = 0,
  role = 'admin',
  connectionStatus
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusPopover, setShowStatusPopover] = useState(false);

  const infraOptions = [
    { id: 'dc_motor_12v', label: 'Motor (12V DC - ESP32)' },
    { id: 'cwru_2hp', label: 'Motor (2 HP Bench - CWRU)' },
  ];

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

  const speedOptions = [0.5, 1.0, 2.0, 5.0, 10.0];
  const isDC = (activeInfrastructure === 'dc_motor_12v');

  // Connection & Edge-First Status Calculation (STEP 12)
  const mode = connectionStatus?.mode || (wsConnected ? 'online' : 'offline');
  const telemetryFreshness = connectionStatus?.telemetryFreshness || (wsConnected ? 'LIVE' : 'OFFLINE');
  const internetOnline = connectionStatus?.internet === 'online';
  const backendOnline = connectionStatus?.backend === 'online';

  let statusBadge = { text: '● SYSTEM ONLINE', bg: '#DCFCE7', color: '#16A34A', border: '#BBF7D0' };
  if (!backendOnline) {
    statusBadge = { text: '○ BACKEND OFFLINE', bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' };
  } else if (!internetOnline) {
    statusBadge = { text: '● LOCAL EDGE MODE', bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' };
  } else if (telemetryFreshness === 'STALE' || wsStatus === 'RECONNECTING') {
    statusBadge = { text: '⚠ DEGRADED', bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' };
  }

  return (
    <header className="topbar" style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--border)',
      height: 'var(--topbar-height)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Left: Branding & Active Asset Quick Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {/* Active Asset Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-cyan-light)',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconMotor size={16} color="var(--navy)" />
          </div>

          <select 
            value={activeInfrastructure === 'motor' ? 'cwru_2hp' : activeInfrastructure}
            onChange={(e) => onSelectInfrastructure && onSelectInfrastructure(e.target.value)}
            style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid var(--border)', 
              color: 'var(--navy)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {infraOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          {/* System Connectivity & Edge-First Status Badge (STEP 12) */}
          <div style={{ position: 'relative' }}>
            <span 
              onClick={() => setShowStatusPopover(prev => !prev)}
              title="Click to view local edge connectivity diagnostics"
              style={{ 
                backgroundColor: statusBadge.bg, 
                border: `1px solid ${statusBadge.border}`, 
                color: statusBadge.color,
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                userSelect: 'none'
              }}
            >
              {statusBadge.text}
              <span style={{ fontSize: 8, opacity: 0.8 }}>▼</span>
            </span>

            {/* Edge Connectivity Diagnostics Popover */}
            {showStatusPopover && (
              <div 
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '120%',
                  left: 0,
                  width: 260,
                  background: '#FFFFFF',
                  border: '1px solid #C8D9E8',
                  borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(11, 59, 110, 0.15)',
                  padding: '10px 12px',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#0B3B6E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    EDGE CONNECTIVITY DIAGNOSTICS
                  </span>
                  <span 
                    onClick={() => setShowStatusPopover(false)}
                    style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#64748B', lineHeight: 1 }}
                  >
                    ×
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>ESP32 Node:</span>
                    <strong style={{ color: isHardwareLive ? '#16A34A' : '#0B3B6E' }}>
                      {isHardwareLive ? '● ONLINE (LIVE)' : '● 20 Hz STREAM'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>WebSocket:</span>
                    <strong style={{ color: wsConnected ? '#16A34A' : '#DC2626' }}>
                      {wsConnected ? '● CONNECTED' : '○ DISCONNECTED'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>FastAPI Backend:</span>
                    <strong style={{ color: backendOnline ? '#16A34A' : '#DC2626' }}>
                      {backendOnline ? '● LOCAL HOST (8000)' : '○ UNREACHABLE'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Internet Link:</span>
                    <strong style={{ color: internetOnline ? '#16A34A' : '#0284C7' }}>
                      {internetOnline ? '● ONLINE' : '○ NOT REQUIRED'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>AI Engine:</span>
                    <strong style={{ color: '#0B3B6E' }}>
                      ● LOCAL RUNTIME
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Telemetry Freshness:</span>
                    <strong style={{ color: telemetryFreshness === 'LIVE' ? '#16A34A' : (telemetryFreshness === 'RECENT' ? '#D97706' : '#DC2626') }}>
                      {telemetryFreshness} ({connectionStatus?.telemetryAgeSec ? `${connectionStatus.telemetryAgeSec.toFixed(1)}s` : '0.4s'})
                    </strong>
                  </div>
                </div>

                <div style={{ 
                  fontSize: 8.5, 
                  color: '#0369A1', 
                  background: '#F0F9FF', 
                  padding: '4px 6px', 
                  borderRadius: 4, 
                  border: '1px solid #BAE6FD',
                  lineHeight: 1.3
                }}>
                  MotorGuard operates locally. Cloud connectivity is not required for real-time monitoring.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Search, Simulation Controls, Notifications, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Search Box */}
        <div className="topbar-search" style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          width: 180
        }}>
          <IconSearch size={13} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 12,
              color: 'var(--navy)',
              width: '100%',
              background: 'transparent',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Simulation Condition Selector (if in simulation mode) */}
        {!isHardwareLive && onConditionChange && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>STATE:</span>
            <select 
              value={condition}
              onChange={(e) => onConditionChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--navy)',
                fontSize: 11,
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: 130
              }}
            >
              {isDC ? (
                dcClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))
              ) : (
                cwruClasses.map(cls => (
                  <option key={cls} value={cls}>
                    {CLASS_HUMAN_NAMES[cls] || cls}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Speed Multiplier */}
        {!isHardwareLive && onSpeedChange && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>SPEED:</span>
            <select 
              value={speedMultiplier}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--navy)',
                fontSize: 11,
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {speedOptions.map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications Bell Icon Button */}
        <button 
          className="topbar-btn-icon" 
          title={`${openAlertsCount} active alert(s)`}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <IconBell size={15} color={openAlertsCount > 0 ? 'var(--warning)' : 'var(--navy)'} />
          {openAlertsCount > 0 && (
            <span className="topbar-btn-badge" style={{
              position: 'absolute',
              top: -3,
              right: -3,
              backgroundColor: 'var(--critical)',
              color: '#FFFFFF',
              fontSize: 9,
              fontWeight: 800,
              width: 15,
              height: 15,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {openAlertsCount}
            </span>
          )}
        </button>

        {/* User Profile matching reference (RI Rithika) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '3px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            backgroundColor: 'var(--navy)',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            RI
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--navy)',
            paddingRight: 4
          }}>
            {role === 'admin' ? 'Rithika' : 'Technician'}
          </span>
        </div>
      </div>
    </header>
  );
}
