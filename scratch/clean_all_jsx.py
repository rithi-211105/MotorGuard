import glob

for f in glob.glob("dashboard/src/**/*.jsx", recursive=True):
    content = open(f, "r", encoding="utf-8").read()
    # Strip any appended tool output lines
    clean_lines = []
    for line in content.split("\n"):
        if "The above content" in line or "The following code has been modified" in line:
            break
        clean_lines.append(line)
    
    clean_code = "\n".join(clean_lines)
    clean_code = clean_code.replace("Common.js", "Common.jsx").replace("ConceptDashboard.js", "ConceptDashboard.jsx").replace("app.js", "app.jsx")
    
    with open(f, "w", encoding="utf-8") as out:
        out.write(clean_code)

print("Cleaned all JSX files successfully.")
