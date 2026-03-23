import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Amazon一括登録サポート",
  description: "Amazon SIGNAGE商品一括登録支援ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="text-xl font-bold text-gray-900">
                    Amazon一括登録
                  </Link>
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    ダッシュボード
                  </Link>
                  <Link
                    href="/products/new"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    商品登録
                  </Link>
                  <Link
                    href="/admin/template"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    テンプレート管理
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
