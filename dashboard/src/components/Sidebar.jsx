import React from 'react';
/**
 * Sidebar.jsx - MotorGuard AI Industrial Navigation Sidebar
 * Conforms to MotorGuard AI Reference Guide (Panels 1–8).
 * Deep industrial navy theme with white typography and cyan active indicators.
 */

import {
  IconActivity,
  IconServer,
  IconRadio,
  IconAlertTriangle,
  IconWrench,
  IconCpu,
  IconTrendingUp,
  IconSettings,
  IconMotor
} from './Common.jsx';

export function Sidebar({ currentPage, setPage, openAlertsCount = 0, role = 'admin', userEmail = 'admin@inframonitor.io', onLogout }) {
  const allNavItems = [
    { id: 'overview', label: 'Dashboard', icon: IconActivity, adminOnly: false, techVisible: true },
    { id: 'live', label: 'Live Monitor', icon: IconRadio, adminOnly: false, techVisible: true },
    { id: 'ai', label: 'AI Insights', icon: IconCpu, adminOnly: true, techVisible: false },
    { id: 'analytics', label: 'Analytics', icon: IconTrendingUp, adminOnly: true, techVisible: false },
    { id: 'assets', label: 'Assets', icon: IconServer, adminOnly: true, techVisible: false },
    { id: 'maintenance', label: 'Maintenance', icon: IconWrench, adminOnly: false, techVisible: true },
    { id: 'alerts', label: 'Alerts', icon: IconAlertTriangle, adminOnly: false, techVisible: true, badge: openAlertsCount },
    { id: 'settings', label: 'Settings', icon: IconSettings, adminOnly: true, techVisible: false },
  ];

  const visibleItems = allNavItems.filter(item => role === 'technician' ? item.techVisible : true);
  const displayRole = role === 'admin' ? 'Admin / Engineer' : 'Field Technician';
  const avatarInitials = role === 'admin' ? 'RI' : 'FT';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <IconMotor size={18} color="var(--accent-bright)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="brand-title">
            MotorGuard <span style={{ color: 'var(--accent-bright)' }}>AI</span>
          </div>
          <div className="brand-subtitle">
            Predictive Maintenance
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-menu">
        {visibleItems.map(item => {
          const isActive = currentPage === item.id;
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">
                <IconComp size={16} color={isActive ? 'var(--accent-bright)' : '#C9DCEB'} />
              </span>
              <span className="nav-label" style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div className="user-avatar">
              {avatarInitials}
            </div>
            <div className="user-info" style={{ minWidth: 0 }}>
              <div className="user-name">
                {displayRole}
              </div>
              <div className="user-email">
                {userEmail}
              </div>
            </div>
          </div>
          <button 
            className="btn-logout" 
            onClick={onLogout} 
            title="Sign Out"
          >
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
}
