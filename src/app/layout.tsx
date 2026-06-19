import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Police Duty Card Generator — UP Police Bulandshahr",
  description: "काँवड़ यात्रा पुलिस ड्यूटी कार्ड जनरेटर",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-900 text-white">
        {children}
      </body>
    </html>
  );
}

