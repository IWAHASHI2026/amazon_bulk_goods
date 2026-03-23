"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getProduct,
  updateProduct,
  addVariation,
  deleteVariation,
  exportProduct,
} from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const productId = Number(params.id);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await getProduct(productId);
      setProduct(data);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<Product>) => {
    if (!product) return;
    await updateProduct(product.id, updates);
    loadProduct();
  };

  const handleExport = async () => {
    if (!product) return;
    const blob = await exportProduct(product.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amazon_upload_${product.parent_sku || product.name}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddVariation = async () => {
    if (!product) return;
    await addVariation(product.id, {
      sort_order: product.variations.length,
      child_sku: "",
      child_data: {},
    });
    loadProduct();
  };

  const handleDeleteVariation = async (variationId: number) => {
    if (!product) return;
    await deleteVariation(product.id, variationId);
    loadProduct();
  };

  if (loading) return <p>読み込み中...</p>;
  if (!product) return <p>商品が見つかりません</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <Badge>{product.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport}>Excelダウンロード</Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            戻る
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>商品名</Label>
              <Input value={product.name} readOnly />
            </div>
            <div>
              <Label>親SKU</Label>
              <Input value={product.parent_sku || ""} readOnly />
            </div>
            <div>
              <Label>バリエーションテーマ</Label>
              <Input value={product.variation_theme || "なし"} readOnly />
            </div>
            <div>
              <Label>ステータス</Label>
              <select
                className="w-full border rounded-md p-2"
                value={product.status}
                onChange={(e) => handleUpdate({ status: e.target.value })}
              >
                <option value="draft">下書き</option>
                <option value="ready">準備完了</option>
                <option value="exported">出力済み</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              バリエーション ({product.variations.length}件)
            </CardTitle>
            <Button size="sm" onClick={handleAddVariation}>
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {product.variations.length === 0 ? (
            <p className="text-gray-500">バリエーションはありません</p>
          ) : (
            <div className="space-y-2">
              {product.variations.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between border rounded p-3"
                >
                  <div>
                    <span className="font-medium">
                      SKU: {v.child_sku || "未設定"}
                    </span>
                    <span className="text-sm text-gray-500 ml-3">
                      {Object.entries(v.child_data)
                        .slice(0, 3)
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(", ")}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteVariation(v.id)}
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
