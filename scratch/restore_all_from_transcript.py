import json
import os
import re

log_path = r"C:\Users\rithi\.gemini\antigravity-ide\brain\56ea7eb6-7958-4dc6-a10b-6244e3eeea7b\.system_generated/logs/transcript_full.jsonl"
base_dir = r"c:\Users\rithi\Downloads\working-prototype - Copy"

targets = {
    "dashboard/src/components/Common.jsx": ["export function IconActivity", "export function LiveChart", "Common.js"],
    "dashboard/src/components/ConceptDashboard.jsx": ["export function ConceptDashboard", "ConceptDashboard.js"],
    "dashboard/src/components/Login.jsx": ["export function LoginView", "Login.js"],
    "dashboard/src/components/Sidebar.jsx": ["export function Sidebar", "Sidebar.js"],
}

found = {}

for line in open(log_path, "r", encoding="utf-8"):
    for rel_path, keywords in targets.items():
        if all(kw in line for kw in keywords):
            try:
                data = json.loads(line)
                content = ""
                if data.get("type") == "VIEW_FILE":
                    content = data.get("content", "")
                    # strip line prefix like "1: "
                    lines_clean = []
                    for l in content.split("\n"):
                        m = re.match(r"^\d+:\s?(.*)$", l)
                        if m:
                            lines_clean.append(m.group(1))
                        elif not l.startswith("Created At") and not l.startswith("Completed At") and not l.startswith("File Path") and not l.startswith("Total") and not l.startswith("Showing lines") and not l.startswith("The following code"):
                            lines_clean.append(l)
                    content = "\n".join(lines_clean)
                elif "tool_calls" in data:
                    for tc in data.get("tool_calls", []):
                        args = tc.get("args", {})
                        code = args.get("CodeContent") or args.get("ReplacementContent")
                        if code and keywords[0] in code:
                            content = code
                
                if content and keywords[0] in content:
                    if rel_path not in found or len(content) > len(found[rel_path]):
                        found[rel_path] = content
            except Exception:
                pass

for rel_path, code in found.items():
    full_path = os.path.join(base_dir, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Extracted {rel_path} ({len(code)} bytes)")
