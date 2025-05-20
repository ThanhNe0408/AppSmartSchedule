"use client"

import React, { useState } from "react"
import {
  SafeAreaView,
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
} from "react-native"
import TabBar from "./components/TabBar"
import ScheduleTab from "./components/tabs/ScheduleTab"
import SuggestionsTab from "./components/tabs/SuggestionsTab"
import ChallengesTab from "./components/tabs/ChallengesTab"
import SettingsTab from "./components/tabs/SettingsTab"
import AuthScreen from "./components/auth/AuthScreen"
import { useAuth } from "./components/context/AuthContext"
import { useTheme } from "./components/context/ThemeContext"
import { COLORS } from "./styles/theme"
import { GoogleSignin } from "@react-native-google-signin/google-signin"

GoogleSignin.configure({
  webClientId: "611842417786-56vqqp9ubfpkc47jmh7qaqof3t4f2fj4.apps.googleusercontent.com",
})

export default function SmartSchedulerApp() {
  const { user, isLoading, logout } = useAuth()
  const { isDarkMode, colors } = useTheme()
  const [currentTab, setCurrentTab] = useState("schedule")

  const renderTabContent = () => {
    switch (currentTab) {
      case "schedule":
        return <ScheduleTab />
      case "suggestions":
        return <SuggestionsTab />
      case "challenges":
        return <ChallengesTab />
      case "settings":
        return <SettingsTab />
      default:
        return <ScheduleTab />
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContent}>
          <Image source={require("./assets/logo.png")} style={styles.loadingLogo} resizeMode="contain" />
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.primary }]}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
        <SafeAreaView style={[styles.topSafeArea, { backgroundColor: colors.primary }]} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <AuthScreen />
        </SafeAreaView>
      </>
    )
  }  

  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
      <SafeAreaView style={[styles.topSafeArea, { backgroundColor: colors.primary }]} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.userInfoContainer, { backgroundColor: colors.primary }]}>
          <View style={[styles.userAvatar, { backgroundColor: "rgba(255, 255, 255, 0.2)" }]}>
            <Text style={styles.userInitials}>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.welcomeText, { color: "rgba(255, 255, 255, 0.8)" }]}>Xin chào,</Text>
            <Text style={[styles.userName, { color: colors.white }]}>{user?.name || "bạn"}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.content,
            {
              backgroundColor: colors.background,
              shadowColor: isDarkMode ? colors.black : colors.elevation,
            },
          ]}
        >
          {renderTabContent()}
        </View>

        <TabBar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </SafeAreaView>
    </>
  )
}

export type Event = {
  id: string
  title: string
  info: string
  date: Date
  day: string
  month: string
  indicatorColor: string
}

export type RootStackParamList = {
  AnalyticsTab: undefined
  SuggestionsTab: { suggestionType: string }
  EventDetail: { event: Event }
}

// Nếu đã có DrawerParamList, để nguyên nó nhé.
export type DrawerParamList = {
  Tasks: undefined
  Calendar: undefined
  Challenges: undefined
  Suggestions: undefined
}

const styles = StyleSheet.create({
  topSafeArea: {
    flex: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  userInitials: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
})
