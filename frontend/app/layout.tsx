import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import Web3Provider from "@/components/web3-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RentChain - Web3 Property Rental Platform",
  description: "Find and rent properties using blockchain technology",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Web3Provider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'
