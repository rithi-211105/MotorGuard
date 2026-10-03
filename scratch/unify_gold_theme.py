import glob
import re

color_replacements = {
    # Hardcoded blues/cyans/purples to gold
    r"#2563eb": "#fbbf24",
    r"#3b82f6": "#fbbf24",
    r"#1d4ed8": "#d97706",
    r"#06b6d4": "#f59e0b",
    r"#0891b2": "#d97706",
    r"#6366f1": "#fbbf24",
    r"#818cf8": "#fde047",
    r"#8b5cf6": "#f59e0b",
    
    # CSS variables for legacy color names mapped to gold tokens
    r"var\(--indigo-primary\)": "var(--gold-primary)",
    r"var\(--indigo-secondary\)": "var(--gold-secondary)",
    r"var\(--indigo-light\)": "var(--gold-light)",
    r"var\(--indigo-border\)": "var(--gold-border)",
    r"var\(--indigo-text\)": "var(--gold-text)",
    r"var\(--indigo\)": "var(--gold-primary)",
    
    r"var\(--cyan-primary\)": "var(--gold-primary)",
    r"var\(--cyan-secondary\)": "var(--gold-secondary)",
    r"var\(--cyan-light\)": "var(--gold-light)",
    r"var\(--cyan-border\)": "var(--gold-border)",
    r"var\(--cyan-text\)": "var(--gold-text)",
    r"var\(--cyan\)": "var(--gold-primary)",
    
    r"var\(--purple-primary\)": "var(--gold-primary)",
    r"var\(--purple-light\)": "var(--gold-light)",
    r"var\(--purple-border\)": "var(--gold-border)",
    r"var\(--purple\)": "var(--gold-primary)",
    
    # Clean background fallbacks
    r"#f8fafc": "#181820",
    r"#f1f5f9": "#181820",
}

for file_path in glob.glob("dashboard/src/**/*.{jsx,js,css}", recursive=True):
    content = open(file_path, "r", encoding="utf-8").read()
    modified = content
    for pattern, repl in color_replacements.items():
        modified = re.sub(pattern, repl, modified)
    
    if modified != content:
        with open(file_path, "w", encoding="utf-8") as out:
            out.write(modified)
        print(f"Cleaned colors in {file_path}")

print("Theme unification complete.")
