import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.js';
import { LoginView } from './components/Login.jsx';
import { LoadingScreen } from './components/LoadingScreen.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Navbar as Topbar } from './components/Navbar.jsx';
import { OverviewPage } from './pages/Overview.jsx';
import { LiveMonitoringPage } from './pages/LiveMonitoring.jsx';
import { AssetsPage } from './pages/Assets.jsx';
import { AlertsPage } from './pages/Alerts.jsx';
import { MaintenancePage } from './pages/Maintenance.jsx';
import { AIInsightsPage } from './pages/AIInsights.jsx';
import { AnalyticsPage } from './pages/Analytics.jsx';
import { EnergyPage } from './pages/Energy.jsx';
import { SettingsPage } from './pages/Settings.jsx';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // 'admin' or 'technician'
  const [userEmail, setUserEmail] = useState('admin@inframonitor.io');
  const [currentPage, setPage] = useState('overview');
  const [activeInfrastructure, setActiveInfrastructure] = useState('motor');

  // Centralized Real-Time Telemetry & System State
  const [sensor, setSensor] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [baselines, setBaselines] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [aiStatusData, setAiStatusData] = useState(null);
  const [simulationStatus, setSimulationStatus] = useState(null);
  
  // Simulation Controls State
  const [selectedCondition, setSelectedCondition] = useState('Normal_1');
  const [replaySpeed, setReplaySpeed] = useState(1.0);
  const [lastUpdated, setLastUpdated] = useState(null);

  // WebSocket Connection States: CONNECTED, CONNECTING, DISCONNECTED, RECONNECTING
  const [wsConnected, setWsConnected] = useState(false);
  const [wsStatus, setWsStatus] = useState('CONNECTING');
  const [comparing, setComparing] = useState(false);

  // EDGE-FIRST & OFFLINE CONNECTIVITY STATE (STEP 12)
  const [isInternetOnline, setIsInternetOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastTelemetryTime, setLastTelemetryTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Listen to browser network connectivity events
  useEffect(() => {
    const handleOnline = () => setIsInternetOnline(true);
    const handleOffline = () => setIsInternetOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Stale Telemetry Timer - updates currentTime every 1000ms
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeProfile = activeInfrastructure === 'dc_motor_12v' ? 'dc_motor_12v' : 'cwru_2hp';
  const isDC = activeInfrastructure === 'dc_motor_12v';

  // Last-known data retrieval on initial load or profile switch if sensor is null (STEP 12)
  useEffect(() => {
    if (!sensor) {
      try {
        const cacheKey = isDC ? 'motorguard_last_known_dc' : 'motorguard_last_known_cwru';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.sensor) {
            setSensor({ ...parsed.sensor, _is_last_known: true });
            if (parsed.timestamp) setLastTelemetryTime(parsed.timestamp);
          }
        }
      } catch (e) {}
    }
  }, [isDC, sensor]);

  // =====================================================
  // HARDWARE CONNECTION STATUS & FRESHNESS
  // =====================================================
  const telemetryTimestamp =
    sensor?.timestamp_ms ||
    sensor?.timestamp ||
    null;

  let telemetryAgeSec = Infinity;

  if (telemetryTimestamp) {
    const ts =
      typeof telemetryTimestamp === 'number'
        ? telemetryTimestamp
        : new Date(telemetryTimestamp).getTime();

    if (!Number.isNaN(ts)) {
      telemetryAgeSec = (Date.now() - ts) / 1000;
    }
  } else if (lastTelemetryTime) {
    telemetryAgeSec = Math.max(0, (currentTime - lastTelemetryTime) / 1000);
  }

  // ESP32 is considered LIVE if backend received telemetry within last 10 seconds
  let telemetryFreshness = 'OFFLINE';

  if (sensor?.source === 'hardware' && telemetryAgeSec < 10) {
    telemetryFreshness = 'LIVE';
  } else if (sensor?.source === 'hardware' && telemetryAgeSec < 30) {
    telemetryFreshness = 'RECENT';
  } else if (sensor?.source === 'hardware') {
    telemetryFreshness = 'STALE';
  } else if (wsConnected) {
    telemetryFreshness = 'RECENT';
  }

  // Explicit hardware detection
  const isHardwareLive =
    sensor?.source === 'hardware' ||
    sensor?.mode?.includes('LIVE HARDWARE') ||
    stats?.is_hardware_live === true ||
    stats?.mode?.includes('LIVE HARDWARE');

  const backendOnline = wsConnected || Boolean(stats);

  // Connection mode
  let connectionMode = 'online';

  if (!backendOnline) {
    connectionMode = 'offline';
  } else if (!isInternetOnline) {
    connectionMode = 'local-offline';
  } else if (telemetryFreshness === 'LIVE' && isHardwareLive) {
    connectionMode = 'online';
  } else if (telemetryFreshness === 'RECENT' && isHardwareLive) {
    connectionMode = 'degraded';
  } else if (telemetryFreshness === 'STALE' && isHardwareLive) {
    connectionMode = 'degraded';
  } else if (isHardwareLive) {
    connectionMode = 'offline';
  } else {
    connectionMode = 'online';
  }

  const connectionStatus = {
    mode: connectionMode,
    internet: isInternetOnline ? 'online' : 'offline',
    backend: backendOnline ? 'online' : 'offline',
    websocket: wsConnected ? 'connected' : (wsStatus === 'RECONNECTING' ? 'reconnecting' : 'disconnected'),
    hardware: isHardwareLive ? 'online' : 'simulated',
    aiEngine: 'ready',
    processing: 'local',
    telemetryFreshness,
    telemetryAgeSec,
    lastTelemetryTime
  };

  // On startup, initialize activeInfrastructure from backend motor profile
  useEffect(() => {
    api.getMotorProfile().then(res => {
      if (res && res.active_profile) {
        if (res.active_profile === 'dc_motor_12v') {
          setActiveInfrastructure('dc_motor_12v');
          setSelectedCondition('Normal Operation');
        } else {
          setActiveInfrastructure('motor');
          setSelectedCondition('Normal_1');
        }
      }
    }).catch(() => {});
  }, []);

  const [isInitializing, setIsInitializing] = useState(false);
  // Permanent Light MotorGuard Theme
  useEffect(() => {
    document.body.className = 'theme-light';
  }, []);

  // Handle Login & Logout
  const handleLogin = ({ role, email }) => {
    setUserRole(role);
    setUserEmail(email || (role === 'admin' ? 'admin@inframonitor.io' : 'tech@inframonitor.io'));
    setIsLoggedIn(true);
    setPage('overview');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Enforce role restrictions for technician
  useEffect(() => {
    if (userRole === 'technician') {
      const allowedTechPages = ['overview', 'live', 'alerts', 'maintenance'];
      if (!allowedTechPages.includes(currentPage)) {
        setPage('overview');
      }
    }
  }, [userRole, currentPage]);

  // Fetch AI Status & Simulation Status on Init
  const fetchStatusInfo = useCallback(async () => {
    try {
      const [aiStat, simStat] = await Promise.all([
        api.getAIStatus(activeProfile).catch(() => null),
        api.getSimulationStatus().catch(() => null)
      ]);
      if (aiStat) setAiStatusData(aiStat);
      if (simStat) {
        setSimulationStatus(simStat);
        if (simStat.condition) setSelectedCondition(simStat.condition);
        if (simStat.speed_multiplier) setReplaySpeed(simStat.speed_multiplier);
      }
    } catch (e) {}
  }, [activeProfile]);

  // Single Central WebSocket Connection Handler with Reconnection
  useEffect(() => {
    if (!isLoggedIn) return;

    let ws = null;
    let timer = null;
    let isComponentMounted = true;

    const connect = () => {
      if (!isComponentMounted) return;
      setWsStatus(prev => (prev === 'DISCONNECTED' || prev === 'RECONNECTING' ? 'RECONNECTING' : 'CONNECTING'));

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      const wsUrl = `${protocol}//${host}:8000/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isComponentMounted) return;
        setWsConnected(true);
        setWsStatus('CONNECTED');
        fetchStatusInfo();
      };

      ws.onclose = () => {
        if (!isComponentMounted) return;
        setWsConnected(false);
        setWsStatus('RECONNECTING');
        timer = setTimeout(connect, 2500);
      };

      ws.onerror = () => {
        if (!isComponentMounted) return;
        setWsConnected(false);
        setWsStatus('DISCONNECTED');
      };

      ws.onmessage = (e) => {
        if (!isComponentMounted) return;
        try {
          const msg = JSON.parse(e.data);
          
          if (msg.type === 'alert' && msg.data) {
            setAlerts(prev => [msg.data, ...prev.filter(a => a.id !== msg.data.id)]);
            return;
          }

          const sample = msg.type === 'telemetry' ? msg.data : msg;

          if (sample) {
            const sampleProf = sample.profile_name || (sample.voltage !== undefined ? 'dc_motor_12v' : 'cwru_2hp');
            const currentProf = activeInfrastructure === 'dc_motor_12v' ? 'dc_motor_12v' : 'cwru_2hp';

            // Filter out stale cross-profile packets
            if (sampleProf !== currentProf) return;

            const isValid = sample.rms !== undefined || 
                            sample.accel_rms !== undefined || 
                            sample.voltage !== undefined || 
                            sample.current !== undefined || 
                            sample.vibration_rms !== undefined;

            if (isValid) {
              setSensor(sample);
              const nowTime = Date.now();
              setLastUpdated(nowTime);
              setLastTelemetryTime(nowTime);

              if (sample.fault_class) setSelectedCondition(sample.fault_class);
              if (sample.speed_multiplier) setReplaySpeed(sample.speed_multiplier);

              // Persist last known valid telemetry locally for offline operation (STEP 12)
              try {
                const cacheKey = sampleProf === 'dc_motor_12v' ? 'motorguard_last_known_dc' : 'motorguard_last_known_cwru';
                localStorage.setItem(cacheKey, JSON.stringify({
                  sensor: sample,
                  timestamp: nowTime
                }));
              } catch (e) {}

              setHistory(prev => {
                const updated = [...prev, sample];
                return updated.length > 150 ? updated.slice(-150) : updated;
              });
            }
          }
        } catch (err) {}
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      if (ws) ws.close();
      if (timer) clearTimeout(timer);
    };
  }, [isLoggedIn, fetchStatusInfo, activeInfrastructure]);

  // Periodic REST Data Polling
  const fetchAllData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const [statsData, baseData, compData, alertData, assetData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getBaselines().catch(() => []),
        api.getComparisons(20).catch(() => []),
        api.getAlerts(50).catch(() => []),
        api.getAssets().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (baseData) setBaselines(baseData);
      if (compData) setComparisons(compData);
      if (alertData) setAlerts(alertData);
      if (assetData) setAssets(assetData);
    } catch (err) {}
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAllData();
      fetchStatusInfo();
      const interval = setInterval(fetchAllData, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchAllData, fetchStatusInfo]);

  // Simulation Control Handlers
  const handleConditionChange = async (condition) => {
    try {
      const res = await api.setSimulationCondition(condition, replaySpeed);
      setSelectedCondition(condition);
      if (res.simulation) setSimulationStatus(res.simulation);
    } catch (err) {
      console.error('Failed changing condition:', err);
    }
  };

  const handleSpeedChange = async (speed) => {
    try {
      const res = await api.setSimulationSpeed(speed);
      setReplaySpeed(speed);
      if (res.simulation) setSimulationStatus(res.simulation);
    } catch (err) {
      console.error('Failed setting speed:', err);
    }
  };

  const handleStartSim = async () => {
    const res = await api.startSimulation(selectedCondition, replaySpeed);
    if (res.simulation) setSimulationStatus(res.simulation);
  };

  const handleStopSim = async () => {
    const res = await api.stopSimulation();
    if (res.simulation) setSimulationStatus(res.simulation);
  };

  const handlePauseSim = async () => {
    const res = await api.pauseSimulation();
    if (res.simulation) setSimulationStatus(res.simulation);
  };

  const handleResumeSim = async () => {
    const res = await api.resumeSimulation();
    if (res.simulation) setSimulationStatus(res.simulation);
  };

  const handleResetSim = async () => {
    const res = await api.resetSimulation();
    if (res.simulation) setSimulationStatus(res.simulation);
  };

  const handleRecordBaseline = async (name, condition, duration) => {
    const res = await api.recordBaseline(name, condition, duration);
    fetchAllData();
    return res;
  };

  const handleCompare = async (baselineId, duration) => {
    setComparing(true);
    try {
      const res = await api.runComparison(baselineId, duration);
      await fetchAllData();
      return res;
    } finally {
      setComparing(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    await api.acknowledgeAlert(alertId);
    fetchAllData();
  };

  const handleResolveAlert = async (alertId) => {
    await api.resolveAlert(alertId);
    fetchAllData();
  };

  const handleCreateTask = async (taskData) => {
    await api.createMaintenance(taskData);
    fetchAllData();
  };

  if (isInitializing) {
    return <LoadingScreen onComplete={() => setIsInitializing(false)} duration={1200} />;
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  const activeAlertsList = alerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED' || a.status === 'new');
  const openAlertsCount = activeAlertsList.length;

  const handleInfrastructureChange = async (infraId) => {
    setActiveInfrastructure(infraId);
    setSensor(null);
    setHistory([]);
    setStats(null);
    if (infraId === 'dc_motor_12v') {
      try {
        await api.setMotorProfile('dc_motor_12v');
        setSelectedCondition('Normal Operation');
        fetchStatusInfo();
      } catch (e) {}
    } else if (infraId === 'motor' || infraId === 'cwru_2hp') {
      try {
        await api.setMotorProfile('cwru_2hp');
        setSelectedCondition('Normal_1');
        fetchStatusInfo();
      } catch (e) {}
    }
  };

  // 1. Loading / Splash Screen
  if (isInitializing) {
    return <LoadingScreen onComplete={() => setIsInitializing(false)} duration={1800} />;
  }

  // 2. Industrial Login Experience
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  // 3. Authenticated Dashboard Command Center
  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setPage={setPage}
        openAlertsCount={openAlertsCount}
        wsConnected={wsConnected}
        role={userRole}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      <div className="main-wrapper">
        <Topbar
          currentPage={currentPage}
          role={userRole}
          isHardwareLive={isHardwareLive}
          condition={selectedCondition}
          onConditionChange={handleConditionChange}
          speedMultiplier={replaySpeed}
          onSpeedChange={handleSpeedChange}
          wsConnected={wsConnected}
          wsStatus={wsStatus}
          onLogout={handleLogout}
          activeInfrastructure={activeInfrastructure}
          onSelectInfrastructure={handleInfrastructureChange}
          stats={stats}
          openAlertsCount={openAlertsCount}
          connectionStatus={connectionStatus}
        />

        <main className="content-area">
          {currentPage === 'overview' && (
            <OverviewPage
              sensor={sensor}
              stats={stats}
              history={history}
              wsConnected={wsConnected}
              wsStatus={wsStatus}
              lastUpdated={lastUpdated}
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
              onNavigate={setPage}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
              connectionStatus={connectionStatus}
            />
          )}

          {currentPage === 'live' && (
            <LiveMonitoringPage
              sensor={sensor}
              history={history}
              wsConnected={wsConnected}
              wsStatus={wsStatus}
              stats={stats}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
              connectionStatus={connectionStatus}
            />
          )}

          {currentPage === 'assets' && userRole === 'admin' && (
            <AssetsPage
              assets={assets}
              sensor={sensor}
              stats={stats}
              baselines={baselines}
              onRecordBaseline={handleRecordBaseline}
              onCompare={handleCompare}
              comparing={comparing}
              activeInfrastructure={activeInfrastructure}
              onSelectInfrastructure={handleInfrastructureChange}
              activeProfile={activeProfile}
              isDC={isDC}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              sensor={sensor}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
              onCreateTask={handleCreateTask}
              role={userRole}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
              connectionStatus={connectionStatus}
            />
          )}

          {currentPage === 'maintenance' && (
            <MaintenancePage
              role={userRole}
              alerts={alerts}
              onCreateTask={handleCreateTask}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
            />
          )}

          {currentPage === 'ai' && userRole === 'admin' && (
            <AIInsightsPage
              sensor={sensor}
              aiStatusData={aiStatusData}
              stats={stats}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
              connectionStatus={connectionStatus}
            />
          )}

          {currentPage === 'analytics' && userRole === 'admin' && (
            <AnalyticsPage
              history={history}
              comparisons={comparisons}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
            />
          )}

          {currentPage === 'energy' && userRole === 'admin' && (
            <EnergyPage
              sensor={sensor}
              history={history}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
            />
          )}

          {currentPage === 'settings' && userRole === 'admin' && (
            <SettingsPage
              stats={stats}
              sensor={sensor}
              aiStatusData={aiStatusData}
              simulationStatus={simulationStatus}
              selectedCondition={selectedCondition}
              replaySpeed={replaySpeed}
              onConditionChange={handleConditionChange}
              onSpeedChange={handleSpeedChange}
              onStartSim={handleStartSim}
              onStopSim={handleStopSim}
              onPauseSim={handlePauseSim}
              onResumeSim={handleResumeSim}
              onResetSim={handleResetSim}
              activeInfrastructure={activeInfrastructure}
              activeProfile={activeProfile}
              isDC={isDC}
              connectionStatus={connectionStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}


