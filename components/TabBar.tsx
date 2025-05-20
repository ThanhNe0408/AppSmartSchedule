"use client"

import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useTheme } from "./context/ThemeContext"
import { COLORS } from "../styles/theme"

interface TabBarProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
}

const TabBar: React.FC<TabBarProps> = ({ currentTab, setCurrentTab }) => {
  const { isDarkMode, colors } = useTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? colors.darkCard : colors.card,
          borderTopColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        },
      ]}
    >
      <TouchableOpacity style={styles.tab} onPress={() => setCurrentTab("schedule")} activeOpacity={0.7}>
        <Icon
          name="calendar-today"
          size={24}
          color={currentTab === "schedule" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA"}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: currentTab === "schedule" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA",
            },
          ]}
        >
          Lịch
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => setCurrentTab("suggestions")} activeOpacity={0.7}>
        <Icon
          name="lightbulb"
          size={24}
          color={currentTab === "suggestions" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA"}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: currentTab === "suggestions" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA",
            },
          ]}
        >
          Quản lý
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => setCurrentTab("challenges")} activeOpacity={0.7}>
        <Icon
          name="emoji-events"
          size={24}
          color={currentTab === "challenges" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA"}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: currentTab === "challenges" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA",
            },
          ]}
        >
          Thử thách
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tab} onPress={() => setCurrentTab("settings")} activeOpacity={0.7}>
        <Icon
          name="settings"
          size={24}
          color={currentTab === "settings" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA"}
        />
        <Text
          style={[
            styles.tabText,
            {
              color: currentTab === "settings" ? COLORS.primary : isDarkMode ? "#888888" : "#AAAAAA",
            },
          ]}
        >
          Cài đặt
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 60,
    borderTopWidth: 1,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabText: {
    fontSize: 12,
    marginTop: 2,
  },
})

export default TabBar
