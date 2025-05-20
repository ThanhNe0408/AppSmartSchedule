"use client"

import { useEffect } from "react"
import { LogBox } from "react-native"
import { AuthProvider } from "./components/context/AuthContext"
import { ThemeProvider } from "./components/context/ThemeContext"
import SmartSchedulerApp from "./SmartSchedulerApp"
import { GoogleSignin } from "@react-native-google-signin/google-signin"

// Ignore specific warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "Firebase: Error (auth/operation-not-allowed)",
  "RCTBridge required dispatch_sync to load RNGoogleSignin",
])

export default function App() {
  // Configure Google Sign-In once when app loads
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "611842417786-56vqqp9ubfpkc47jmh7qaqof3t4f2fj4.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    })
  }, [])

  return (
    <AuthProvider>
      <ThemeProvider>
      <SmartSchedulerApp />
      </ThemeProvider>
    </AuthProvider>
  )
}
