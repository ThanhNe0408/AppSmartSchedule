import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Switch, Linking, Animated } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useState, useRef } from "react"
import { COLORS } from "../../styles/theme"

interface AppInfo {
  version: string
  build: string
  developer: string
  description: string
  features: string[]
}

interface SettingsViewProps {
  user: any
  onLogout: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  appInfo: AppInfo
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout, isDarkMode, onToggleDarkMode, appInfo }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [isAppInfoExpanded, setIsAppInfoExpanded] = useState(false)
  const animatedHeight = useRef(new Animated.Value(0)).current

  const toggleAppInfo = () => {
    setIsAppInfoExpanded(!isAppInfoExpanded)
    Animated.timing(animatedHeight, {
      toValue: isAppInfoExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }

  const renderSettingItem = (
    icon: string, 
    title: string, 
    isPremium = false, 
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => {
    return (
      <TouchableOpacity 
        style={[
          styles.settingItem, 
          { backgroundColor: isDarkMode ? COLORS.darkCard : COLORS.white }
        ]} 
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.settingIconContainer, { backgroundColor: COLORS.primary }]}>
          <Icon name={icon} size={24} color="#FFFFFF" style={styles.settingIcon} />
        </View>
        <Text style={[
          styles.settingTitle,
          { color: isDarkMode ? COLORS.darkText : COLORS.text }
        ]}>
          {title}
        </Text>
        <View style={styles.settingRight}>
          {isPremium && (
            <Image 
              source={require("../../assets/crown.png")} 
              style={styles.premiumIcon} 
            />
          )}
          {rightComponent || (
            <Icon 
              name="chevron-right" 
              size={24} 
              color={isDarkMode ? COLORS.darkBorder : COLORS.border} 
            />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.dark.background : COLORS.background }
      ]}
    >
      {/* Tài khoản */}
      <View style={styles.settingsGroup}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Icon name="account-circle" size={60} color={COLORS.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[
              styles.userName,
              { color: isDarkMode ? COLORS.darkText : COLORS.text }
            ]}>
              {user?.name || "Người dùng"}
            </Text>
            <Text style={styles.userEmail}>{user?.email || ""}</Text>
          </View>
        </View>
      </View>

      {/* Cài đặt chung */}
      <Text style={[
        styles.sectionTitle,
        { color: isDarkMode ? COLORS.darkText : COLORS.text }
      ]}>
        Cài đặt chung
      </Text>
      <View style={[
        styles.settingsGroup,
        { borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border }
      ]}>
        {renderSettingItem(
          "brightness-6",
          "Giao diện tối",
          false,
          undefined,
          <Switch
            value={isDarkMode}
            onValueChange={onToggleDarkMode}
            trackColor={{ false: "#767577", true: COLORS.primary }}
            thumbColor={isDarkMode ? COLORS.white : "#f4f3f4"}
          />
        )}
        {renderSettingItem(
          "notifications",
          "Thông báo",
          false,
          undefined,
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#767577", true: COLORS.primary }}
            thumbColor={notificationsEnabled ? COLORS.white : "#f4f3f4"}
          />
        )}
        {renderSettingItem(
          "sync",
          "Đồng bộ tự động",
          false,
          undefined,
          <Switch
            value={syncEnabled}
            onValueChange={setSyncEnabled}
            trackColor={{ false: "#767577", true: COLORS.primary }}
            thumbColor={syncEnabled ? COLORS.white : "#f4f3f4"}
          />
        )}
      </View>

      {/* Quản lý */}
      <Text style={[
        styles.sectionTitle,
        { color: isDarkMode ? COLORS.darkText : COLORS.text }
      ]}>
        Quản lý
      </Text>
      <View style={[
        styles.settingsGroup,
        { borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border }
      ]}>
       
        {renderSettingItem("favorite", "Sự kiện yêu thích", false, () => console.log("Favorites"))}
        {renderSettingItem("archive", "Sự kiện lưu trữ", false, () => console.log("Archive"))}
      </View>

      {/* Bảo mật */}
      <Text style={[
        styles.sectionTitle,
        { color: isDarkMode ? COLORS.darkText : COLORS.text }
      ]}>
        Bảo mật
      </Text>
      <View style={[
        styles.settingsGroup,
        { borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border }
      ]}>
        {renderSettingItem("lock", "Đổi mật khẩu", true, () => console.log("Password"))}
       
      </View>

      {/* Thông tin ứng dụng */}
      <Text style={[
        styles.sectionTitle,
        { color: isDarkMode ? COLORS.darkText : COLORS.text }
      ]}>
        Thông tin ứng dụng
      </Text>
      <View style={[
        styles.settingsGroup,
        { borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border }
      ]}>
        <TouchableOpacity 
          style={[
            styles.appInfoHeader,
            { backgroundColor: isDarkMode ? COLORS.darkCard : COLORS.white }
          ]}
          onPress={toggleAppInfo}
        >
          <View style={styles.appInfoHeaderContent}>
            <Icon name="info" size={24} color={COLORS.primary} style={styles.appInfoIcon} />
            <Text style={[
              styles.appInfoTitle,
              { color: isDarkMode ? COLORS.darkText : COLORS.text }
            ]}>
              Thông tin chi tiết
            </Text>
          </View>
          <Icon 
            name={isAppInfoExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color={isDarkMode ? COLORS.darkText : COLORS.text} 
          />
        </TouchableOpacity>

        <Animated.View style={[
          styles.appInfoContent,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500]
            }),
            opacity: animatedHeight,
            overflow: 'hidden'
          }
        ]}>
          <View style={[styles.appInfoContainer, { backgroundColor: isDarkMode ? COLORS.darkCard : COLORS.white }]}>
            <Text style={[styles.appDescription, { color: isDarkMode ? COLORS.darkText : COLORS.text }]}>
              {appInfo.description}
            </Text>
            
            <View style={styles.appMetaInfo}>
              <Text style={[styles.appMetaText, { color: isDarkMode ? COLORS.darkTextLight : COLORS.textLight }]}>
                Phiên bản: {appInfo.version} ({appInfo.build})
              </Text>
              <Text style={[styles.appMetaText, { color: isDarkMode ? COLORS.darkTextLight : COLORS.textLight }]}>
                Phát triển bởi: {appInfo.developer}
              </Text>
            </View>

            <View style={styles.appFeatures}>
              <Text style={[styles.featureTitle, { color: isDarkMode ? COLORS.darkText : COLORS.text }]}>
                Tính năng chính:
              </Text>
              {appInfo.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color={COLORS.primary} />
                  <Text style={[
                    styles.featureText,
                    { color: isDarkMode ? COLORS.darkTextLight : COLORS.textLight }
                  ]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: COLORS.status.error }]} 
        onPress={onLogout}
      >
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  settingsGroup: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingIcon: {},
  settingTitle: {
    flex: 1,
    fontSize: 16,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: COLORS.status.error,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  appInfoContainer: {
    padding: 16,
  },
  appDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  appMetaInfo: {
    marginBottom: 16,
  },
  appMetaText: {
    fontSize: 12,
    marginBottom: 4,
  },
  appFeatures: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
  },
  appInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  appInfoHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appInfoIcon: {
    marginRight: 12,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  appInfoContent: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
})

export default SettingsView
