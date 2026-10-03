import React, { useState, useEffect } from 'react';
/**
 * LoadingScreen.jsx - MotorGuard AI Professional Industrial Splash Screen
 * Conforms to STEP 9B requirements and MotorGuard AI Light Industrial reference.
 * Pure Light Industrial Blue Theme (White / #F4F8FC + Navy + Cyan accents).
 */

import { IconMotor, IconCpu, IconServer, IconWaves, IconRadio } from './Common.jsx';

export function LoadingScreen({ onComplete, duration = 1800 }) {
  const [progress, setProgress] = useState(12);
  const [stage, setStage] = useState('Initializing monitoring system...');

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 30) {
        setStage('Initializing monitoring system...');
      } else if (pct < 60) {
        setStage('Connecting to ESP32 telemetry bus & sensors...');
      } else if (pct < 88) {
        setStage('Verifying AI diagnostic model ensemble...');
      } else {
        setStage('System ready. Launching MotorGuard AI...');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 35);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  // Dynamic system status values based on initialization progress
  const getSystemStatus = () => {
    if (progress < 30) {
      return {
        esp32: { label: 'Connecting...', color: 'var(--warning)', dot: 'var(--warning)' },
        sensors: { label: 'Initializing...', color: 'var(--text-secondary)', dot: 'var(--text-muted)' },
        ai: { label: 'Standby', color: 'var(--text-secondary)', dot: 'var(--text-muted)' },
        db: { label: 'Connecting...', color: 'var(--warning)', dot: 'var(--warning)' },
      };
    } else if (progress < 75) {
      return {
        esp32: { label: 'Connecting...', color: 'var(--accent)', dot: 'var(--accent-bright)' },
        sensors: { label: 'Initializing...', color: 'var(--accent)', dot: 'var(--accent-bright)' },
        ai: { label: 'Ready', color: 'var(--accent)', dot: 'var(--accent-bright)' },
        db: { label: 'Connected', color: 'var(--success)', dot: 'var(--success)' },
      };
    } else {
      return {
        esp32: { label: 'Connected', color: 'var(--success)', dot: 'var(--success)' },
        sensors: { label: 'Online', color: 'var(--success)', dot: 'var(--success)' },
        ai: { label: 'Ready', color: 'var(--success)', dot: 'var(--success)' },
        db: { label: 'Connected', color: 'var(--success)', dot: 'var(--success)' },
      };
    }
  };

  const status = getSystemStatus();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '40px 24px 32px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Background Subtle Technical Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        opacity: 0.45,
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      {/* Top / Center Branding Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 2,
        maxWidth: 600
      }}>
        {/* Logo Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-light)',
          border: '1.5px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          boxShadow: '0 2px 8px rgba(21, 158, 209, 0.15)'
        }}>
          <IconMotor size={26} color="var(--navy)" />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 26,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
          margin: 0,
          lineHeight: 1.2
        }}>
          MOTORGUARD <span style={{ color: 'var(--accent-bright)' }}>AI</span>
        </h1>

        {/* Subtitle */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginTop: 6
        }}>
          AI-Powered Motor Health & Predictive Maintenance
        </div>
      </div>

      {/* Center: Industrial Motor Schematic with Waveform & Progress */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 580,
        zIndex: 2,
        margin: '20px 0'
      }}>
        {/* Technical Motor Schematic SVG */}
        <svg
          viewBox="0 0 560 210"
          style={{ width: '100%', height: 'auto', maxHeight: 210, overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cyanWaveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C9DCEB" stopOpacity="0.2" />
              <stop offset="50%" stopColor="var(--accent-bright)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#C9DCEB" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="motorBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E5B99" />
              <stop offset="50%" stopColor="#0B3B6E" />
              <stop offset="100%" stopColor="#082E57" />
            </linearGradient>

            <linearGradient id="finLightGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#39C5ED" />
              <stop offset="100%" stopColor="#159ED1" />
            </linearGradient>
          </defs>

          {/* Technical Radar / Concentric Rings */}
          <circle cx="280" cy="105" r="95" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="280" cy="105" r="140" fill="none" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.4" />

          {/* Subtle Telemetry Waveform Behind Motor */}
          <path
            d="M 15 105 Q 60 75 105 105 T 195 105 T 285 105 T 375 105 T 465 105 T 545 105"
            fill="none"
            stroke="url(#cyanWaveGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 30 105 Q 85 65 140 105 T 250 105 T 360 105 T 470 105 T 530 105"
            fill="none"
            stroke="var(--accent-bright)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Heavy Motor Base Mounting Plate */}
          <rect x="180" y="160" width="200" height="14" rx="3" fill="#607A94" />
          <rect x="200" y="146" width="32" height="15" fill="#8AA0B5" />
          <rect x="328" y="146" width="32" height="15" fill="#8AA0B5" />
          <circle cx="216" cy="167" r="3" fill="#F4F8FC" />
          <circle cx="344" cy="167" r="3" fill="#F4F8FC" />

          {/* Motor Main Cylindrical Stator Casing */}
          <rect x="175" y="52" width="210" height="96" rx="8" fill="url(#motorBodyGrad)" stroke="#082E57" strokeWidth="2" />

          {/* Precision Cooling Fins */}
          {[62, 75, 88, 101, 114, 127, 140].map(y => (
            <line key={y} x1="190" y1={y} x2="370" y2={y} stroke="url(#finLightGrad)" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          ))}

          {/* Electrical Terminal Box (Top) */}
          <rect x="250" y="34" width="60" height="20" rx="3" fill="#082E57" stroke="#39C5ED" strokeWidth="1.5" />
          <circle cx="266" cy="44" r="3" fill="#E6A21A" />
          <circle cx="280" cy="44" r="3" fill="#39C5ED" />
          <circle cx="294" cy="44" r="3" fill="#19A974" />

          {/* Drive Shaft (Left) */}
          <rect x="122" y="92" width="55" height="16" rx="2" fill="#AFC7DC" stroke="#607A94" strokeWidth="1.5" />
          <rect x="110" y="95" width="14" height="10" rx="1" fill="#39C5ED" />
          {/* Keyway */}
          <line x1="130" y1="96" x2="165" y2="96" stroke="#0B3B6E" strokeWidth="1.5" />

          {/* Drive End Bearing Housing */}
          <rect x="170" y="72" width="10" height="56" rx="2" fill="#39C5ED" />

          {/* Rear Fan Cowling (Right) */}
          <rect x="382" y="58" width="30" height="84" rx="6" fill="#0B3B6E" stroke="#082E57" strokeWidth="1.5" />
          {[70, 84, 98, 112, 126].map(y => (
            <line key={y} x1="388" y1={y} x2="406" y2={y} stroke="#DDF5FC" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          ))}
        </svg>

        {/* Progress Text & Indicator Bar */}
        <div style={{ width: '100%', maxWidth: 400, marginTop: 16, textAlign: 'center' }}>
          <div style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: '0.2px'
          }}>
            {stage}
          </div>

          <div 
            role="progressbar" 
            aria-valuenow={progress} 
            aria-valuemin="0" 
            aria-valuemax="100" 
            style={{
              width: '100%',
              height: 6,
              backgroundColor: 'var(--border-light)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'var(--accent)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.1s linear'
            }} />
          </div>
        </div>
      </div>

      {/* Bottom: 4 System Readiness Indicators & Tagline */}
      <div style={{
        width: '100%',
        maxWidth: 780,
        zIndex: 2
      }}>
        {/* 4 Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20
        }}>
          {/* Card 1: ESP32 */}
          <div className="card" style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconRadio size={16} color="var(--text-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                ESP32
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: status.esp32.color, whiteSpace: 'nowrap' }}>
                {status.esp32.label}
              </div>
            </div>
          </div>

          {/* Card 2: Sensors */}
          <div className="card" style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconWaves size={16} color="var(--accent)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Sensors
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: status.sensors.color, whiteSpace: 'nowrap' }}>
                {status.sensors.label}
              </div>
            </div>
          </div>

          {/* Card 3: AI Engine */}
          <div className="card" style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconCpu size={16} color="var(--text-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                AI Engine
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: status.ai.color, whiteSpace: 'nowrap' }}>
                {status.ai.label}
              </div>
            </div>
          </div>

          {/* Card 4: Database */}
          <div className="card" style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconServer size={16} color="var(--text-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Database
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: status.db.color, whiteSpace: 'nowrap' }}>
                {status.db.label}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tagline */}
        <div style={{
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          Real-time • Intelligent • Reliable
        </div>
      </div>
    </div>
  );
}
