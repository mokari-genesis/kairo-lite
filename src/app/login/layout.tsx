import { AntdRegistry } from '@ant-design/nextjs-registry'
export const metadata = {
  title: 'Kairo Lite',
  description: 'Kairo Lite',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AntdRegistry>{children}</AntdRegistry>
}
