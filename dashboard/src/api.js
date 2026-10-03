/**
 * api.js - Centralized API & WebSocket service
 */

const API_BASE = window.location.origin.includes('8000') 
  ? window.location.origin 
  : 'http://localhost:8000';

export async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.detail || 'API request failed');
    }
    return await res.json();
  } catch (error) {
    console.error(`API error on ${endpoint}:`, error);
    throw error;
  }
}

// API methods
export const api = {
  getStats: () => fetchJson('/api/stats'),
  getSensorCurrent: () => fetchJson('/api/sensor/current'),
  getSensorHistory: (count = 100) => fetchJson(`/api/sensor/history?count=${count}`),
  getConditions: () => fetchJson('/api/sensor/conditions'),
  setCondition: (condition, speed_rpm = 1500) => fetchJson('/api/sensor/condition', {
    method: 'POST',
    body: JSON.stringify({ condition, speed_rpm }),
  }),
  getBaselines: () => fetchJson('/api/baselines'),
  recordBaseline: (name, condition, duration_seconds = 10) => fetchJson('/api/baselines/record', {
    method: 'POST',
    body: JSON.stringify({ name, condition, speed_rpm: 1500, duration_seconds }),
  }),
  deleteBaseline: (id) => fetchJson(`/api/baselines/${id}`, { method: 'DELETE' }),
  runComparison: (baseline_id, duration_seconds = 5) => fetchJson('/api/compare', {
    method: 'POST',
    body: JSON.stringify({ baseline_id, duration_seconds }),
  }),
  getComparisons: (limit = 20) => fetchJson(`/api/comparisons?limit=${limit}`),
  getAlerts: (limit = 50) => fetchJson(`/api/alerts?limit=${limit}`),
  getActiveAlerts: () => fetchJson('/api/alerts/active'),
  acknowledgeAlert: (id) => fetchJson(`/api/alerts/${id}/acknowledge`, { method: 'POST' }),
  resolveAlert: (id) => fetchJson(`/api/alerts/${id}/resolve`, { method: 'POST' }),
  getAssets: () => fetchJson('/api/assets'),
  getAssetDetail: (id) => fetchJson(`/api/assets/${id}`),
  getMaintenance: (status = null, technician = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (technician) params.append('technician', technician);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/api/maintenance${query}`);
  },
  createMaintenance: (data) => fetchJson('/api/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMaintenance: (id, data) => fetchJson(`/api/maintenance/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  // Stage 3 & 4 Simulation Control Endpoints
  getSimulationStatus: () => fetchJson('/api/simulation/status'),
  startSimulation: (condition = 'Normal_1', speed_multiplier = 1.0) => fetchJson('/api/simulation/start', {
    method: 'POST',
    body: JSON.stringify({ condition, speed_multiplier }),
  }),
  stopSimulation: () => fetchJson('/api/simulation/stop', { method: 'POST' }),
  pauseSimulation: () => fetchJson('/api/simulation/pause', { method: 'POST' }),
  resumeSimulation: () => fetchJson('/api/simulation/resume', { method: 'POST' }),
  resetSimulation: () => fetchJson('/api/simulation/reset', { method: 'POST' }),
  setSimulationCondition: (condition, speed_multiplier = 1.0) => fetchJson('/api/simulation/condition', {
    method: 'POST',
    body: JSON.stringify({ condition, speed_multiplier }),
  }),
  setSimulationSpeed: (speed_multiplier) => fetchJson('/api/simulation/speed', {
    method: 'POST',
    body: JSON.stringify({ speed_multiplier }),
  }),
  getAIStatus: (profile) => fetchJson(profile ? `/api/ai/status?profile=${profile}` : '/api/ai/status'),
  getMotorProfile: () => fetchJson('/api/motor-profile'),
  setMotorProfile: (profile) => fetchJson('/api/motor-profile', {
    method: 'POST',
    body: JSON.stringify({ profile }),
  }),
  getDynamicThresholds: (profile) => fetchJson(profile ? `/api/dynamic-thresholds?profile=${profile}` : '/api/dynamic-thresholds'),
  resetDynamicThresholds: (profile) => fetchJson('/api/dynamic-thresholds/reset', {
    method: 'POST',
    body: JSON.stringify({ profile }),
  }),
};
