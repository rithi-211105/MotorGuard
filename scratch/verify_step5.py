# verify_step5.py - Verification script for Step 5 Alerts & Events Redesign

with open('dashboard/src/pages/Alerts.jsx', encoding='utf-8') as f:
    code = f.read()

# Assertions for Section 1: Page Header
assert 'ALERTS & EVENTS' in code
assert 'Real-time equipment events and condition warnings' in code
assert 'ACTIVE ALERTS' in code
assert 'PROFILE' in code

# Assertions for Section 2: Top KPI Strip
assert 'UNRESOLVED INCIDENTS' in code
assert 'IMMEDIATE ACTION' in code
assert 'TREND MONITORING' in code
assert 'RESOLVED TODAY' in code

# Assertions for Section 3: Alert Severity Summary
assert 'ALERT SEVERITY DISTRIBUTION' in code
assert 'NO ACTIVE EVENTS' in code

# Assertions for Section 4: Live Event Stream
assert 'LIVE EVENT STREAM' in code
assert 'alert-timeline-card' in code

# Assertions for Section 6: Action handlers preserved
assert 'onAcknowledgeAlert' in code
assert 'onResolveAlert' in code
assert 'handleCreateTaskFromAlert' in code
assert 'onCreateTask' in code

# Assertions for Section 7: Selected Event Details
assert 'SELECTED EVENT DETAILS' in code
assert 'AI DIAGNOSTIC DIRECTIVE' in code
assert 'CREATE MAINTENANCE WORK ORDER' in code

# Assertions for Section 9: Profile Isolation
assert 'MOTOR-12V-001' in code
assert 'MOTOR-2HP-001' in code
assert '12 V DC Motor Prototype' in code
assert '2 HP Motor Bench' in code

print('[SUCCESS] All Step 5 assertions passed cleanly!')
