import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Weather Polymarket Dashboard",
  description: "Monitor weather markets on Polymarket with statistical edge analysis",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
