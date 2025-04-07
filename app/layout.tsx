import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Mind Deck",
  description: "Приложение для создания и изучения флеш-карточек",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen`}>
        <main className="min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  )
}
