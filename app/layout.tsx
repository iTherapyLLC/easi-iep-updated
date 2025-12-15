import type React from "react"
import type { Metadata, Viewport } from "next"
import { Nunito, Nunito_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { IEPProvider } from "@/lib/iep-context"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" })
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans" })

export const metadata: Metadata = {
  title: "EASI - IEP Compliance Platform",
  description: "A supportive platform helping special education teachers create compliant IEPs with confidence",
  generator: "v0.app",
  icons: {
    icon: "/favicon.webp",
    apple: "/favicon.webp",
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
      <body className={`${nunito.variable} ${nunitoSans.variable} font-sans antialiased`}>
        <IEPProvider>{children}</IEPProvider>
        <Analytics />
      </body>
    </html>
  )
}
