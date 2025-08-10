"use client"
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "../src/contexts/AuthContext"

export default function  Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      
        <AuthProvider>
          {children}
        </AuthProvider>
      
    </SessionProvider>
  )
}
