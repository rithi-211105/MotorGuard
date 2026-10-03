import json

log_path = r"C:\Users\rithi\.gemini\antigravity-ide\brain\56ea7eb6-7958-4dc6-a10b-6244e3eeea7b\.system_generated/logs/transcript_full.jsonl"

all_matches = []

for idx, line in enumerate(open(log_path, "r", encoding="utf-8")):
    if "Common.js" in line and "CodeContent" in line:
        try:
            data = json.loads(line)
            for tc in data.get("tool_calls", []):
                args = tc.get("args", {})
                if "Common.js" in args.get("TargetFile", ""):
                    code = args.get("CodeContent")
                    if code:
                        all_matches.append((idx, len(code), code))
        except Exception:
            pass

print(f"Found {len(all_matches)} matches for Common.js in tool calls")
if all_matches:
    all_matches.sort(key=lambda x: x[1], reverse=True)
    best = all_matches[0]
    print(f"Best match at line {best[0]}, length: {best[1]}")
    with open(r"c:\Users\rithi\Downloads\working-prototype - Copy\dashboard\src\components\Common.jsx", "w", encoding="utf-8") as f:
        f.write(best[2])
