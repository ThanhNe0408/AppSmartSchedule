"use client"

import { useState } from "react"
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native"
import TimeEstimation from "../ai/TimeEstimation"
import VoiceReminders from "../reminders/VoiceReminders"
import AIAssistant from "../ai/AIAssistant"
import ImageScheduleRecognition from "../recognition/ImageScheduleRecognition"
import NotificationManager from "../notification/NotificationManager"
import { useTheme } from "../context/ThemeContext"
import { COLORS } from "../../styles/theme"

const SuggestionsTab = () => {
  const [activeFeature, setActiveFeature] = useState<string>("imageRecognition")
  const { isDarkMode, colors } = useTheme()

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case "imageRecognition":
        return <ImageScheduleRecognition />
      case "timeEstimation":
        return <TimeEstimation />
      case "notifications":
        return <NotificationManager />
      case "aiAssistant":
        return <AIAssistant />
      default:
        return <ImageScheduleRecognition />
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={[styles.featureSelector, { backgroundColor: isDarkMode ? colors.darkCard : colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.featureButton,
              activeFeature === "imageRecognition" && [
                styles.activeFeature,
                { backgroundColor: isDarkMode ? colors.dark.background : colors.white }
              ]
            ]}
            onPress={() => setActiveFeature("imageRecognition")}
          >
            <Text style={styles.featureIcon}>📷</Text>
            <Text style={[styles.featureText, { color: isDarkMode ? colors.darkText : colors.text }]}>Nhận diện lịch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.featureButton,
              activeFeature === "timeEstimation" && [
                styles.activeFeature,
                { backgroundColor: isDarkMode ? colors.dark.background : colors.white }
              ]
            ]}
            onPress={() => setActiveFeature("timeEstimation")}
          >
            <Text style={styles.featureIcon}>⏱️</Text>
            <Text style={[styles.featureText, { color: isDarkMode ? colors.darkText : colors.text }]}>Dự đoán thời gian</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.featureButton,
              activeFeature === "notifications" && [
                styles.activeFeature,
                { backgroundColor: isDarkMode ? colors.dark.background : colors.white },
              ],
            ]}
            onPress={() => setActiveFeature("notifications")}
          >
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={[styles.featureText, { color: isDarkMode ? colors.darkText : colors.text }]}>Thông báo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.featureButton,
              activeFeature === "aiAssistant" && [
                styles.activeFeature,
                { backgroundColor: isDarkMode ? colors.dark.background : colors.white }
              ]
            ]}
            onPress={() => setActiveFeature("aiAssistant")}
          >
            <Text style={styles.featureIcon}>🤖</Text>
            <Text style={[styles.featureText, { color: isDarkMode ? colors.darkText : colors.text }]}>Trợ lý AI</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {renderFeatureContent()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  featureSelector: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 8,
  },
  featureButton: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  activeFeature: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
})

export default SuggestionsTab
