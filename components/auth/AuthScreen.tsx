"use client"

import React, { useState, useEffect } from "react"
import { 
  View, 
  StyleSheet, 
  Image, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Text,
  ImageBackground,
  Animated,
  Dimensions,
  Alert
} from "react-native"
import { COLORS, SIZES, SHADOWS } from "../../styles/theme"
import PhoneLoginForm from "./PhoneLoginForm"
import PhoneSignupForm from "./PhoneSignupForm"
import ForgotPasswordForm from "./ForgotPasswordForm"
import GmailAuthButton from "./GmailAuthButton"
import { useAuth } from "../context/AuthContext"
import CatAnimation from "./CatAnimation"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

type AuthScreenMode = "login" | "signup" | "forgot-password"

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthScreenMode>("login")
  const { login, signupWithPhone, resetPassword, isLoading, verifyResetCode } = useAuth()

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').width)).current

  // Run entrance animation on first load
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start()
  }, [])

  // Animate transitions between forms
  const changeMode = (newMode: AuthScreenMode) => {
    // First, animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      // Change mode
      setMode(newMode)
      
      // Reset animation values
      slideAnim.setValue(Dimensions.get('window').width)
      
      // Animate in the new form
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        })
      ]).start()
    })
  }

  const handleLogin = async (phone: string, password: string) => {
    // Convert phone to email format for compatibility with existing backend
    const email = `${phone}@phone.user`
    await login(email, password)
  }

  const handleSignup = async (name: string, phone: string, password: string, confirmPassword: string) => {
    try {
      // Validate password match
      if (password !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp")
        return
      }

      // Validate password length
      if (password.length < 6) {
        Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự")
        return
      }

      // Validate phone number format (basic check)
      if (!phone.match(/^[0-9]{10}$/)) {
        Alert.alert("Lỗi", "Số điện thoại không hợp lệ")
        return
      }

      // Validate name
      if (name.trim().length < 2) {
        Alert.alert("Lỗi", "Tên phải có ít nhất 2 ký tự")
        return
      }

      await signupWithPhone(name, phone, password)
      changeMode("login")
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Lỗi đăng ký", error.message)
      } else {
        Alert.alert("Lỗi đăng ký", "Đã xảy ra lỗi không mong muốn")
      }
    }
  }

  const handleResetPassword = async (phone: string) => {
    return await resetPassword(phone)
  }

  const handleVerifyCode = async (phone: string, verificationId: string, newPassword: string) => {
    await verifyResetCode(phone, verificationId, newPassword)
  }

  const renderAuthForm = () => {
    switch (mode) {
      case "login":
        return (
          <PhoneLoginForm 
            onLogin={handleLogin} 
            onSwitchToSignup={() => changeMode("signup")} 
            onForgotPassword={() => changeMode("forgot-password")}
            isLoading={isLoading} 
          />
        )
      case "signup":
        return (
          <PhoneSignupForm 
            onSignup={handleSignup} 
            onSwitchToLogin={() => changeMode("login")} 
            isLoading={isLoading} 
          />
        )
      case "forgot-password":
        return (
          <ForgotPasswordForm 
            onResetPassword={handleResetPassword}
            onVerifyCode={handleVerifyCode}
            onBackToLogin={() => changeMode("login")}
            onSwitchToSignup={() => changeMode("signup")}
            isLoading={isLoading}
          />
        )
    }
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/background.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Icon name="clock-time-eight-outline" size={60} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>Quản lý thời gian</Text>
            
          </View>

          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {renderAuthForm()}
          </Animated.View>

          {mode !== "forgot-password" && (
            <Animated.View 
              style={[
                styles.bottomSection,
                {
                  opacity: fadeAnim,
                  transform: [
                    { 
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <View style={styles.dividerTextContainer}>
                  <Text style={styles.dividerText}>HOẶC</Text>
                </View>
                <View style={styles.divider} />
              </View>

              <GmailAuthButton mode={mode === "login" ? "login" : "signup"} />
            </Animated.View>
          )}

          {/* Add space for cat animation */}
          <View style={styles.spacer} />
        </ScrollView>

        <CatAnimation />
      </KeyboardAvoidingView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120, // Space for cat animation
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    marginBottom: 10,
  },
  appName: {
    fontSize: SIZES.h1,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginVertical: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  appSlogan: {
    fontSize: SIZES.body3,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: SIZES.padding,
  },
  bottomSection: {
    paddingHorizontal: SIZES.padding,
    marginTop: 20,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerTextContainer: {
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: SIZES.radius,
  },
  dividerText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  spacer: {
    height: 100, // Space for cat animation
  },
})

export default AuthScreen