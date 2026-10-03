import json

log_path = r"C:\Users\rithi\.gemini\antigravity-ide\brain\56ea7eb6-7958-4dc6-a10b-6244e3eeea7b\.system_generated\logs\transcript_full.jsonl"

best_code = None
for line in open(log_path, "r", encoding="utf-8"):
    if "export function App" in line:
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                args = tc.get("args", {})
                code = args.get("CodeContent")
                if code and "export function App" in code:
                    if not best_code or len(code) > len(best_code):
                        best_code = code
        except Exception:
            pass

if best_code:
    with open(r"c:\Users\rithi\Downloads\working-prototype - Copy\dashboard\src\app.jsx", "w", encoding="utf-8") as f:
        f.write(best_code)
    print("Saved best app.jsx! Length:", len(best_code))
