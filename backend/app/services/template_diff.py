"""
Compare two template schemas to detect changes.
"""


def compute_diff(old_schema: dict, new_schema: dict) -> dict:
    """Compare old and new template schemas and return differences."""
    column_changes = _diff_columns(old_schema["column_schema"], new_schema["column_schema"])
    validation_changes = _diff_validations(old_schema["validation_schema"], new_schema["validation_schema"])
    dropdown_changes = _diff_dropdowns(old_schema["dropdown_schema"], new_schema["dropdown_schema"])

    summary = []
    severity = "none"

    if column_changes["added"] or column_changes["removed"] or column_changes["renamed"]:
        severity = "major"
        if column_changes["added"]:
            summary.append(f"列追加: {len(column_changes['added'])}件")
        if column_changes["removed"]:
            summary.append(f"列削除: {len(column_changes['removed'])}件")
        if column_changes["renamed"]:
            summary.append(f"列名変更: {len(column_changes['renamed'])}件")

    if validation_changes["changed"]:
        if severity == "none":
            severity = "minor"
        summary.append(f"バリデーション変更: {len(validation_changes['changed'])}件")

    if dropdown_changes["added_values"] or dropdown_changes["removed_values"]:
        if severity == "none":
            severity = "minor"
        if dropdown_changes["added_values"]:
            summary.append(f"ドロップダウン値追加: {len(dropdown_changes['added_values'])}件")
        if dropdown_changes["removed_values"]:
            summary.append(f"ドロップダウン値削除: {len(dropdown_changes['removed_values'])}件")
            if severity == "minor":
                severity = "major"

    has_changes = severity != "none"

    return {
        "has_changes": has_changes,
        "severity": severity,
        "column_changes": column_changes,
        "validation_changes": validation_changes,
        "dropdown_changes": dropdown_changes,
        "summary": summary,
    }


def _diff_columns(old_cols: list, new_cols: list) -> dict:
    """Compare column schemas."""
    old_names = {c["technical_name"] for c in old_cols}
    new_names = {c["technical_name"] for c in new_cols}

    added = [c for c in new_cols if c["technical_name"] not in old_names]
    removed = [c for c in old_cols if c["technical_name"] not in new_names]

    # Detect possible renames (same position, different name)
    old_by_idx = {c["col_index"]: c for c in old_cols}
    new_by_idx = {c["col_index"]: c for c in new_cols}
    renamed = []
    for idx in set(old_by_idx.keys()) & set(new_by_idx.keys()):
        if old_by_idx[idx]["technical_name"] != new_by_idx[idx]["technical_name"]:
            renamed.append({
                "col_index": idx,
                "old_name": old_by_idx[idx]["technical_name"],
                "new_name": new_by_idx[idx]["technical_name"],
            })

    # Detect reordering
    old_order = [c["technical_name"] for c in old_cols]
    new_order = [c["technical_name"] for c in new_cols]
    common = [n for n in old_order if n in new_names]
    new_common = [n for n in new_order if n in old_names]
    reordered = common != new_common

    return {
        "added": added,
        "removed": removed,
        "renamed": renamed,
        "reordered": reordered,
    }


def _diff_validations(old_vals: list, new_vals: list) -> dict:
    """Compare validation schemas."""
    old_by_range = {v["ranges"]: v for v in old_vals}
    new_by_range = {v["ranges"]: v for v in new_vals}

    changed = []
    for range_key in set(old_by_range.keys()) | set(new_by_range.keys()):
        old_v = old_by_range.get(range_key)
        new_v = new_by_range.get(range_key)
        if old_v != new_v:
            changed.append({
                "range": range_key,
                "old": old_v,
                "new": new_v,
            })

    return {"changed": changed}


def _diff_dropdowns(old_dd: dict, new_dd: dict) -> dict:
    """Compare dropdown value schemas."""
    added_values = {}
    removed_values = {}

    all_keys = set(old_dd.keys()) | set(new_dd.keys())
    for key in all_keys:
        old_set = set(old_dd.get(key, []))
        new_set = set(new_dd.get(key, []))
        added = new_set - old_set
        removed = old_set - new_set
        if added:
            added_values[key] = list(added)
        if removed:
            removed_values[key] = list(removed)

    return {
        "added_values": added_values,
        "removed_values": removed_values,
    }
