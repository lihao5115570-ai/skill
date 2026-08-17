import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "\u5973\u6027 AI \u7f8e\u4e3d\u6210\u957f\u7cfb\u7edf",
  description:
    "\u53d1\u73b0\u4f60\u7684\u4e13\u5c5e\u7f8e\u4e3d\u98ce\u683c\uff0c\u5339\u914d\u9002\u5408\u4f60\u7684\u5986\u5bb9\u3001\u535a\u4e3b\u548c\u98ce\u683c\u65b9\u5411",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
