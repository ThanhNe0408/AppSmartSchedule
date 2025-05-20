import React from "react"
import { View } from "react-native"
import SettingsView from "../settings/SettingsView"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"

const APP_VERSION = "1.0.0"
const APP_BUILD = "2024.03.14"

const SettingsTab = () => {
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const appInfo = {
    version: APP_VERSION,
    build: APP_BUILD,
    developer: "SmartSchedule Team",
    description: "Ứng dụng quản lý lịch trình thông minh với tính năng AI, giúp bạn tối ưu hóa thời gian và nâng cao hiệu suất học tập.",
    features: [
      "Quản lý lịch trình thông minh",
      "Gợi ý AI cá nhân hóa",
      "Phân tích hiệu suất học tập",
      "Bảo mật dữ liệu",
    ]
  }

  return (
    <View style={{ flex: 1 }}>
      <SettingsView
        user={user}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleTheme}
        appInfo={appInfo}
      />
    </View>
  )
}

export default SettingsTab 