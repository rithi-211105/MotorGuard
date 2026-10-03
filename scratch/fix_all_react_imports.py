import glob
import re

for f in glob.glob("dashboard/src/**/*.jsx", recursive=True):
    content = open(f, "r", encoding="utf-8").read()
    
    # Remove lines like const { useState } = React;
    content = re.sub(r"const\s+\{\s*([^}]+)\s*\}\s*=\s*React;\s*", "", content)
    
    # Ensure proper top-level React import
    if "import React" not in content and "from 'react'" not in content:
        content = "import React, { useState, useEffect, useCallback, useRef } from 'react';\n" + content
    elif "import React" in content and "from 'react'" not in content:
        content = content.replace("import React", "import React, { useState, useEffect, useCallback, useRef } from 'react'")
        
    with open(f, "w", encoding="utf-8") as out:
        out.write(content)

print("Fixed all React imports across dashboard/src/**/*.jsx!")
