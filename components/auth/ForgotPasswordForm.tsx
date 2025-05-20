import type React from "react"
import { useState } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native"
import { COLORS, SIZES, SHADOWS } from "../../styles/theme"
import CustomButton from "../UI/CustomButton"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

interface ForgotPasswordFormProps {
  onResetPassword: (phone: string) => Promise<string>
  onVerifyCode: (phone: string, code: string, newPassword: string) => Promise<void>
  onBackToLogin: () => void
  onSwitchToSignup: () => void
  isLoading: boolean
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onResetPassword, 
  onVerifyCode,
  onBackToLogin, 
  onSwitchToSignup,
  isLoading 
}) => {
  const [phone, setPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [codeError, setCodeError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
    setNewPassword(text)
    if (text.trim() === "") {
      setPasswordError("Mật khẩu không được để trống")
    } else if (text.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự")
    } else {
      setPasswordError("")
    }
  }

  const handleSendCode = async () => {
    if (phone.trim() === "") {
      setPhoneError("Số điện thoại không được để trống")
      return
    }

    if (!phoneError) {
      try {
        const vid = await onResetPassword(phone)
        setVerificationId(vid)
        if (__DEV__) {
          Alert.alert(
            "Mã xác thực (Chỉ hiển thị trong môi trường phát triển)",
            "Mã xác thực của bạn là: 123456\n\nTrong môi trường thực tế, mã sẽ được gửi qua SMS.",
            [
              {
                text: "OK",
                onPress: () => {
                  setVerificationCode("123456")
                }
              }
            ]
          )
        } else {
          Alert.alert(
            "Đã gửi mã xác thực",
            "Chúng tôi đã gửi một mã xác thực qua SMS đến số điện thoại của bạn. Vui lòng kiểm tra tin nhắn và nhập mã để tiếp tục.",
          )
        }
      } catch (error: any) {
        if (error.message === "Số điện thoại chưa được đăng ký") {
          Alert.alert(
            "Lỗi",
            "Số điện thoại này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.",
            [
              {
                text: "Thử lại",
                style: "cancel",
              },
              {
                text: "Đăng ký",
                onPress: onSwitchToSignup,
              },
            ]
          )
        } else {
          Alert.alert(
            "Lỗi",
            "Không thể gửi mã xác thực. Vui lòng thử lại sau.",
            [
              {
                text: "Đóng",
                style: "cancel",
              },
            ]
          )
        }
      }
    } else {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại số điện thoại")
    }
  }

  const handleVerifyAndReset = async () => {
    if (!verificationId) {
      Alert.alert("Lỗi", "Vui lòng yêu cầu mã xác thực trước")
      return
    }

    if (verificationCode.trim() === "") {
      setCodeError("Vui lòng nhập mã xác thực")
      return
    }

    if (newPassword.trim() === "") {
      setPasswordError("Vui lòng nhập mật khẩu mới")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp")
      return
    }

    try {
      await onVerifyCode(phone, verificationId, newPassword)
      Alert.alert(
        "Thành công",
        "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
        [
          {
            text: "Đăng nhập",
            onPress: onBackToLogin,
          },
        ]
      )
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
        [
          {
            text: "Gửi lại mã",
            onPress: handleSendCode,
          },
          {
            text: "Đóng",
            style: "cancel",
          },
        ]
      )
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Quên mật khẩu?</Text>
        <Text style={styles.subtitle}>Nhập số điện thoại để nhận mã xác thực</Text>
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
              editable={!verificationId}
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
        </View>

        {!verificationId ? (
          <CustomButton 
            title="Gửi mã xác thực" 
            onPress={handleSendCode} 
            isLoading={isLoading} 
            style={styles.resetButton} 
          />
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mã xác thực</Text>
              <View style={[styles.inputWrapper, codeError ? styles.errorInput : null]}>
                <Icon name="key" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mã xác thực"
                  keyboardType="number-pad"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
              </View>
              {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={[styles.inputWrapper, passwordError ? styles.errorInput : null]}>
                <Icon name="lock" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu mới"
                  secureTextEntry={!showPassword}
                  value={newPassword}
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
              <View style={[styles.inputWrapper, passwordError ? styles.errorInput : null]}>
                <Icon name="lock-check" size={20} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu mới"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            <CustomButton 
              title="Đặt lại mật khẩu" 
              onPress={handleVerifyAndReset} 
              isLoading={isLoading} 
              style={styles.resetButton} 
            />
          </>
        )}

        <TouchableOpacity onPress={onBackToLogin} style={styles.backButton}>
          <Text style={styles.backButtonText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
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
  errorInput: {
    borderColor: COLORS.status.error,
  },
  errorText: {
    color: COLORS.status.error,
    fontSize: 12,
    marginTop: 4,
  },
  resetButton: {
    marginTop: SIZES.padding,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    height: 50,
    ...SHADOWS.medium,
  },
  backButton: {
    marginTop: SIZES.padding,
    alignItems: "center",
  },
  backButtonText: {
    color: COLORS.textLight,
    fontSize: SIZES.body4,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: SIZES.base,
  },
})

export default ForgotPasswordForm 