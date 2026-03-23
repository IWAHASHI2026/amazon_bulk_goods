"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createProduct,
  updateProduct,
  getActiveTemplate,
  bulkAddVariations,
  exportProduct,
  previewProduct,
} from "@/lib/api";
import type { TemplateVersionDetail, ColumnDef } from "@/lib/types";

const VARIATION_THEMES = [
  "SizeName",
  "ColorName",
  "SizeName-ColorName",
  "ColorName-SizeName",
  "StyleName",
  "SizeName-StyleName",
  "MaterialType",
  "PatternName",
];

interface WizardData {
  // Step 1
  name: string;
  parent_sku: string;
  brand_name: string;
  item_name: string;
  product_description: string;
  bullet_point1: string;
  bullet_point2: string;
  bullet_point3: string;
  bullet_point4: string;
  bullet_point5: string;
  product_id_type: string;
  product_id: string;
  country_of_origin: string;
  hazmat_type: string;
  // Step 2
  variation_theme: string;
  // Step 3 - dynamic from template
  common_data: Record<string, string>;
  // Step 4 - variations
  variations: {
    child_sku: string;
    child_data: Record<string, string>;
  }[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<TemplateVersionDetail | null>(null);
  const [data, setData] = useState<WizardData>({
    name: "",
    parent_sku: "",
    brand_name: "",
    item_name: "",
    product_description: "",
    bullet_point1: "",
    bullet_point2: "",
    bullet_point3: "",
    bullet_point4: "",
    bullet_point5: "",
    product_id_type: "",
    product_id: "",
    country_of_origin: "",
    hazmat_type: "",
    variation_theme: "",
    common_data: {},
    variations: [],
  });
  const [productId, setProductId] = useState<number | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getActiveTemplate()
      .then(setTemplate)
      .catch(() => {});
  }, []);

  const updateField = (field: keyof WizardData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parentData: Record<string, string> = {
        brand_name: data.brand_name,
        item_name: data.item_name,
        product_description: data.product_description,
        bullet_point1: data.bullet_point1,
        bullet_point2: data.bullet_point2,
        bullet_point3: data.bullet_point3,
        bullet_point4: data.bullet_point4,
        bullet_point5: data.bullet_point5,
        external_product_id_type: data.product_id_type,
        external_product_id: data.product_id,
        country_of_origin: data.country_of_origin,
        ghs_classification_class1: data.hazmat_type,
        ...data.common_data,
      };

      if (productId) {
        await updateProduct(productId, {
          name: data.name,
          parent_sku: data.parent_sku,
          parent_data: parentData,
          variation_theme: data.variation_theme,
        });
      } else {
        const product = await createProduct({
          name: data.name,
          parent_sku: data.parent_sku,
          parent_data: parentData,
          variation_theme: data.variation_theme,
        });
        setProductId(product.id);

        if (data.variations.length > 0) {
          await bulkAddVariations(
            product.id,
            data.variations.map((v, i) => ({
              sort_order: i,
              child_sku: v.child_sku,
              child_data: v.child_data,
            }))
          );
        }
      }
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!productId) {
      await handleSave();
    }
    if (productId) {
      const result = await previewProduct(productId);
      setPreview(result);
    }
  };

  const handleExport = async () => {
    if (!productId) return;
    const blob = await exportProduct(productId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amazon_upload_${data.parent_sku || data.name}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addVariation = () => {
    setData((prev) => ({
      ...prev,
      variations: [
        ...prev.variations,
        { child_sku: "", child_data: {} },
      ],
    }));
  };

  const updateVariation = (index: number, field: string, value: string) => {
    setData((prev) => {
      const variations = [...prev.variations];
      if (field === "child_sku") {
        variations[index] = { ...variations[index], child_sku: value };
      } else {
        variations[index] = {
          ...variations[index],
          child_data: { ...variations[index].child_data, [field]: value },
        };
      }
      return { ...prev, variations };
    });
  };

  const removeVariation = (index: number) => {
    setData((prev) => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  // Group columns by group_name for step 3
  const columnGroups: Record<string, ColumnDef[]> = {};
  if (template) {
    for (const col of template.column_schema) {
      const group = col.group_name || "その他";
      if (!columnGroups[group]) columnGroups[group] = [];
      columnGroups[group].push(col);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">新規商品登録</h1>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Badge
              key={s}
              variant={s === step ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setStep(s)}
            >
              Step {s}
            </Badge>
          ))}
        </div>
      </div>

      {!template && (
        <Card>
          <CardContent className="py-6">
            <p className="text-amber-600">
              テンプレートがアップロードされていません。先にテンプレート管理画面からアップロードしてください。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: 基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>商品名（管理用）</Label>
                <Input
                  value={data.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="社内管理用の商品名"
                />
              </div>
              <div>
                <Label>親SKU</Label>
                <Input
                  value={data.parent_sku}
                  onChange={(e) => updateField("parent_sku", e.target.value)}
                  placeholder="例: SIGN-001"
                />
              </div>
            </div>
            <div>
              <Label>ブランド名</Label>
              <Input
                value={data.brand_name}
                onChange={(e) => updateField("brand_name", e.target.value)}
              />
            </div>
            <div>
              <Label>商品名（Amazon表示）</Label>
              <Input
                value={data.item_name}
                onChange={(e) => updateField("item_name", e.target.value)}
              />
            </div>
            <div>
              <Label>商品説明</Label>
              <Textarea
                value={data.product_description}
                onChange={(e) => updateField("product_description", e.target.value)}
                rows={3}
              />
            </div>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n}>
                <Label>仕様 {n}</Label>
                <Input
                  value={(data as any)[`bullet_point${n}`]}
                  onChange={(e) =>
                    updateField(`bullet_point${n}` as keyof WizardData, e.target.value)
                  }
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>商品IDタイプ</Label>
                <Input
                  value={data.product_id_type}
                  onChange={(e) => updateField("product_id_type", e.target.value)}
                  placeholder="例: EAN, UPC, JAN"
                />
              </div>
              <div>
                <Label>商品ID</Label>
                <Input
                  value={data.product_id}
                  onChange={(e) => updateField("product_id", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>原産国</Label>
                <Input
                  value={data.country_of_origin}
                  onChange={(e) => updateField("country_of_origin", e.target.value)}
                />
              </div>
              <div>
                <Label>危険物規制種類</Label>
                <Input
                  value={data.hazmat_type}
                  onChange={(e) => updateField("hazmat_type", e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>次へ: バリエーション設定</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Variation Theme */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: バリエーション設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>バリエーションテーマ</Label>
              <select
                className="w-full border rounded-md p-2"
                value={data.variation_theme}
                onChange={(e) => updateField("variation_theme", e.target.value)}
              >
                <option value="">バリエーションなし</option>
                {VARIATION_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
              {template?.dropdown_schema?.["variation_theme"] && (
                <p className="text-xs text-gray-500 mt-1">
                  テンプレートで定義されたテーマ:{" "}
                  {template.dropdown_schema["variation_theme"].length}件
                </p>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                戻る
              </Button>
              <Button onClick={() => setStep(3)}>次へ: 共通詳細</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Common Details */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: 共通商品詳細</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {template &&
              Object.entries(columnGroups).map(([group, cols]) => (
                <details key={group} className="border rounded p-3">
                  <summary className="font-medium cursor-pointer">
                    {group} ({cols.length}項目)
                  </summary>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {cols.map((col) => (
                      <div key={col.technical_name}>
                        <Label className="text-xs">
                          {col.display_name || col.technical_name}
                        </Label>
                        {template.dropdown_schema[col.technical_name] ? (
                          <select
                            className="w-full border rounded-md p-2 text-sm"
                            value={data.common_data[col.technical_name] || ""}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                common_data: {
                                  ...prev.common_data,
                                  [col.technical_name]: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="">選択してください</option>
                            {template.dropdown_schema[col.technical_name].map(
                              (v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <Input
                            className="text-sm"
                            value={data.common_data[col.technical_name] || ""}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                common_data: {
                                  ...prev.common_data,
                                  [col.technical_name]: e.target.value,
                                },
                              }))
                            }
                            placeholder={col.sample_value || ""}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                戻る
              </Button>
              <Button onClick={() => setStep(4)}>次へ: バリエーション定義</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Variations */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: バリエーション定義</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.variations.length === 0 && !data.variation_theme ? (
              <p className="text-gray-500">
                バリエーションテーマが未設定です。Step 2で設定してください。
              </p>
            ) : (
              <>
                {data.variations.map((v, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">子 #{idx + 1}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeVariation(idx)}
                      >
                        削除
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">子SKU</Label>
                        <Input
                          className="text-sm"
                          value={v.child_sku}
                          onChange={(e) =>
                            updateVariation(idx, "child_sku", e.target.value)
                          }
                        />
                      </div>
                      {data.variation_theme
                        ?.split("-")
                        .map((attr) => (
                          <div key={attr}>
                            <Label className="text-xs">{attr}</Label>
                            <Input
                              className="text-sm"
                              value={v.child_data[attr.toLowerCase()] || ""}
                              onChange={(e) =>
                                updateVariation(
                                  idx,
                                  attr.toLowerCase(),
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        ))}
                      <div>
                        <Label className="text-xs">価格</Label>
                        <Input
                          className="text-sm"
                          type="number"
                          value={v.child_data["standard_price"] || ""}
                          onChange={(e) =>
                            updateVariation(idx, "standard_price", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">在庫数</Label>
                        <Input
                          className="text-sm"
                          type="number"
                          value={v.child_data["quantity"] || ""}
                          onChange={(e) =>
                            updateVariation(idx, "quantity", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addVariation}>
                  バリエーション追加
                </Button>
              </>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                戻る
              </Button>
              <Button onClick={() => { handleSave(); setStep(5); }}>
                次へ: プレビュー・出力
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Preview & Export */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5: プレビュー・出力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
              <Button variant="outline" onClick={handlePreview}>
                プレビュー
              </Button>
              <Button
                onClick={handleExport}
                disabled={!productId}
              >
                Excelダウンロード
              </Button>
            </div>

            {preview && (
              <div className="overflow-x-auto border rounded">
                <table className="text-xs">
                  <thead>
                    <tr>
                      {preview.columns?.slice(0, 20).map((col: string) => (
                        <th key={col} className="border px-2 py-1 bg-gray-100">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows?.map((row: any, i: number) => (
                      <tr key={i}>
                        {preview.columns?.slice(0, 20).map((col: string) => (
                          <td key={col} className="border px-2 py-1">
                            {row[col] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.columns?.length > 20 && (
                  <p className="text-xs text-gray-500 p-2">
                    ...他 {preview.columns.length - 20} 列
                  </p>
                )}
              </div>
            )}

            {preview?.warnings && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="font-medium text-amber-800">テンプレート変更警告</p>
                <ul className="list-disc list-inside text-sm text-amber-700">
                  {preview.warnings.summary?.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)}>
                戻る
              </Button>
              <Button onClick={() => router.push("/")}>
                ダッシュボードへ戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
