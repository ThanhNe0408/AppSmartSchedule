"use client"

// components/context/AuthContext.tsx
import { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import auth from "@react-native-firebase/auth"
import { GoogleSignin } from "@react-native-google-signin/google-signin"

// Cấu hình Google Sign-In
GoogleSignin.configure({
  webClientId: "269322084365-7mdfe4ed76ng3v5mns6n0phqluic5dlq.apps.googleusercontent.com", // Updated to your new client ID
  offlineAccess: true,
})

export type User = {
  id: string
  email: string
  name: string
  photoURL?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  signupWithEmail: (name: string, email: string, password: string) => Promise<User>
  signupWithPhone: (name: string, phone: string, password: string) => Promise<User>
  signInWithGmail: () => Promise<User>
  resetPassword: (phone: string) => Promise<string>
  verifyResetCode: (phone: string, verificationId: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const formatUser = (firebaseUser: any): User => ({
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
    photoURL: firebaseUser.photoURL || undefined,
  })

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const formattedUser = formatUser(firebaseUser)
        setUser(formattedUser)
        await AsyncStorage.setItem("user", JSON.stringify(formattedUser))
      } else {
        setUser(null)
        await AsyncStorage.removeItem("user")
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true)
    try {
      const { user: firebaseUser } = await auth().signInWithEmailAndPassword(email, password)
      const formattedUser = formatUser(firebaseUser)
      return formattedUser
    } catch (error: any) {
      console.error("Login error:", error)
      throw new Error(error.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the signupWithEmail function
  const signupWithEmail = async (name: string, email: string, password: string): Promise<User> => {
    setIsLoading(true)
    try {
      const { user: firebaseUser } = await auth().createUserWithEmailAndPassword(email, password)

      // Update profile with name
      await firebaseUser.updateProfile({ displayName: name })

      // Explicitly sign out after registration - user must manually sign in
      await auth().signOut()

      // Return user info even though we logged them out
      const formattedUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: name,
        photoURL: firebaseUser.photoURL || undefined,
      }

      return formattedUser
    } catch (error: any) {
      console.error("Signup error:", error)
      throw new Error(error.message || "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  const signupWithPhone = async (name: string, phone: string, password: string): Promise<User> => {
    setIsLoading(true)
    try {
      // Đăng ký tài khoản sử dụng @react-native-firebase/auth
      const userCredential = await auth().createUserWithEmailAndPassword(`${phone}@phone.user`, password)
      
      // Update profile with name
      await userCredential.user.updateProfile({ displayName: name })
      
      // Đăng xuất ngay sau khi đăng ký thành công
      await auth().signOut()
      
      // Trả về thành công
      const formattedUser = {
        id: userCredential.user.uid,
        email: `${phone}@phone.user`,
        name: name,
        photoURL: userCredential.user.photoURL || undefined,
      }
      return formattedUser
    } catch (error: any) {
      console.error("Phone signup error:", error)
      throw new Error(error.message || "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGmail = async (): Promise<User> => {
    setIsLoading(true)
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const { idToken } = await GoogleSignin.getTokens() // ✅ Dùng getTokens để lấy idToken

      if (!idToken) {
        throw new Error("No ID token returned from Google")
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken)
      const userCredential = await auth().signInWithCredential(googleCredential)
      const formattedUser = formatUser(userCredential.user)
      return formattedUser
    } catch (error: any) {
      console.error("Gmail login error:", error)
      throw new Error(error.message || "Failed to sign in with Gmail")
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (phone: string): Promise<string> => {
    try {
      // First check if the phone number exists
      const email = `${phone}@phone.user`
      const methods = await auth().fetchSignInMethodsForEmail(email)
      
      if (methods.length === 0) {
        throw new Error("Số điện thoại chưa được đăng ký")
      }

      // For development, use test verification code
      if (__DEV__) {
        // Store the phone number for verification
        await AsyncStorage.setItem('reset_phone', phone)
        // Return a fake verification ID
        return 'test-verification-id'
      }

      // Format phone number to E.164 format for Firebase
      const formattedPhone = phone.startsWith('+84') ? phone : `+84${phone.startsWith('0') ? phone.slice(1) : phone}`

      // Send verification code via SMS
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone, true)
      
      if (!confirmation.verificationId) {
        throw new Error("Không thể gửi mã xác thực")
      }
      
      return confirmation.verificationId
    } catch (error: any) {
      console.error("Reset password error:", error)
      if (error.message === "Số điện thoại chưa được đăng ký") {
        throw error
      }
      throw new Error("Không thể gửi mã xác thực. Vui lòng thử lại sau.")
    }
  }

  const verifyResetCode = async (phone: string, verificationId: string, newPassword: string): Promise<void> => {
    try {
      // For development, verify with test code
      if (__DEV__) {
        const storedPhone = await AsyncStorage.getItem('reset_phone')
        if (storedPhone !== phone) {
          throw new Error("Số điện thoại không khớp")
        }
        if (verificationId !== 'test-verification-id') {
          throw new Error("Mã xác thực không hợp lệ")
        }
        // Update password directly in development
        const email = `${phone}@phone.user`
        const userCredential = await auth().signInWithEmailAndPassword(email, "temp-password")
        if (userCredential.user) {
          await userCredential.user.updatePassword(newPassword)
          await auth().signOut()
          await AsyncStorage.removeItem('reset_phone')
        }
        return
      }

      // Production verification logic
      const formattedPhone = phone.startsWith('+84') ? phone : `+84${phone.startsWith('0') ? phone.slice(1) : phone}`
      const credential = auth.PhoneAuthProvider.credential(verificationId, formattedPhone)
      await auth().signInWithCredential(credential)
      
      // After verification success, update password
      const email = `${phone}@phone.user`
      const userCredential = await auth().signInWithEmailAndPassword(email, "temp-password")
      
      if (userCredential.user) {
        await userCredential.user.updatePassword(newPassword)
        await auth().signOut()
      } else {
        throw new Error("Không thể cập nhật mật khẩu")
      }
    } catch (error: any) {
      console.error("Verify code error:", error)
      throw new Error("Mã xác thực không hợp lệ hoặc đã hết hạn")
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await auth().signOut()

      const currentUser = await GoogleSignin.getCurrentUser()
      if (currentUser) {
        await GoogleSignin.signOut()
      }

      await AsyncStorage.removeItem("user")
      setUser(null)
    } catch (error: any) {
      console.error("Logout error:", error)
      throw new Error(error.message || "Failed to logout")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signupWithEmail,
        signupWithPhone,
        signInWithGmail,
        resetPassword,
        verifyResetCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}