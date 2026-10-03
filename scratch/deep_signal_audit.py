import os
import sys
import glob
import pandas as pd
import numpy as np
import scipy.io as io
from pathlib import Path
import struct
import wave
import soundfile as sf

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
DATASET_DIR = os.path.join(BASE_DIR, "Multi-Sensor Condition-Monitoring Dataset of a Bru")
EXCEL_PATH = os.path.join(BASE_DIR, "MotorsData_rev.xlsx")
METADATA_PATH = os.path.join(DATASET_DIR, "metadata.csv")

print("==================================================")
print("DEEP SIGNAL AUDIT & ANALYSIS")
print("==================================================")

xl = pd.ExcelFile(EXCEL_PATH)

# Summarize sample sheets in MotorsData_rev.xlsx
sample_sheets = ['StepNoLoad-MotorA', 'StepLoaded-MotorA', 'PRBS7-MotorA', 'Sine10Hz-MotorA']
print("\n--- MotorsData_rev.xlsx Sample Sheet Statistics ---")
for s in sample_sheets:
    if s in xl.sheet_names:
        df_raw = xl.parse(s)
        # Check if first row contains column headers
        header_idx = None
        for i in range(min(5, len(df_raw))):
            row_vals = [str(v).lower() for v in df_raw.iloc[i].values]
            if 'time' in row_vals or 'velocity' in row_vals or 'current' in row_vals:
                header_idx = i
                break
        
        if header_idx is not None:
            df_s = df_raw.iloc[header_idx+1:].copy()
            df_s.columns = df_raw.iloc[header_idx].values
        else:
            df_s = df_raw.copy()
        
        # Deduplicate column names
        df_s.columns = [str(c).strip() for c in df_s.columns]
        
        num_cols = ['time', 'encoderCount', 'Velocity', 'rawCurrent', 'Current', 'VoltageA1', 'VoltageB1', 'MotorVoltage', 'MotorStatus', 'PWM']
        valid_cols = []
        for c in num_cols:
            if c in df_s.columns:
                series = df_s[c]
                if isinstance(series, pd.DataFrame):
                    series = series.iloc[:, 0]
                df_s[c] = pd.to_numeric(series, errors='coerce')
                valid_cols.append(c)
        
        print(f"\nSheet '{s}' ({len(df_s)} rows):")
        cols_to_stat = [c for c in ['Velocity', 'Current', 'MotorVoltage', 'PWM'] if c in valid_cols]
        if cols_to_stat:
            stats = df_s[cols_to_stat].describe().T[['mean', 'std', 'min', '50%', 'max']]
            print(stats.to_string())

# 2. RAW BINARY (.BIN) FILE DECODING (Armature Current)
print("\n--- RAW .BIN FILE INSPECTION (Rigol Oscilloscope Armature Current) ---")
bin_files = glob.glob(os.path.join(DATASET_DIR, "**", "*.bin"), recursive=True)
print(f"Total .bin files found: {len(bin_files)}")

if bin_files:
    sample_bin = bin_files[0]
    rel_bin = os.path.relpath(sample_bin, DATASET_DIR)
    print(f"Sample .bin file: {rel_bin} (Size: {os.path.getsize(sample_bin)/(1024*1024):.2f} MB)")
    
    with open(sample_bin, 'rb') as f:
        full_bytes = f.read()
        print(f"Total bytes in file: {len(full_bytes)}")
        # Check header
        header = full_bytes[:100]
        print("Header (bytes 0..32):", header[:32])
        print("Header (ascii printable):", "".join([chr(b) if 32 <= b <= 126 else '.' for b in header[:64]]))
        
        # In Rigol WFM / BIN format or binary data stream:
        # Let's inspect uint8 samples
        arr_u8 = np.frombuffer(full_bytes, dtype=np.uint8)
        print(f"Raw uint8 stats: min={arr_u8.min()}, max={arr_u8.max()}, mean={arr_u8.mean():.2f}, std={arr_u8.std():.2f}")
        
        # Rigol Scope binary waveforms typically store 8-bit ADC samples with header
        # Let's check metadata.csv for this file's sample_rate and duration!
        df_meta = pd.read_csv(METADATA_PATH)
        fname = os.path.basename(sample_bin)
        meta_match = df_meta[df_meta['new_path'].str.contains(fname, na=False)]
        if not meta_match.empty:
            mrow = meta_match.iloc[0]
            print(f"Metadata match -> condition: {mrow['condition']}, speed: {mrow['speed_percent']}%, Fs: {mrow['sample_rate_hz']} Hz, duration: {mrow['duration_s']} s")

# 3. RAW WAV FILE INSPECTION (AV-160B Vibrometer Analog Output)
print("\n--- RAW .WAV FILE INSPECTION (AV-160B Vibrometer Analog Output) ---")
df_meta = pd.read_csv(METADATA_PATH)
wav_meta = df_meta[df_meta['sensor'] == 'sound_vibrometer']
print(f"WAV entries in metadata: {len(wav_meta)}")

for cond in wav_meta['condition'].dropna().unique():
    cond_rows = wav_meta[wav_meta['condition'] == cond]
    sample_row = cond_rows.iloc[0]
    wpath = os.path.join(DATASET_DIR, sample_row['new_path'])
    if os.path.exists(wpath):
        data, fs = sf.read(wpath)
        dur = len(data) / fs
        ch0 = data[:, 0] if data.ndim > 1 else data
        
        mean_val = np.mean(ch0)
        rms_val = np.sqrt(np.mean(ch0**2))
        std_val = np.std(ch0)
        peak_val = np.max(np.abs(ch0))
        p2p_val = np.ptp(ch0)
        kurt_val = float(pd.Series(ch0).kurtosis())
        skew_val = float(pd.Series(ch0).skew())
        crest_factor = peak_val / (rms_val + 1e-9)
        
        print(f"\nCondition: '{cond}' | Speed: {sample_row['speed_percent']}%")
        print(f" File: {sample_row['new_path']}")
        print(f" Fs: {fs} Hz, Duration: {dur:.2f} s, Channels: {data.ndim}")
        print(f" Signal Stats -> Mean: {mean_val:.6f}, RMS: {rms_val:.6f}, Peak: {peak_val:.6f}, P2P: {p2p_val:.6f}, Kurtosis: {kurt_val:.2f}, Skew: {skew_val:.2f}, Crest Factor: {crest_factor:.2f}")

# 4. RAW XLS FILE INSPECTION (Vibrometer Spot Readings)
print("\n--- RAW .XLS FILE INSPECTION (Vibrometer Spot Readings) ---")
xls_meta = df_meta[df_meta['sensor'] == 'vibration']
print(f"XLS entries in metadata: {len(xls_meta)}")
if not xls_meta.empty:
    sample_row = xls_meta.iloc[0]
    xpath = os.path.join(DATASET_DIR, sample_row['new_path'])
    if os.path.exists(xpath):
        print(f"Inspecting sample XLS file: {sample_row['new_path']}")
        df_x = pd.read_excel(xpath)
        print(f"Shape: {df_x.shape}")
        print("Columns:", list(df_x.columns))
        print("Content:")
        print(df_x.head(10).to_string())

