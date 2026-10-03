import os
import sys
import glob
import pandas as pd
import numpy as np
import scipy.io as io
from pathlib import Path
import struct
import wave

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
DATASET_DIR = os.path.join(BASE_DIR, "Multi-Sensor Condition-Monitoring Dataset of a Bru")
EXCEL_PATH = os.path.join(BASE_DIR, "MotorsData_rev.xlsx")
METADATA_PATH = os.path.join(DATASET_DIR, "metadata.csv")

print("==================================================")
print("COMPREHENSIVE DATASET AUDIT & INVENTORY")
print("==================================================")

# 1. PHYSICAL FILE INVENTORY
all_files = []
for root, dirs, files in os.walk(DATASET_DIR):
    for f in files:
        full_p = os.path.join(root, f)
        rel_p = os.path.relpath(full_p, DATASET_DIR)
        ext = os.path.splitext(f)[1].lower()
        size = os.path.getsize(full_p)
        all_files.append({
            'full_path': full_p,
            'rel_path': rel_p,
            'filename': f,
            'extension': ext,
            'size_bytes': size,
            'size_mb': round(size / (1024*1024), 4)
        })

df_files = pd.DataFrame(all_files)
print(f"\n--- 1. PHYSICAL FILE INVENTORY ---")
print(f"Total physical files inside dataset folder: {len(df_files)}")
ext_summary = df_files.groupby('extension').agg(
    count=('filename', 'count'),
    total_size_mb=('size_bytes', lambda x: round(x.sum() / (1024*1024), 2)),
    min_size_mb=('size_bytes', lambda x: round(x.min() / (1024*1024), 4)),
    max_size_mb=('size_bytes', lambda x: round(x.max() / (1024*1024), 4))
)
print(ext_summary)

# 2. METADATA.CSV AUDIT
df_meta = None
if os.path.exists(METADATA_PATH):
    print("\n--- 2. METADATA.CSV AUDIT ---")
    df_meta = pd.read_csv(METADATA_PATH)
    print(f"Metadata Rows: {len(df_meta)}, Columns: {len(df_meta.columns)}")
    print("Metadata Columns:", list(df_meta.columns))
    print("\nUnique values per column:")
    for col in df_meta.columns:
        unq = df_meta[col].nunique()
        print(f"  {col}: {unq} unique values")
        if unq <= 15:
            print(f"    Values: {df_meta[col].unique()}")

    print("\nCross-tabulation of Sensor vs Format:")
    print(pd.crosstab(df_meta['sensor'], df_meta['format'], margins=True))

    print("\nCross-tabulation of Condition vs Operation:")
    print(pd.crosstab(df_meta['condition'], df_meta['operation'], margins=True))

    print("\nCross-tabulation of Sensor vs Condition:")
    print(pd.crosstab(df_meta['sensor'], df_meta['condition'], margins=True))

# 3. EXCEL WORKBOOK AUDIT (MotorsData_rev.xlsx)
if os.path.exists(EXCEL_PATH):
    print("\n--- 3. MOTORS DATA EXCEL AUDIT (MotorsData_rev.xlsx) ---")
    try:
        xl = pd.ExcelFile(EXCEL_PATH)
        print(f"Worksheets found ({len(xl.sheet_names)}): {xl.sheet_names}")
        for sname in xl.sheet_names:
            df_s = xl.parse(sname)
            print(f"\nSheet '{sname}': {df_s.shape[0]} rows, {df_s.shape[1]} columns")
            print(f"Columns: {list(df_s.columns)}")
            print("Head 3:")
            print(df_s.head(3).to_string())
            print("Describe:")
            print(df_s.describe().to_string())
    except Exception as e:
        print(f"Error reading Excel file: {e}")

# 4. CROSS-REFERENCING METADATA TO PHYSICAL FILES
if df_meta is not None:
    print("\n--- 4. METADATA TO PHYSICAL FILE MAPPING ---")
    phys_rel_set = set(df_files['rel_path'].str.replace('\\', '/'))
    phys_name_set = set(df_files['filename'])
    
    # Check new_path
    meta_paths = df_meta['new_path'].dropna().astype(str).str.replace('\\', '/')
    exact_matches = [p for p in meta_paths if p in phys_rel_set or os.path.basename(p) in phys_name_set]
    missing_paths = [p for p in meta_paths if p not in phys_rel_set and os.path.basename(p) not in phys_name_set]
    print(f"Total rows in metadata: {len(df_meta)}")
    print(f"Physical files matched: {len(exact_matches)}")
    print(f"Metadata entries missing physical file: {len(missing_paths)}")
    if missing_paths:
        print(f"Sample missing metadata paths: {missing_paths[:5]}")

    # Check unreferenced physical files
    meta_basenames = set(df_meta['new_path'].dropna().astype(str).apply(os.path.basename))
    unref_files = df_files[~df_files['filename'].isin(meta_basenames)]
    print(f"Physical files NOT referenced in metadata: {len(unref_files)}")
    if not unref_files.empty:
        print("Unreferenced files:")
        print(unref_files[['filename', 'rel_path', 'size_mb']].to_string())

# 5. README / TEXT FILE INSPECTION
print("\n--- 5. DOCUMENTATION / TEXT FILE INSPECTION ---")
txt_md_files = df_files[df_files['extension'].isin(['.txt', '.md'])]
for idx, row in txt_md_files.iterrows():
    print(f"\nFile: {row['rel_path']} ({row['size_bytes']} bytes)")
    try:
        with open(row['full_path'], 'r', encoding='utf-8', errors='ignore') as tf:
            lines = tf.readlines()
            print(f"  Total lines: {len(lines)}")
            print("--- Content Begin ---")
            for l in lines[:30]:
                print(l.rstrip())
            print("--- Content End ---")
    except Exception as e:
        print(f"  Error reading: {e}")

