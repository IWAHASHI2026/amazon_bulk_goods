export interface TemplateVersion {
  id: number;
  version_label: string;
  uploaded_at: string;
  is_active: boolean;
  schema_hash: string;
}

export interface TemplateVersionDetail extends TemplateVersion {
  column_schema: ColumnDef[];
  validation_schema: ValidationRule[];
  dropdown_schema: Record<string, string[]>;
  defined_names_schema: DefinedName[];
}

export interface ColumnDef {
  col_index: number;
  group_name: string | null;
  display_name: string | null;
  technical_name: string;
  sample_value: string | null;
}

export interface ValidationRule {
  ranges: string;
  type: string;
  formula1: string | null;
  formula2: string | null;
  allow_blank: boolean;
  error_message: string | null;
}

export interface DefinedName {
  name: string;
  value: string | null;
  destinations: { sheet: string; range: string }[];
}

export interface TemplateDiff {
  has_changes: boolean;
  severity: "none" | "minor" | "major";
  column_changes: {
    added: ColumnDef[];
    removed: ColumnDef[];
    renamed: { col_index: number; old_name: string; new_name: string }[];
    reordered: boolean;
  };
  validation_changes: {
    changed: { range: string; old: ValidationRule | null; new: ValidationRule | null }[];
  };
  dropdown_changes: {
    added_values: Record<string, string[]>;
    removed_values: Record<string, string[]>;
  };
  summary: string[];
}

export interface Product {
  id: number;
  name: string;
  status: string;
  template_version_id: number | null;
  parent_sku: string | null;
  parent_data: Record<string, any>;
  variation_theme: string | null;
  created_at: string;
  updated_at: string;
  variations: ProductVariation[];
}

export interface ProductListItem {
  id: number;
  name: string;
  status: string;
  parent_sku: string | null;
  variation_theme: string | null;
  variation_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariation {
  id: number;
  sort_order: number;
  child_sku: string | null;
  child_data: Record<string, any>;
}

export interface ProductPreview {
  columns: string[];
  rows: Record<string, any>[];
  warnings: TemplateDiff | null;
}

export interface DraftSheetUploadResult {
  product_id: number;
  product_name: string;
  parent_sku: string | null;
  variation_count: number;
  warnings: string[];
}
