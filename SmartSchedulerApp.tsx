import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image
} from "react-native";

import Header from "./components/Header";
import TabBar from "./components/TabBar";
import ScheduleTab from "./components/tabs/ScheduleTab";
import SuggestionsTab from "./components/tabs/SuggestionsTab";
import AnalyticsTab from "./components/tabs/AnalyticsTab";
import AuthScreen from "./components/auth/AuthScreen";
import { useAuth } from "./components/context/AuthContext";

export default function SmartSchedulerApp() {
  const { user, isLoading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState("schedule");

  const renderTabContent = () => {
    switch (currentTab) {
      case "schedule":
        return <ScheduleTab />;
      case "suggestions":
        return <SuggestionsTab />;
      case "analytics":
        return <AnalyticsTab />;
      default:
        return <ScheduleTab />;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#6C63FF" />
        <SafeAreaView style={styles.topSafeArea} />
        <SafeAreaView style={styles.container}>
          <AuthScreen />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#6C63FF" />
      <SafeAreaView style={styles.topSafeArea} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Smart Scheduler</Text>
        </View>
        
        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitials}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Xin chào,</Text>
            <Text style={styles.userName}>{user?.name || "bạn"}</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {renderTabContent()}
        </View>
        
        <TabBar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  topSafeArea: {
    flex: 0,
    backgroundColor: "#6C63FF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#6C63FF",
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F7F9FC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F7F9FC",
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
    color: "#6C63FF",
    fontWeight: "600",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#6C63FF",
    marginBottom: 24,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userInitials: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
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
});