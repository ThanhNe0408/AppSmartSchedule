"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native"
import Slider from "@react-native-community/slider"
import Card from "../UI/Card"
import CustomButton from "../UI/CustomButton"
import { useAuth } from "../context/AuthContext"
import { saveUserPreferences } from "../../services/firestore"
import Sound from "react-native-sound"

// Enable sound playback
Sound.setCategory("Playback")

interface ReminderSetting {
  id: string
  title: string
  description: string
  enabled: boolean
}

interface VoiceLanguage {
  id: string
  name: string
  code: string
  selected: boolean
}

interface ReminderTemplate {
  id: string
  name: string
  content: string
}

interface ReminderSound {
  id: string
  name: string
  file: string
  selected: boolean
}

// Add this at the top of the component
const VoiceReminders = () => {
  const { user } = useAuth()
  const [reminderSettings, setReminderSettings] = useState<ReminderSetting[]>([
    {
      id: "1",
      title: "Nhắc nhở bằng giọng nói",
      description: "Đọc thông báo nhắc nhở bằng giọng nói",
      enabled: true,
    },
    {
      id: "2",
      title: "Nhắc nhở trước 15 phút",
      description: "Nhận thông báo trước khi sự kiện bắt đầu",
      enabled: true,
    },
    {
      id: "3",
      title: "Nhắc nhở khi di chuyển",
      description: "Nhắc nhở khi bạn cần di chuyển đến địa điểm khác",
      enabled: false,
    },
    {
      id: "4",
      title: "Tự động điều chỉnh",
      description: "Tự động điều chỉnh thời gian nhắc nhở dựa trên thói quen",
      enabled: true,
    },
  ])

  const [languages, setLanguages] = useState<VoiceLanguage[]>([
    { id: "vi", name: "Tiếng Việt", code: "vi-VN", selected: true },
    { id: "en", name: "Tiếng Anh", code: "en-US", selected: false },
  ])

  const [reminderSounds, setReminderSounds] = useState<ReminderSound[]>([
    { id: "default", name: "Mặc định", file: "default_sound.mp3", selected: true },
    { id: "bell", name: "Chuông", file: "bell_sound.mp3", selected: false },
    { id: "chime", name: "Tiếng chuông nhỏ", file: "chime_sound.mp3", selected: false },
    { id: "alert", name: "Cảnh báo", file: "alert_sound.mp3", selected: false },
    { id: "gentle", name: "Nhẹ nhàng", file: "gentle_sound.mp3", selected: false },
  ])

  // Add volume control state
  const [volume, setVolume] = useState(0.7)
  const [currentSound, setCurrentSound] = useState<Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Clean up sound when component unmounts
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.release()
      }
    }
  }, [currentSound])

  // Add this function to play sounds
  const playSound = (soundId: string) => {
    // Stop any currently playing sound
    if (currentSound) {
      currentSound.stop()
      currentSound.release()
      setCurrentSound(null)
    }

    // Find the selected sound
    const selectedSound = reminderSounds.find((sound) => sound.id === soundId)
    if (!selectedSound) return

    // Use online sound URLs instead of local files
    const soundUrls = {
      default: "https://www.soundjay.com/buttons/sounds/button-1.mp3",
      bell: "https://www.soundjay.com/bells/sounds/bell-ringing-01.mp3",
      chime: "https://www.soundjay.com/bells/sounds/bell-small-1.mp3",
      alert: "https://www.soundjay.com/mechanical/sounds/alert-3-1.mp3",
      gentle: "https://www.soundjay.com/nature/sounds/birds-2.mp3",
    }

    const soundUrl = soundUrls[soundId as keyof typeof soundUrls] || soundUrls.default

    // Create and play the sound
    const sound = new Sound(soundUrl, "", (error) => {
      if (error) {
        console.error("Failed to load sound", error)
        Alert.alert("Lỗi", "Không thể phát âm thanh")
        return
      }

      // Set volume and play
      sound.setVolume(volume)
      sound.play((success) => {
        if (success) {
          console.log("Sound played successfully")
        } else {
          console.log("Sound playback failed")
        }
        setIsPlaying(false)
      })

      setCurrentSound(sound)
      setIsPlaying(true)
    })
  }

  // Add this function to stop sound
  const stopSound = () => {
    if (currentSound) {
      currentSound.stop()
      setIsPlaying(false)
    }
  }

  // Add this function to change volume
  const changeVolume = (value: number) => {
    setVolume(value)
    if (currentSound) {
      currentSound.setVolume(value)
    }
  }

  const [reminderTemplates, setReminderTemplates] = useState<ReminderTemplate[]>([
    {
      id: "1",
      name: "Mặc định",
      content: "Nhắc nhở: Sự kiện [TÊN SỰ KIỆN] sẽ bắt đầu trong [THỜI GIAN] nữa tại [ĐỊA ĐIỂM].",
    },
    {
      id: "2",
      name: "Đơn giản",
      content: "Sự kiện [TÊN SỰ KIỆN] sắp diễn ra.",
    },
    {
      id: "3",
      name: "Chi tiết",
      content:
        "Nhắc nhở lịch học: Môn [TÊN SỰ KIỆN] sẽ bắt đầu lúc [GIỜ BẮT ĐẦU] tại phòng [ĐỊA ĐIỂM]. Giảng viên: [GIẢNG VIÊN].",
    },
  ])

  // State for modals
  const [soundModalVisible, setSoundModalVisible] = useState(false)
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [editTemplateModalVisible, setEditTemplateModalVisible] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<ReminderTemplate | null>(null)
  const [editedTemplateName, setEditedTemplateName] = useState("")
  const [editedTemplateContent, setEditedTemplateContent] = useState("")

  const toggleSetting = (id: string) => {
    const updatedSettings = reminderSettings.map((setting) =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting,
    )

    setReminderSettings(updatedSettings)

    // Save to user preferences if logged in
    if (user) {
      try {
        saveUserPreferences(user.id, {
          voiceReminders: updatedSettings.map((setting) => ({
            id: setting.id,
            enabled: setting.enabled,
          })),
        })
      } catch (error) {
        console.error("Error saving reminder settings:", error)
      }
    }
  }

  const selectLanguage = (id: string) => {
    setLanguages(
      languages.map((lang) => ({
        ...lang,
        selected: lang.id === id,
      })),
    )
  }

  const selectSound = (id: string) => {
    setReminderSounds(
      reminderSounds.map((sound) => ({
        ...sound,
        selected: sound.id === id,
      })),
    )
  }

  const testVoiceReminder = () => {
    const selectedLanguage = languages.find((lang) => lang.selected)
    const selectedSound = reminderSounds.find((sound) => sound.selected)

    // Create reminder message based on selected language
    let reminderMessage = ""

    if (selectedLanguage?.id === "vi") {
      reminderMessage =
        "Xin chào! Đây là nhắc nhở cho sự kiện sắp tới của bạn: Lớp học Lập trình Web sẽ bắt đầu trong 15 phút nữa tại phòng A5.01."
    } else {
      reminderMessage =
        "Hello! This is a reminder for your upcoming event: Web Programming class will start in 15 minutes in room A5.01."
    }

    // Show alert with the message that would be spoken
    Alert.alert("Thử nghiệm nhắc nhở", `${reminderMessage}\n\n(Âm thanh: ${selectedSound?.name || "Mặc định"})`, [
      { text: "OK" },
    ])

    // Save reminder settings to user preferences
    if (user) {
      try {
        // Save reminder settings
        saveUserPreferences(user.id, {
          voiceReminders: reminderSettings.map((setting) => ({
            id: setting.id,
            enabled: setting.enabled,
          })),
          selectedLanguage: selectedLanguage?.id || "vi",
          selectedSound: selectedSound?.id || "default",
        })

        // Register reminders for upcoming events
        if (reminderSettings[0].enabled) {
          scheduleReminders()
        }
      } catch (error) {
        console.error("Lỗi lưu cài đặt nhắc nhở:", error)
      }
    }
  }

  // Thêm hàm lên lịch nhắc nhở
  const scheduleReminders = async () => {
    if (!user) return

    try {
      // Mô phỏng việc lên lịch thông báo
      Alert.alert("Đã lên lịch nhắc nhở", "Đã lên lịch nhắc nhở cho tất cả sự kiện sắp tới của bạn.", [{ text: "OK" }])
    } catch (error) {
      console.error("Lỗi lên lịch nhắc nhở:", error)
      Alert.alert("Lỗi", "Không thể lên lịch nhắc nhở. Vui lòng thử lại sau.")
    }
  }

  // Open template edit modal
  const openEditTemplateModal = (template: ReminderTemplate | null) => {
    setCurrentTemplate(template)

    if (template) {
      // Edit existing template
      setEditedTemplateName(template.name)
      setEditedTemplateContent(template.content)
    } else {
      // Create new template
      setEditedTemplateName("")
      setEditedTemplateContent("")
    }

    setEditTemplateModalVisible(true)
  }

  // Save template
  const saveTemplate = () => {
    if (!editedTemplateName || !editedTemplateContent) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin mẫu nhắc nhở")
      return
    }

    if (currentTemplate) {
      // Update existing template
      setReminderTemplates(
        reminderTemplates.map((template) =>
          template.id === currentTemplate.id
            ? { ...template, name: editedTemplateName, content: editedTemplateContent }
            : template,
        ),
      )
    } else {
      // Create new template
      const newTemplate: ReminderTemplate = {
        id: Date.now().toString(),
        name: editedTemplateName,
        content: editedTemplateContent,
      }
      setReminderTemplates([...reminderTemplates, newTemplate])
    }

    setEditTemplateModalVisible(false)
  }

  // Delete template
  const deleteTemplate = (id: string) => {
    if (reminderTemplates.length <= 1) {
      Alert.alert("Lỗi", "Bạn cần giữ lại ít nhất một mẫu nhắc nhở")
      return
    }

    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa mẫu nhắc nhở này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setReminderTemplates(reminderTemplates.filter((template) => template.id !== id))
        },
      },
    ])
  }

  return (
    <ScrollView>
      <Card title="🔔 Nhắc nhở thông minh bằng giọng nói">
        <Text style={styles.description}>
          Cấu hình nhắc nhở bằng giọng nói để không bỏ lỡ các sự kiện quan trọng trong lịch trình của bạn.
        </Text>

        <View style={styles.settingsContainer}>
          {reminderSettings.map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDescription}>{setting.description}</Text>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: "#E0E0E0", true: "#6C63FF" }}
                thumbColor={setting.enabled ? "#FFFFFF" : "#F5F5F5"}
              />
            </View>
          ))}
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>Ngôn ngữ nhắc nhở</Text>
          <View style={styles.languageOptions}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.id}
                style={[styles.languageOption, language.selected && styles.selectedLanguage]}
                onPress={() => selectLanguage(language.id)}
              >
                <Text style={[styles.languageText, language.selected && styles.selectedLanguageText]}>
                  {language.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.voicePreview}>
          <Text style={styles.sectionTitle}>Thử nghiệm giọng nói</Text>
          <Text style={styles.previewDescription}>Nghe thử giọng nói sẽ được sử dụng cho các nhắc nhở của bạn.</Text>
          <CustomButton title="Phát thử giọng nói" onPress={testVoiceReminder} style={styles.testButton} />
        </View>

        <View style={styles.customizationSection}>
          <Text style={styles.sectionTitle}>Tùy chỉnh nhắc nhở</Text>
          <View style={styles.customizationOptions}>
            <TouchableOpacity style={styles.customizationOption} onPress={() => setTemplateModalVisible(true)}>
              <Text style={styles.customizationIcon}>📝</Text>
              <Text style={styles.customizationText}>Mẫu nhắc nhở</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.customizationOption} onPress={() => setSoundModalVisible(true)}>
              <Text style={styles.customizationIcon}>🔊</Text>
              <Text style={styles.customizationText}>Âm thanh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.customizationOption}
              onPress={() => {
                Alert.alert("Thời gian nhắc nhở", "Chọn thời gian nhắc nhở trước sự kiện:", [
                  { text: "5 phút", onPress: () => Alert.alert("Đã chọn", "Nhắc nhở trước 5 phút") },
                  { text: "15 phút", onPress: () => Alert.alert("Đã chọn", "Nhắc nhở trước 15 phút") },
                  { text: "30 phút", onPress: () => Alert.alert("Đã chọn", "Nhắc nhở trước 30 phút") },
                  { text: "1 giờ", onPress: () => Alert.alert("Đã chọn", "Nhắc nhở trước 1 giờ") },
                  { text: "Hủy", style: "cancel" },
                ])
              }}
            >
              <Text style={styles.customizationIcon}>⏱️</Text>
              <Text style={styles.customizationText}>Thời gian</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Sound Selection Modal */}
      <Modal
        visible={soundModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSoundModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn âm thanh nhắc nhở</Text>

            <FlatList
              data={reminderSounds}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.soundItem, item.selected && styles.selectedSoundItem]}
                  onPress={() => selectSound(item.id)}
                >
                  <Text style={styles.soundIcon}>🔊</Text>
                  <Text style={styles.soundName}>{item.name}</Text>
                  {item.selected && <Text style={styles.selectedMark}>✓</Text>}
                </TouchableOpacity>
              )}
              style={styles.soundList}
            />

            <View style={styles.volumeContainer}>
              <Text style={styles.volumeLabel}>Âm lượng: {Math.round(volume * 100)}%</Text>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={changeVolume}
                minimumTrackTintColor="#6C63FF"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#6C63FF"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSoundModalVisible(false)}
              >
                <Text style={styles.buttonText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.testButton]}
                onPress={() => {
                  const selectedSound = reminderSounds.find((sound) => sound.selected)
                  if (selectedSound) {
                    playSound(selectedSound.id)
                  }
                }}
              >
                <Text style={styles.buttonText}>{isPlaying ? "Dừng" : "Thử âm thanh"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        visible={templateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mẫu nhắc nhở</Text>

            <FlatList
              data={reminderTemplates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.templateItem}>
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateName}>{item.name}</Text>
                    <View style={styles.templateActions}>
                      <TouchableOpacity style={styles.templateAction} onPress={() => openEditTemplateModal(item)}>
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.templateAction} onPress={() => deleteTemplate(item.id)}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.templateContent}>{item.content}</Text>
                </View>
              )}
              style={styles.templateList}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setTemplateModalVisible(false)}
              >
                <Text style={styles.buttonText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={() => openEditTemplateModal(null)}
              >
                <Text style={styles.buttonText}>Thêm mẫu mới</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        visible={editTemplateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditTemplateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentTemplate ? "Chỉnh sửa mẫu nhắc nhở" : "Thêm mẫu nhắc nhở mới"}
            </Text>

            <Text style={styles.inputLabel}>Tên mẫu:</Text>
            <TextInput
              style={styles.modalInput}
              value={editedTemplateName}
              onChangeText={setEditedTemplateName}
              placeholder="Nhập tên mẫu nhắc nhở"
            />

            <Text style={styles.inputLabel}>Nội dung:</Text>
            <TextInput
              style={[styles.modalInput, styles.multilineInput]}
              value={editedTemplateContent}
              onChangeText={setEditedTemplateContent}
              placeholder="Nhập nội dung mẫu nhắc nhở"
              multiline={true}
              numberOfLines={5}
            />

            <Text style={styles.templateHint}>
              Sử dụng các biến: [TÊN SỰ KIỆN], [THỜI GIAN], [ĐỊA ĐIỂM], [GIỜ BẮT ĐẦU], [GIẢNG VIÊN]
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditTemplateModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveTemplate}>
                <Text style={styles.buttonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  settingsContainer: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
  },
  languageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedLanguage: {
    backgroundColor: "#F0F0FF",
    borderColor: "#6C63FF",
  },
  languageText: {
    fontSize: 14,
    color: "#666",
  },
  selectedLanguageText: {
    color: "#6C63FF",
    fontWeight: "600",
  },
  voicePreview: {
    marginBottom: 24,
  },
  previewDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: "#6C63FF",
  },
  customizationSection: {
    marginBottom: 16,
  },
  customizationOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customizationOption: {
    width: "30%",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  customizationIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  customizationText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  soundList: {
    marginBottom: 16,
    maxHeight: 300,
  },
  soundItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  selectedSoundItem: {
    backgroundColor: "#F0F0FF",
    borderWidth: 1,
    borderColor: "#6C63FF",
  },
  soundIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  soundName: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  selectedMark: {
    fontSize: 16,
    color: "#6C63FF",
    fontWeight: "bold",
  },
  templateList: {
    marginBottom: 16,
    maxHeight: 300,
  },
  templateItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  templateActions: {
    flexDirection: "row",
  },
  templateAction: {
    padding: 4,
    marginLeft: 8,
  },
  templateContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  templateHint: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  addButton: {
    backgroundColor: "#6C63FF",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  volumeContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  volumeSlider: {
    width: "100%",
    height: 40,
  },
})

export default VoiceReminders
