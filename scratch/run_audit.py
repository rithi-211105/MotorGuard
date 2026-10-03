import os
import sys
import glob
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
DATASET_DIR = os.path.join(BASE_DIR, "Multi-Sensor Condition-Monitoring Dataset of a Bru")
EXCEL_PATH = os.path.join(BASE_DIR, "MotorsData_rev.xlsx")
METADATA_PATH = os.path.join(DATASET_DIR, "metadata.csv")

print("--- AUDIT SUMMARY ---")
df_meta = pd.read_csv(METADATA_PATH)
print(f"Total Metadata Rows: {len(df_meta)}")
print("Sensors:", df_meta['sensor'].value_counts().to_dict())
print("Formats:", df_meta['format'].value_counts().to_dict())
print("Conditions:", df_meta['condition'].value_counts().to_dict())
print("Speed Percents:", sorted([x for x in df_meta['speed_percent'].unique() if not np.isnan(x)]))

# Check XLS files sample
xls_files = glob.glob(os.path.join(DATASET_DIR, "**", "*.xls"), recursive=True)
print(f"Total XLS files: {len(xls_files)}")
if xls_files:
    df_x = pd.read_excel(xls_files[0])
    print(f"Sample XLS ({os.path.basename(xls_files[0])}) shape: {df_x.shape}")
    print("Sample XLS columns:", list(df_x.columns))
    print("Sample XLS data:\n", df_x.head(5))

