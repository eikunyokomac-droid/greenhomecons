import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "グリーンホームコンサル｜建築・リフォームとITの相談窓口",
  description: "東京都青梅市を拠点に、施主の立場で建築・リフォームをサポート。長年の建築とITの経験で、小さな改装から事業の課題まで伴走します。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
