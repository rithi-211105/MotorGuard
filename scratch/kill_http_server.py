import subprocess
import re

try:
    out = subprocess.check_output("wmic process where \"name='python.exe'\" get processid,commandline", shell=True).decode()
    for line in out.splitlines():
        if "http.server" in line:
            parts = line.strip().split()
            pid = parts[-1]
            if pid.isdigit():
                subprocess.call(f"taskkill /F /PID {pid}", shell=True)
                print(f"Killed http.server process PID {pid}")
except Exception as e:
    print("Error killing processes:", e)
