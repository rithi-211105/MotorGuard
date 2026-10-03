import os
import sys
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"c:\Users\rithi\Downloads\working-prototype - Copy (6)\working-prototype - Copy"
EXCEL_PATH = os.path.join(BASE_DIR, "MotorsData_rev.xlsx")

xl = pd.ExcelFile(EXCEL_PATH)
print("Sheet Names:", xl.sheet_names)

for sheet in xl.sheet_names:
    df = xl.parse(sheet)
    print(f"\n==========================================")
    print(f"SHEET: {sheet}")
    print(f"Shape: {df.shape[0]} rows x {df.shape[1]} cols")
    print("Columns:", list(df.columns))
    print("\nHead 5:")
    print(df.head(5).to_string())
    print("\nData Types:")
    print(df.dtypes)
    print("\nNull Counts:")
    print(df.isnull().sum())
    print("\nDuplicate Rows:", df.duplicated().sum())

