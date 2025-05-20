import React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import Card from "../UI/Card"
import CustomButton from "../UI/CustomButton"
import { COLORS } from "../../styles/theme"

// Create a new component for OpenRouter AI integration

const AIAssistant = () => {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)

  const renderSettingItem = (
    icon: string,
    title: string,
    description?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => {
    return (
      <TouchableOpacity 
        style={styles.settingItem} 
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.settingIconContainer, { backgroundColor: COLORS.primary }]}>
          <Icon name={icon} size={24} color="#FFFFFF" style={styles.settingIcon} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
        <View style={styles.settingRight}>
          {rightComponent || (
            <Icon name="chevron-right" size={24} color={COLORS.border} />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const saveAPIKey = () => {
    if (!apiKey.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập API key")
      return
    }

    // In a real app, you would securely store this key
    setIsConfigured(true)
    Alert.alert("Thành công", "Đã lưu API key thành công")
  }

  const generateResponse = async () => {
    if (!prompt.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập câu hỏi hoặc yêu cầu")
      return
    }

    if (!isConfigured) {
      Alert.alert("Lỗi", "Vui lòng cấu hình API key trước")
      return
    }

    setIsLoading(true)
    setResponse("")

    try {
      // In a real app, you would make an actual API call to OpenRouter
      // This is a simulation for demonstration purposes
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate different responses based on the prompt
      let simulatedResponse = ""

      if (prompt.toLowerCase().includes("lịch") || prompt.toLowerCase().includes("schedule")) {
        simulatedResponse =
          "Dựa trên lịch học của bạn, tôi đề xuất bạn nên dành thêm thời gian cho môn Lập trình Web vào thứ 4 và thứ 6. Bạn có thể tối ưu thời gian bằng cách kết hợp các buổi học cùng ngày để giảm thời gian di chuyển."
      } else if (prompt.toLowerCase().includes("học") || prompt.toLowerCase().includes("study")) {
        simulatedResponse =
          "Phân tích thói quen học tập của bạn cho thấy bạn hiệu quả nhất vào buổi sáng (8-11h). Tôi khuyên bạn nên sắp xếp các môn học khó vào khung giờ này và dành buổi chiều cho các hoạt động thực hành hoặc làm bài tập."
      } else if (prompt.toLowerCase().includes("thời gian") || prompt.toLowerCase().includes("time")) {
        simulatedResponse =
          "Để quản lý thời gian hiệu quả, bạn nên áp dụng phương pháp Pomodoro: học tập tập trung trong 25 phút, sau đó nghỉ ngơi 5 phút. Lặp lại 4 lần rồi nghỉ dài 15-30 phút. Phương pháp này giúp duy trì sự tập trung và tránh kiệt sức."
      } else {
        simulatedResponse =
          "Dựa trên dữ liệu học tập của bạn, tôi nhận thấy bạn đang tiến bộ tốt. Để cải thiện hơn nữa, hãy thử phân chia các nhiệm vụ lớn thành các phần nhỏ hơn và thiết lập thời hạn cụ thể cho mỗi phần. Điều này sẽ giúp bạn theo dõi tiến độ dễ dàng hơn và giảm cảm giác quá tải."
      }

      setResponse(simulatedResponse)
    } catch (error) {
      console.error("Error generating response:", error)
      Alert.alert("Lỗi", "Không thể tạo phản hồi. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.description}>
        Sử dụng sức mạnh của OpenRouter AI với mô hình Phi-4-reasoning-plus để nhận phân tích và gợi ý cá nhân hóa cho
        lịch trình học tập của bạn.
      </Text>

      {!isConfigured && (
        <View style={styles.settingsGroup}>
          {renderSettingItem(
            "key",
            "Cấu hình API Key",
            "Nhập API key của bạn từ OpenRouter để sử dụng mô hình AI",
            undefined,
            <View style={styles.configInput}>
              <TextInput
                style={styles.apiKeyInput}
                placeholder="Nhập API key (sk-or-v1-...)"
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
              <CustomButton 
                title="Lưu" 
                onPress={saveAPIKey} 
                style={styles.saveButton} 
              />
            </View>
          )}
        </View>
      )}

      {isConfigured && (
        <>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              "chat",
              "Hỏi trợ lý AI",
              "Nhập câu hỏi hoặc yêu cầu của bạn",
              undefined,
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.promptInput}
                  placeholder="Nhập câu hỏi..."
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, !prompt.trim() && styles.disabledButton]}
                  onPress={generateResponse}
                  disabled={!prompt.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>Gửi</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>Gợi ý câu hỏi</Text>
            {renderSettingItem(
              "schedule",
              "Tối ưu lịch học",
              "Làm thế nào để tối ưu lịch học của tôi?",
              () => setPrompt("Làm thế nào để tối ưu lịch học của tôi?")
            )}
            {renderSettingItem(
              "timer",
              "Quản lý thời gian",
              "Gợi ý cách quản lý thời gian hiệu quả",
              () => setPrompt("Gợi ý cách quản lý thời gian hiệu quả")
            )}
            {renderSettingItem(
              "trending-up",
              "Phân tích học tập",
              "Phân tích thói quen học tập của tôi",
              () => setPrompt("Phân tích thói quen học tập của tôi")
            )}
            {renderSettingItem(
              "balance",
              "Cân bằng cuộc sống",
              "Làm sao để cân bằng giữa học tập và giải trí?",
              () => setPrompt("Làm sao để cân bằng giữa học tập và giải trí?")
            )}
          </View>

          {response && (
            <View style={styles.settingsGroup}>
              <Text style={styles.groupTitle}>Phản hồi</Text>
              <View style={styles.responseContent}>
                <Text style={styles.responseText}>{response}</Text>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    marginHorizontal: 16,
    marginVertical: 16,
    lineHeight: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  settingsGroup: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
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
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  configInput: {
    flex: 1,
    marginLeft: 16,
  },
  apiKeyInput: {
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  inputContainer: {
    flex: 1,
    marginLeft: 16,
  },
  promptInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  responseContent: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.background,
    margin: 16,
    borderRadius: 8,
  },
  responseText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
})

export default AIAssistant
