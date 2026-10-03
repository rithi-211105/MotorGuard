import json

log_path = r"C:\Users\rithi\.gemini\antigravity-ide\brain\56ea7eb6-7958-4dc6-a10b-6244e3eeea7b\.system_generated/logs/transcript_full.jsonl"

best_common = ""

for line in open(log_path, "r", encoding="utf-8"):
    if "export function IconActivity" in line and "export function LiveChart" in line:
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                args = tc.get("args", {})
                code = args.get("CodeContent") or args.get("ReplacementContent")
                if code and "export function IconActivity" in code and "export function LiveChart" in code:
                    if len(code) > len(best_common):
                        best_common = code
        except Exception:
            pass

if best_common:
    with open(r"c:\Users\rithi\Downloads\working-prototype - Copy\dashboard\src\components\Common.jsx", "w", encoding="utf-8") as f:
        f.write(best_common)
    print("Saved exact Common.jsx! Length:", len(best_common))
else:
    print("Not found in tool calls, searching all lines...")
