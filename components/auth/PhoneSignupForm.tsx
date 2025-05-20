"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native"
import { COLORS, SIZES, SHADOWS } from "../../styles/theme"
import CustomButton from "../UI/CustomButton"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

interface PhoneSignupFormProps {
  onSignup: (name: string, phone: string, password: string, confirmPassword: string) => Promise<void>
  onSwitchToLogin: () => void
  isLoading: boolean
}

const PhoneSignupForm: React.FC<PhoneSignupFormProps> = ({ onSignup, onSwitchToLogin, isLoading }) => {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [nameError, setNameError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")

  const validateName = (text: string) => {
    setName(text)
    if (text.trim() === "") {
      setNameError("Họ tên không được để trống")
    } else if (text.length < 2) {
      setNameError("Họ tên phải có ít nhất 2 ký tự")
    } else {
      setNameError("")
    }
  }

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

    if (confirmPassword) {
      validateConfirmPassword(confirmPassword, text)
    }
  }

  const validateConfirmPassword = (text: string, pass = password) => {
    setConfirmPassword(text)
    if (text.trim() === "") {
      setConfirmPasswordError("Xác nhận mật khẩu không được để trống")
    } else if (text !== pass) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp")
    } else {
      setConfirmPasswordError("")
    }
  }

  const handleSignup = async () => {
    if (name.trim() === "") {
      setNameError("Họ tên không được để trống")
      return
    }
    if (phone.trim() === "") {
      setPhoneError("Số điện thoại không được để trống")
      return
    }
    if (password.trim() === "") {
      setPasswordError("Mật khẩu không được để trống")
      return
    }
    if (confirmPassword.trim() === "") {
      setConfirmPasswordError("Xác nhận mật khẩu không được để trống")
      return
    }

    if (!nameError && !phoneError && !passwordError && !confirmPasswordError) {
      try {
        await onSignup(name, phone, password, confirmPassword)
        Alert.alert("Thành công", "Đăng ký thành công! Hãy đăng nhập.")
        onSwitchToLogin()
      } catch (error: any) {
        Alert.alert("Lỗi đăng ký", error.message || "Đăng ký không thành công.")
      }
    } else {
      Alert.alert("Lỗi đăng ký", "Vui lòng kiểm tra lại thông tin đăng ký")
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Tạo tài khoản mới</Text>
        <Text style={styles.subtitle}>Đăng ký để quản lý thời gian hiệu quả hơn</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Họ và tên</Text>
          <View style={[styles.inputWrapper, nameError ? styles.errorInput : null]}>
            <Icon name="account" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              value={name}
              onChangeText={validateName}
              autoCapitalize="words"
            />
          </View>
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <View style={[styles.inputWrapper, confirmPasswordError ? styles.errorInput : null]}>
            <Icon name="lock-check" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => validateConfirmPassword(text)}
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        </View>

        <CustomButton 
          title="Đăng ký" 
          onPress={handleSignup} 
          isLoading={isLoading} 
          style={styles.signupButton} 
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={onSwitchToLogin}>
            <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
  signupButton: {
    marginTop: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    height: 50,
    ...SHADOWS.medium,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.padding * 1.5,
  },
  loginText: {
    color: COLORS.textLight,
    fontSize: SIZES.body4,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: SIZES.body4,
    fontWeight: "600",
  },
})

export default PhoneSignupForm
