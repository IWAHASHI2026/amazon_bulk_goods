"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  uploadTemplate,
  listTemplates,
  getActiveTemplate,
  checkTemplate,
} from "@/lib/api";
import type { TemplateVersion, TemplateVersionDetail, TemplateDiff } from "@/lib/types";

export default function TemplatePage() {
  const [templates, setTemplates] = useState<TemplateVersion[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateVersionDetail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [versionLabel, setVersionLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [diff, setDiff] = useState<TemplateDiff | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tmplList, active] = await Promise.all([
        listTemplates().catch(() => []),
        getActiveTemplate().catch(() => null),
      ]);
      setTemplates(tmplList);
      setActiveTemplate(active);
    } catch {
      // ignore
    }
  };

  const handleUpload = async () => {
    if (!file || !versionLabel) return;
    setUploading(true);
    setError("");
    try {
      await uploadTemplate(file, versionLabel);
      setFile(null);
      setVersionLabel("");
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleCheck = async () => {
    if (!file) return;
    setChecking(true);
    setError("");
    try {
      const result = await checkTemplate(file);
      setDiff(result);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "チェックに失敗しました");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">テンプレート管理</h1>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>テンプレートアップロード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">テンプレートファイル (.xlsm / .xlsx)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsm,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <Label htmlFor="label">バージョンラベル</Label>
            <Input
              id="label"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="例: 2024年3月版"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <p>{error}</p>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={!file || !versionLabel || uploading}>
              {uploading ? "アップロード中..." : "アップロード（アクティブに設定）"}
            </Button>
            <Button variant="outline" onClick={handleCheck} disabled={!file || checking}>
              {checking ? "チェック中..." : "差分チェック（保存なし）"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diff Result */}
      {diff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              差分チェック結果
              <Badge variant={diff.severity === "major" ? "destructive" : diff.severity === "minor" ? "secondary" : "default"}>
                {diff.severity === "none" ? "変更なし" : diff.severity === "minor" ? "軽微な変更" : "重大な変更"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diff.summary.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {diff.summary.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">変更は検出されませんでした。</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Template Info */}
      {activeTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>アクティブテンプレート情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>バージョン:</strong> {activeTemplate.version_label}
            </p>
            <p>
              <strong>アップロード日:</strong>{" "}
              {new Date(activeTemplate.uploaded_at).toLocaleString("ja-JP")}
            </p>
            <p>
              <strong>列数:</strong> {activeTemplate.column_schema.length}
            </p>
            <p>
              <strong>バリデーションルール数:</strong>{" "}
              {activeTemplate.validation_schema.length}
            </p>
            <p>
              <strong>名前付き範囲数:</strong>{" "}
              {activeTemplate.defined_names_schema.length}
            </p>
            <p>
              <strong>ドロップダウン項目数:</strong>{" "}
              {Object.keys(activeTemplate.dropdown_schema).length}
            </p>
            <p>
              <strong>ハッシュ:</strong>{" "}
              <code className="text-xs">{activeTemplate.schema_hash}</code>
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Template History */}
      <Card>
        <CardHeader>
          <CardTitle>テンプレート履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-gray-500">テンプレートがまだアップロードされていません。</p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <span className="font-medium">{t.version_label}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      {new Date(t.uploaded_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  {t.is_active && <Badge>アクティブ</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
