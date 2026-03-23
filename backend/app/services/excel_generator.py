"""
Generate Amazon-compatible Excel files by writing product data into the template.
"""
import openpyxl
from io import BytesIO


def generate_excel(template_file: bytes, rows: list[dict], column_schema: list[dict]) -> bytes:
    """
    Generate an xlsx file by writing product data rows into the template.

    Args:
        template_file: The original xlsm template file bytes
        rows: List of dicts mapping technical_name -> value
        column_schema: Column schema from template_versions

    Returns:
        Excel file bytes (.xlsx format)
    """
    wb = openpyxl.load_workbook(BytesIO(template_file), keep_vba=False)
    ws = wb["テンプレート"]

    # Build technical_name -> column index mapping
    col_map = {col["technical_name"]: col["col_index"] for col in column_schema}

    # Write data starting from row 7
    for row_offset, row_data in enumerate(rows):
        excel_row = 7 + row_offset
        for tech_name, value in row_data.items():
            col_idx = col_map.get(tech_name)
            if col_idx and value is not None:
                ws.cell(row=excel_row, column=col_idx, value=value)

    # Save as xlsx
    output = BytesIO()
    wb.save(output)
    wb.close()
    output.seek(0)
    return output.read()
