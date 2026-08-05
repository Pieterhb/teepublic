import pandas as pd
import os

files = [
    'Landing_Page_Report_05.csv',
    'Master Database.csv',
    'Normalized Master Database.csv'
]

output_lines = []
output_lines.append("# Data Schema Analysis\n")

for file_name in files:
    try:
        if os.path.exists(file_name):
            df = pd.read_csv(file_name)
            output_lines.append(f"## {file_name}")
            output_lines.append(f"**Total Rows:** {len(df)}")
            output_lines.append("\n**Columns and Data Types:**")
            
            dtypes_df = df.dtypes.reset_index()
            dtypes_df.columns = ['Column Name', 'Data Type']
            output_lines.append(dtypes_df.to_markdown(index=False))
            
            output_lines.append("\n**First 3 Rows:**")
            output_lines.append(df.head(3).to_markdown(index=False))
            output_lines.append("\n---\n")
        else:
            output_lines.append(f"## {file_name}\nFile not found.\n---\n")
    except Exception as e:
        output_lines.append(f"## {file_name}\nError reading file: {e}\n---\n")

with open('DATA_SCHEMA.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))
