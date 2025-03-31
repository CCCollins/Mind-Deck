import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Приложение Флеш-карточки",
  description: "Приложение для создания и изучения флеш-карточек с использованием Next.js и Supabase",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  )
}



import './globals.css'