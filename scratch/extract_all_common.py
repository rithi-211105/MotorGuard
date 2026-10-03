import json
import re

log_path = r"C:\Users\rithi\.gemini\antigravity-ide\brain\56ea7eb6-7958-4dc6-a10b-6244e3eeea7b\.system_generated\logs\transcript_full.jsonl"

all_chunks = {}

for line in open(log_path, "r", encoding="utf-8"):
    if "Common.js" in line or "Common.jsx" in line:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if "IconActivity" in content or "LiveChart" in content:
                for l in content.split("\n"):
                    m = re.match(r"^\s*(\d+):\s?(.*)$", l)
                    if m:
                        line_num = int(m.group(1))
                        line_text = m.group(2)
                        all_chunks[line_num] = line_text
        except Exception:
            pass

print(f"Collected {len(all_chunks)} unique line numbers for Common.jsx")

if all_chunks:
    max_line = max(all_chunks.keys())
    full_lines = ["import React, { useState, useEffect, useRef } from 'react';", "import Chart from 'chart.js/auto';"]
    for i in range(1, max_line + 1):
        if i in all_chunks:
            l_text = all_chunks[i]
            if l_text.startswith("const { useState"):
                continue
            full_lines.append(l_text)
    
    code = "\n".join(full_lines)
    with open(r"c:\Users\rithi\Downloads\working-prototype - Copy\dashboard\src\components\Common.jsx", "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Reconstructed Common.jsx! Total lines: {len(full_lines)}, Bytes: {len(code)}")
