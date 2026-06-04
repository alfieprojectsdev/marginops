import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarginOps — Marketing Profitability",
  description: "Calm Web executive summary of blended marketing profitability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="calm-bg min-h-screen font-sans">{children}</body>
    </html>
  );
}
