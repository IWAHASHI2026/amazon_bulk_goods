"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { listProducts, deleteProduct, downloadDraftSheet, uploadDraftSheet } from "@/lib/api";
import type { ProductListItem, DraftSheetUploadResult } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await listProducts();
      setProducts(data);
    } catch {
      // API not available yet
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("この商品を削除しますか？")) return;
    await deleteProduct(id);
    loadProducts();
  };

  const handleDownloadDraft = async () => {
    try {
      const blob = await downloadDraftSheet();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "draft_sheet.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "下書きシートのダウンロードに失敗しました");
    }
  };

  const handleUploadDraft = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const result: DraftSheetUploadResult = await uploadDraftSheet(file);
      if (result.warnings.length > 0) {
        alert("警告:\n" + result.warnings.join("\n"));
      }
      router.push(`/products/${result.product_id}`);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadDraft}>
            下書きシートDL
          </Button>
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById("draft-upload")?.click()}
          >
            {uploading ? "アップロード中..." : "下書きシートUP"}
          </Button>
          <input
            id="draft-upload"
            type="file"
            accept=".xlsx,.xlsm"
            className="hidden"
            onChange={handleUploadDraft}
          />
          <Link href="/products/new">
            <Button>新規商品登録</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              登録済みの商品はありません
            </p>
            <Link href="/products/new">
              <Button>最初の商品を登録</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-lg font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                      <Badge
                        variant={
                          product.status === "draft" ? "secondary" : "default"
                        }
                      >
                        {product.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      SKU: {product.parent_sku || "未設定"} ・
                      バリエーション: {product.variation_count}件 ・
                      テーマ: {product.variation_theme || "なし"}
                    </p>
                    <p className="text-xs text-gray-400">
                      更新: {new Date(product.updated_at).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" size="sm">
                        編集
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
