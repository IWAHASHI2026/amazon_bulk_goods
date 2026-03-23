"""
Build Excel rows from product parent + variation data.
"""


def build_rows(product, column_schema: list[dict]) -> list[dict]:
    """
    Build a list of row dicts (technical_name -> value) for the product.
    First row is the parent, subsequent rows are child variations.
    """
    rows = []

    # Parent row
    parent_row = dict(product.parent_data)
    parent_row["parent_child"] = "parent" if product.variations else ""
    if product.parent_sku:
        parent_row["item_sku"] = product.parent_sku
    if product.variation_theme:
        parent_row["variation_theme"] = product.variation_theme
    rows.append(parent_row)

    # Child rows
    for variation in sorted(product.variations, key=lambda v: v.sort_order):
        child_row = {}
        # Inherit parent data for shared fields
        for key, value in product.parent_data.items():
            child_row[key] = value
        # Override with child-specific data
        for key, value in variation.child_data.items():
            child_row[key] = value
        child_row["parent_child"] = "child"
        child_row["parent_sku"] = product.parent_sku
        if variation.child_sku:
            child_row["item_sku"] = variation.child_sku
        if product.variation_theme:
            child_row["variation_theme"] = product.variation_theme
        rows.append(child_row)

    return rows
