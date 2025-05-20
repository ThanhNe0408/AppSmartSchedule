"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native"
import { COLORS, SIZES, SHADOWS } from "../../styles/theme"
import CustomButton from "../UI/CustomButton"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

interface PhoneLoginFormProps {
  onLogin: (phone: string, password: string) => void
  onSwitchToSignup: () => void
  onForgotPassword: () => void
  isLoading: boolean
}

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onLogin, onSwitchToSignup, onForgotPassword, isLoading }) => {
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const validatePhone = (text: string) => {
    setPhone(text)
    if (text.trim() === "") {
      setPhoneError("Số điện thoại không được để trống")
    } else if (!/^\d{10}$/.test(text)) {
      setPhoneError("Số điện thoại phải có 10 chữ số")
    } else {
      setPhoneError("")
    }
  }

  const validatePassword = (text: string) => {
    setPassword(text)
    if (text.trim() === "") {
      setPasswordError("Mật khẩu không được để trống")
    } else if (text.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự")
    } else {
      setPasswordError("")
    }
  }

  const handleLogin = () => {
    if (phone.trim() === "") {
      setPhoneError("Số điện thoại không được để trống")
      return
    }
    if (password.trim() === "") {
      setPasswordError("Mật khẩu không được để trống")
      return
    }

    if (!phoneError && !passwordError) {
      onLogin(phone, password)
    } else {
      Alert.alert("Lỗi đăng nhập", "Vui lòng kiểm tra lại thông tin đăng nhập")
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Chào mừng trở lại!</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục quản lý thời gian của bạn</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Số điện thoại</Text>
          <View style={[styles.inputWrapper, phoneError ? styles.errorInput : null]}>
            <Icon name="phone" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={validatePhone}
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={[styles.inputWrapper, passwordError ? styles.errorInput : null]}>
            <Icon name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={validatePassword}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <CustomButton 
          title="Đăng nhập" 
          onPress={handleLogin} 
          isLoading={isLoading} 
          style={styles.loginButton} 
        />

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={onSwitchToSignup}>
            <Text style={styles.signupLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SIZES.base,
  },
  subtitle: {
    fontSize: SIZES.body4,
    color: COLORS.textLight,
    textAlign: "center",
  },
  formContainer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 2,
    ...SHADOWS.medium,
  },
  inputContainer: {
    marginBottom: SIZES.padding,
  },
  label: {
    fontSize: SIZES.body4,
    fontWeight: "600",
    marginBottom: SIZES.base,
    color: COLORS.text,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    height: 50,
    paddingHorizontal: SIZES.base,
    ...SHADOWS.light,
  },
  inputIcon: {
    marginRight: SIZES.base,
  },
  input: {
    flex: 1,
    height: "100%",
    color: COLORS.text,
    fontSize: SIZES.body3,
  },
  eyeIcon: {
    padding: SIZES.base,
  },
  errorInput: {
    borderColor: COLORS.status.error,
  },
  errorText: {
    color: COLORS.status.error,
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: SIZES.padding,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: SIZES.body4,
    fontWeight: "500",
  },
  loginButton: {
    marginTop: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    height: 50,
    ...SHADOWS.medium,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.padding * 1.5,
  },
  signupText: {
    color: COLORS.textLight,
    fontSize: SIZES.body4,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: SIZES.body4,
    fontWeight: "600",
  },
})

export default PhoneLoginForm