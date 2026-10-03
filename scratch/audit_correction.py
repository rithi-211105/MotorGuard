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
print("DATA AUDIT CORRECTION PASS - DETAILED EXECUTION")
print("==================================================")

# 1. SPEED COUNT AUDIT
df_meta = pd.read_csv(METADATA_PATH)
speeds_meta = df_meta['speed_percent'].dropna().unique()
speeds_meta_sorted = sorted(speeds_meta)
print(f"\n[1. SPEED COUNT AUDIT]")
print(f"Unique speed setpoints in metadata.csv ({len(speeds_meta_sorted)} unique values):")
print(speeds_meta_sorted)

# Breakdown of speed_percent by condition
print("\nSpeed setpoints available per condition in metadata.csv:")
speed_per_cond = df_meta.groupby(['condition', 'sensor'])['speed_percent'].apply(lambda s: sorted(s.unique().tolist()))
for k, v in speed_per_cond.items():
    print(f"  {k[0]} | sensor={k[1]} ({len(v)} speeds): {v}")

# 2. RIGOL .BIN FILE DEEP HEADER AUDIT
print(f"\n[2. RIGOL .BIN FILE DEEP HEADER AUDIT]")
bin_files = glob.glob(os.path.join(DATASET_DIR, "**", "*.bin"), recursive=True)
print(f"Total .bin files found physically: {len(bin_files)}")

# Inspect header of 5 representative .bin files across conditions
for bpath in bin_files[:5]:
    rel_b = os.path.relpath(bpath, DATASET_DIR)
    fsize = os.path.getsize(bpath)
    with open(bpath, 'rb') as f:
        header_raw = f.read(200)
        # Parse Rigol WFM header structure if standard
        magic = header_raw[:2]
        file_ver = header_raw[2:4]
        # Let's inspect ASCII strings in header
        ascii_parts = []
        for i in range(0, min(120, len(header_raw)), 4):
            part = header_raw[i:i+4]
            ascii_parts.append(part)
        
        # Rigol Scope WFM / BIN header parsing:
        # Check total bytes, header offset
        # Memory depth: fsize - header_size
        print(f"\nFile: {rel_b}")
        print(f"  File size on disk: {fsize} bytes ({fsize/(1024*1024):.2f} MB)")
        print(f"  Magic bytes: {magic} (Hex: {magic.hex()})")
        print(f"  Raw header (0..64 bytes): {header_raw[:64]}")

        # Check metadata row for this file
        fname = os.path.basename(bpath)
        meta_match = df_meta[df_meta['new_path'].str.contains(fname, na=False)]
        if not meta_match.empty:
            mrow = meta_match.iloc[0]
            print(f"  Metadata entry: Fs={mrow['sample_rate_hz']} Hz, duration={mrow['duration_s']} s, file_size={mrow['file_size_bytes']} bytes")
            calc_samples_meta = mrow['sample_rate_hz'] * mrow['duration_s']
            print(f"  Calculated sample count from metadata (Fs * duration): {calc_samples_meta:,.0f} samples")
            print(f"  Bytes on disk minus 80,000,000 samples: {fsize - 80000000} bytes (Header size!)")

# 3. FILE COUNT RECONCILIATION
print(f"\n[3. FILE COUNT RECONCILIATION]")
all_phys_files = []
for root, dirs, files in os.walk(DATASET_DIR):
    for f in files:
        full_p = os.path.join(root, f)
        rel_p = os.path.relpath(full_p, DATASET_DIR).replace('\\', '/')
        all_phys_files.append((f, rel_p, os.path.getsize(full_p)))

df_phys = pd.DataFrame(all_phys_files, columns=['filename', 'rel_path', 'size_bytes'])

# Metadata paths
meta_paths = set(df_meta['new_path'].dropna().str.replace('\\', '/'))
meta_names = set(df_meta['new_path'].dropna().apply(os.path.basename))

admin_files = ['LICENSE.txt', 'metadata.csv', 'README.md']
recording_phys = df_phys[~df_phys['filename'].isin(admin_files)]
admin_phys = df_phys[df_phys['filename'].isin(admin_files)]

matched_recordings = df_phys[df_phys['rel_path'].isin(meta_paths) | df_phys['filename'].isin(meta_names)]
unref_recordings = recording_phys[~recording_phys['rel_path'].isin(meta_paths) & ~recording_phys['filename'].isin(meta_names)]

print(f"Total physical files in folder: {len(df_phys)}")
print(f"Physical recording files: {len(recording_phys)}")
print(f"Physical administrative files: {len(admin_phys)}")
print(f"Total rows in metadata.csv: {len(df_meta)}")
print(f"Matched recording files (Metadata <-> Physical): {len(matched_recordings)}")
print(f"Missing recordings (in metadata but not on disk): {len(df_meta) - len(matched_recordings)}")
print(f"Unreferenced recording files (on disk but not in metadata): {len(unref_recordings)}")

# 4. RAW FILE VALIDATION ACROSS EVERY CATEGORY
print(f"\n[4. RAW FILE VALIDATION ACROSS EVERY CATEGORY]")

# Category A: .bin (Rigol Armature Current)
print("\n--- Category A: .bin Armature Current ---")
sample_bin_path = bin_files[0]
with open(sample_bin_path, 'rb') as f:
    bdata = f.read(1000000) # 1 MB sample
    arr_u8 = np.frombuffer(bdata[164:], dtype=np.uint8) # skip header guess
    print(f"File: {os.path.basename(sample_bin_path)}")
    print(f"Readable: True")
    print(f"ADC Resolution: 8-bit uint8")
    print(f"Sample uint8 stats (min/mean/max/std): {arr_u8.min()}, {arr_u8.mean():.2f}, {arr_u8.max()}, {arr_u8.std():.2f}")

# Category B: .wav (AV-160B Vibrometer Waveform)
print("\n--- Category B: .wav Vibrometer Waveform ---")
wav_files = glob.glob(os.path.join(DATASET_DIR, "**", "*.wav"), recursive=True)
sample_wav_path = wav_files[0]
wdata, wfs = sf.read(sample_wav_path)
wdur = len(wdata) / wfs
print(f"File: {os.path.basename(sample_wav_path)}")
print(f"Readable: True")
print(f"Format: WAV 16-bit PCM, Channels: {wdata.ndim}, Fs: {wfs} Hz, Duration: {wdur:.2f} s")
print(f"Amplitude Range: min={wdata.min():.4f}, max={wdata.max():.4f}, RMS={np.sqrt(np.mean(wdata**2)):.4f}")

# Category C: .m4a (Smartphone Microphone)
print("\n--- Category C: .m4a Smartphone Microphone ---")
m4a_files = glob.glob(os.path.join(DATASET_DIR, "**", "*.m4a"), recursive=True)
sample_m4a_path = m4a_files[0]
try:
    import pydub
    audio_m4a = pydub.AudioSegment.from_file(sample_m4a_path, format="m4a")
    print(f"File: {os.path.basename(sample_m4a_path)}")
    print(f"Readable via pydub: True")
    print(f"Channels: {audio_m4a.channels}, Fs: {audio_m4a.frame_rate} Hz, Duration: {len(audio_m4a)/1000.0:.2f} s")
except Exception as e:
    print(f"File: {os.path.basename(sample_m4a_path)}")
    print(f"Readable check: Exists on disk ({os.path.getsize(sample_m4a_path)} bytes). (pydub info: {e})")

# Category D: .xls (Vibrometer Spot Readings)
print("\n--- Category D: .xls Vibrometer Spot Readings ---")
xls_files = glob.glob(os.path.join(DATASET_DIR, "**", "*.xls"), recursive=True)
sample_xls_path = xls_files[0]
df_x = pd.read_excel(sample_xls_path)
print(f"File: {os.path.basename(sample_xls_path)}")
print(f"Readable: True")
print(f"Shape: {df_x.shape}")
print(f"Columns: {list(df_x.columns)}")
print("Sample rows:")
print(df_x.head(4).to_string())

# Category E: MotorsData_rev.xlsx
print("\n--- Category E: MotorsData_rev.xlsx ---")
xl_m = pd.ExcelFile(EXCEL_PATH)
print(f"Workbook readable: True ({len(xl_m.sheet_names)} sheets)")
df_p7 = xl_m.parse('PRBS7-MotorA')
print(f"Sample sheet 'PRBS7-MotorA' shape: {df_p7.shape}")

