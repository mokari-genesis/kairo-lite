"use client";
import "../globals.css";
import AppLayout from "../home/AppLayout";
import { AntdRegistry } from "@ant-design/nextjs-registry";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AntdRegistry>
      <AppLayout>{children}</AppLayout>
    </AntdRegistry>
  );
}