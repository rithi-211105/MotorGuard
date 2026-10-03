import json
import os

log_path = r"C:\Users\rithi\.gemini\antigravity-ide\brain\56ea7eb6-7958-4dc6-a10b-6244e3eeea7b\.system_generated/logs/transcript_full.jsonl"
base_dir = r"c:\Users\rithi\Downloads\working-prototype - Copy"

files_to_restore = {
    "dashboard/src/components/Common.jsx": ["IconActivity", "LiveChart"],
    "dashboard/src/components/ConceptDashboard.jsx": ["ConceptDashboard"],
    "dashboard/src/components/Login.jsx": ["LoginView"],
    "dashboard/src/components/Navbar.jsx": ["Navbar"],
    "dashboard/src/components/Sidebar.jsx": ["Sidebar"],
    "dashboard/src/pages/AIInsights.jsx": ["AIInsightsPage"],
    "dashboard/src/pages/Alerts.jsx": ["AlertsPage"],
    "dashboard/src/pages/Analytics.jsx": ["AnalyticsPage"],
    "dashboard/src/pages/Assets.jsx": ["AssetsPage"],
    "dashboard/src/pages/Energy.jsx": ["EnergyPage"],
    "dashboard/src/pages/LiveMonitoring.jsx": ["LiveMonitoringPage"],
    "dashboard/src/pages/Maintenance.jsx": ["MaintenancePage"],
    "dashboard/src/pages/Overview.jsx": ["OverviewPage"],
    "dashboard/src/pages/Settings.jsx": ["SettingsPage"],
}

found_code = {}

for line in open(log_path, "r", encoding="utf-8"):
    try:
        data = json.loads(line)
        tool_calls = data.get("tool_calls", [])
        for tc in tool_calls:
            args = tc.get("args", {})
            target = args.get("TargetFile", "").replace("\\", "/").lower()
            code = args.get("CodeContent") or args.get("ReplacementContent")
            
            if code and target:
                for rel_path, keywords in files_to_restore.items():
                    rel_name = rel_path.split("/")[-1].split(".")[0].lower()
                    if rel_name in target.split("/")[-1]:
                        if all(kw in code for kw in keywords):
                            if rel_path not in found_code or len(code) > len(found_code[rel_path]):
                                found_code[rel_path] = code
    except Exception:
        pass

print("Found files:", list(found_code.keys()))

for rel_path, code in found_code.items():
    full_path = os.path.join(base_dir, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Restored {rel_path} ({len(code)} bytes)")
