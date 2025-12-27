"use client";
import "../globals.css";
import AppLayout from "../home/AppLayout";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // No mostrar AppLayout en la página de selección de empresa
  const isSelectEmpresaPage = pathname === '/home/select-empresa';
  
  return (
    <AntdRegistry>
      {isSelectEmpresaPage ? children : <AppLayout>{children}</AppLayout>}
    </AntdRegistry>
  );
}