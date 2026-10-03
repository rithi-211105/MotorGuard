import React, { useState } from 'react';
/**
 * Login.jsx - MotorGuard AI Clean Industrial Login Screen
 * Conforms to STEP 9B requirements and MotorGuard AI Light Industrial reference.
 * Split-layout: Left industrial branding + technical motor graphic, Right clean white login card.
 */

import { IconMotor, IconShield, IconCheck, IconRadio, IconCpu } from './Common.jsx';

export function LoginView({ onLogin }) {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('admin@inframonitor.io');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    if (selectedRole === 'admin') {
      setEmail('admin@inframonitor.io');
    } else {
      setEmail('technician@inframonitor.io');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid enterprise username or email.');
      return;
    }
    setError('');
    onLogin({
      role,
      email: email.trim()
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      boxSizing: 'border-box',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Background Subtle Technical Dot Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        opacity: 0.4,
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '22px 22px'
      }} />

      {/* Main Responsive Split Container */}
      <div className="login-split-container" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        maxWidth: 960,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 24px rgba(18, 59, 104, 0.08)',
        zIndex: 2,
        overflow: 'hidden'
      }}>
        {/* LEFT / BRANDING AREA */}
        <div className="login-brand-panel" style={{
          flex: '1 1 50%',
          backgroundColor: 'var(--bg-soft)',
          borderRight: '1px solid var(--border)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0
        }}>
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-light)',
                border: '1.5px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(21, 158, 209, 0.15)',
                flexShrink: 0
              }}>
                <IconMotor size={22} color="var(--navy)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2
                }}>
                  MotorGuard <span style={{ color: 'var(--accent-bright)' }}>AI</span>
                </div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginTop: 2
                }}>
                  Predictive Maintenance
                </div>
              </div>
            </div>

            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginTop: 10,
              maxWidth: 380
            }}>
              AI-Powered Motor Health & Predictive Maintenance Platform for industrial drivetrains and critical rotational assets.
            </p>
          </div>

          {/* Technical Motor Graphic Visual */}
          <div className="login-motor-graphic" style={{
            margin: '28px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg
              viewBox="0 0 380 160"
              style={{ width: '100%', maxWidth: 360, height: 'auto', overflow: 'visible' }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="loginWaveGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C9DCEB" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#39C5ED" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#C9DCEB" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="motorShellGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E5B99" />
                  <stop offset="50%" stopColor="#0B3B6E" />
                  <stop offset="100%" stopColor="#082E57" />
                </linearGradient>
              </defs>

              {/* Background Waveform */}
              <path
                d="M 10 80 Q 50 55 90 80 T 170 80 T 250 80 T 330 80 T 370 80"
                fill="none"
                stroke="url(#loginWaveGrad)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Motor Base */}
              <rect x="120" y="125" width="140" height="10" rx="2" fill="#607A94" />
              <rect x="135" y="115" width="24" height="12" fill="#8AA0B5" />
              <rect x="220" y="115" width="24" height="12" fill="#8AA0B5" />

              {/* Motor Stator Body */}
              <rect x="115" y="38" width="150" height="80" rx="8" fill="url(#motorShellGrad)" stroke="#082E57" strokeWidth="1.5" />

              {/* Precision Fins */}
              {[48, 59, 70, 81, 92, 103].map(y => (
                <line key={y} x1="125" y1={y} x2="255" y2={y} stroke="#39C5ED" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
              ))}

              {/* Terminal Box */}
              <rect x="168" y="24" width="44" height="16" rx="2" fill="#082E57" stroke="#39C5ED" strokeWidth="1.2" />
              <circle cx="180" cy="32" r="2.5" fill="#E6A21A" />
              <circle cx="190" cy="32" r="2.5" fill="#39C5ED" />
              <circle cx="200" cy="32" r="2.5" fill="#19A974" />

              {/* Drive Shaft */}
              <rect x="75" y="70" width="42" height="14" rx="2" fill="#AFC7DC" stroke="#607A94" strokeWidth="1.2" />
              <rect x="66" y="72" width="10" height="10" rx="1" fill="#39C5ED" />

              {/* Fan Cowling */}
              <rect x="263" y="44" width="22" height="68" rx="4" fill="#0B3B6E" stroke="#082E57" strokeWidth="1.2" />
              {[54, 66, 78, 90, 102].map(y => (
                <line key={y} x1="268" y1={y} x2="280" y2={y} stroke="#DDF5FC" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              ))}
            </svg>
          </div>

          {/* Supporting Statements */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingTop: 16,
            borderTop: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconCheck size={11} color="var(--accent)" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Smarter Monitoring.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconCheck size={11} color="var(--accent)" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Fewer Failures.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconCheck size={11} color="var(--accent)" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Higher Uptime.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: LOGIN CARD */}
        <div style={{
          flex: '1 1 50%',
          backgroundColor: '#FFFFFF',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0
        }}>
          {/* Form Header */}
          <div style={{ marginBottom: 22 }}>
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              margin: '0 0 6px 0'
            }}>
              Welcome back
            </h2>
            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Sign in to continue monitoring your assets.
            </p>
          </div>

          {/* Operational Profile Selector (Existing auth role feature) */}
          <div style={{ marginBottom: 20 }}>
            <label id="profile-select-label" style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              display: 'block',
              marginBottom: 6
            }}>
              Operational Profile
            </label>
            <div 
              role="group" 
              aria-labelledby="profile-select-label"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                backgroundColor: 'var(--bg-soft)',
                padding: 4,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)'
              }}
            >
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                style={{
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: role === 'admin' ? '#FFFFFF' : 'transparent',
                  color: role === 'admin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: role === 'admin' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Admin / Engineer
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('technician')}
                style={{
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: role === 'technician' ? '#FFFFFF' : 'transparent',
                  color: role === 'technician' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: role === 'technician' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Field Technician
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Error Message with accessible text and icon */}
            {error && (
              <div 
                role="alert"
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--danger-light)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label 
                htmlFor="login-email"
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}
              >
                Email / Username
              </label>
              <input 
                id="login-email"
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@inframonitor.io"
                required
                autoComplete="username"
                style={{
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label 
                  htmlFor="login-password"
                  style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  Password
                </label>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                  Demo credentials pre-filled
                </span>
              </div>
              <input 
                id="login-password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                marginTop: 4,
                letterSpacing: '0.4px',
                cursor: 'pointer'
              }}
            >
              SIGN IN
            </button>
          </form>

          {/* Secure Environment Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid var(--border-light)'
          }}>
            <IconShield size={14} color="var(--text-muted)" />
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)'
            }}>
              Secure industrial monitoring environment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
