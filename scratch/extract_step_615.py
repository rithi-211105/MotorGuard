import json
import re

log_path = r"C:\Users\rithi\.gemini\antigravity-ide\brain\56ea7eb6-7958-4dc6-a10b-6244e3eeea7b\.system_generated\logs\transcript_full.jsonl"

for line in open(log_path, "r", encoding="utf-8"):
    if '"step_index":615,' in line:
        data = json.loads(line)
        content = data.get("content", "")
        clean_lines = []
        for l in content.split("\n"):
            m = re.match(r"^\s*\d+:\s?(.*)$", l)
            if m:
                clean_lines.append(m.group(1))
        code = "\n".join(clean_lines)
        with open(r"c:\Users\rithi\Downloads\working-prototype - Copy\dashboard\src\components\Common.jsx", "w", encoding="utf-8") as f:
            f.write("import React, { useState, useEffect, useRef } from 'react';\nimport Chart from 'chart.js/auto';\n" + code)
        print("Extracted step 615 Common.jsx! Length:", len(code))
        break
