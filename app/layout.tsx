import type React from "react"
import type { Metadata, Viewport } from "next"
import { Quicksand, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { IEPProvider } from "@/lib/iep-context"

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["400", "500", "600", "700"],
})
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: "EASI IEP",
  description: "Your IEP compliance guardian",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/easi-logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/easi-logo.png", type: "image/png" },
    ],
    shortcut: "/easi-logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#4a9d8e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${poppins.variable} font-sans antialiased`}>
        <IEPProvider>{children}</IEPProvider>
        <Analytics />
      </body>
    </html>
  )
}
