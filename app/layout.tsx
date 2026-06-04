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
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
