"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Animated,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import DateTimePicker from "@react-native-community/datetimepicker"
import Slider from "@react-native-community/slider"
import Sound from 'react-native-sound'
import notifee, {
  type TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  EventType,
} from "@notifee/react-native"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { COLORS } from "../../styles/theme"

// Define types for notification settings
interface NotificationSound {
  id: string
  name: string
  file: string
  selected: boolean
}

interface NotificationSettings {
  enabled: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  selectedSoundId: string
  volume: number
  repeatFrequency: RepeatFrequency | null
  snoozeEnabled: boolean
  snoozeDuration: number // in minutes
  smartNotifications: boolean
  notificationColor: string
  notificationIcon: string
  showInForeground: boolean
}

interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
}

// Add this after the interfaces
Sound.setCategory('Playback')

// Add this function before the NotificationManager component
const playSound = (soundUrl: string) => {
  if (!soundUrl) return;
  const sound = new Sound(soundUrl, undefined, (error: any) => {
    if (error) {
      console.error('Failed to load sound', error);
      return;
    }
    sound.play((success: boolean) => {
      if (!success) {
        console.error('Sound playback failed');
      }
      sound.release();
    });
  });
}

const NotificationManager: React.FC = () => {
  const { user } = useAuth()
  const { isDarkMode, colors } = useTheme()
  const [isPlaying, setIsPlaying] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  // State for notification settings
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    selectedSoundId: "default",
    volume: 0.7,
    repeatFrequency: null,
    snoozeEnabled: true,
    snoozeDuration: 5,
    smartNotifications: false,
    notificationColor: "#6C63FF",
    notificationIcon: "ic_notification",
    showInForeground: true,
  })

  // State for notification sounds
  const [sounds, setSounds] = useState<NotificationSound[]>([
    { id: "default", name: "Mặc định", file: "https://www.soundjay.com/buttons/sounds/button-1.mp3", selected: true },
    { id: "bell", name: "Chuông", file: "https://www.soundjay.com/bells/sounds/bell-ringing-01.mp3", selected: false },
    { id: "chime", name: "Tiếng chuông nhỏ", file: "https://www.soundjay.com/bells/sounds/bell-small-1.mp3", selected: false },
    { id: "alert", name: "Cảnh báo", file: "https://www.soundjay.com/mechanical/sounds/alert-3-1.mp3", selected: false },
    { id: "gentle", name: "Nhẹ nhàng", file: "https://www.soundjay.com/nature/sounds/birds-2.mp3", selected: false },
    { id: "digital", name: "Kỹ thuật số", file: "https://www.soundjay.com/button/beep-07.wav", selected: false },
    { id: "melody", name: "Giai điệu", file: "https://www.soundjay.com/button/beep-10.wav", selected: false },
  ])

  // State for notification templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: "1",
      name: "Mặc định",
      title: "Nhắc nhở",
      body: "Đã đến lúc cho sự kiện [TÊN SỰ KIỆN] của bạn!",
    },
    {
      id: "2",
      name: "Chi tiết",
      title: "Nhắc nhở: [TÊN SỰ KIỆN]",
      body: "Sự kiện của bạn sẽ bắt đầu vào lúc [GIỜ] tại [ĐỊA ĐIỂM]. Đừng quên chuẩn bị!",
    },
    {
      id: "3",
      name: "Ngắn gọn",
      title: "Nhắc nhở",
      body: "[TÊN SỰ KIỆN] sắp diễn ra.",
    },
  ])

  // State for modals
  const [soundModalVisible, setSoundModalVisible] = useState(false)
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [editTemplateModalVisible, setEditTemplateModalVisible] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<NotificationTemplate | null>(null)
  const [editedTemplateName, setEditedTemplateName] = useState("")
  const [editedTemplateTitle, setEditedTemplateTitle] = useState("")
  const [editedTemplateBody, setEditedTemplateBody] = useState("")

  // State for date time picker
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [notificationDate, setNotificationDate] = useState(new Date())
  const [notificationTime, setNotificationTime] = useState(new Date())
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")

  // Thêm state để bật/tắt thông báo
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Load settings from storage when component mounts
  useEffect(() => {
    loadSettings()

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()

    return () => {
      // Clean up
      if (isPlaying) {
        // Reset TrackPlayer
      }
    }
  }, [])

  // Load settings from storage
  const loadSettings = async () => {
    try {
      // In a real app, you would load from AsyncStorage or Firestore
      // For now, we'll just use the default settings
      console.log("Loading notification settings...")
    } catch (error) {
      console.error("Error loading notification settings:", error)
    }
  }

  // Save settings to storage
  const saveSettings = async () => {
    try {
      // In a real app, you would save to AsyncStorage or Firestore
      console.log("Saving notification settings:", settings)
      Alert.alert("Thành công", "Đã lưu cài đặt thông báo")
    } catch (error) {
      console.error("Error saving notification settings:", error)
      Alert.alert("Lỗi", "Không thể lưu cài đặt thông báo")
    }
  }

  // Update a setting
  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Select a sound
  const selectSound = (id: string) => {
    setSounds(
      sounds.map((sound) => ({
        ...sound,
        selected: sound.id === id,
      })),
    )
    updateSetting("selectedSoundId", id)
  }

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setNotificationDate(selectedDate)
    }
  }

  // Handle time change
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setNotificationTime(selectedTime)
    }
  }

  // Schedule a notification
  const scheduleNotification = async () => {
    if (!notificationsEnabled) {
      Alert.alert("Thông báo đã tắt", "Bạn cần bật thông báo để lên lịch nhắc nhở.")
      return
    }
    try {
      if (!notificationTitle || !notificationBody) {
        Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và nội dung thông báo")
        return
      }

      // Create a combined date and time
      const scheduledDate = new Date(notificationDate)
      scheduledDate.setHours(notificationTime.getHours(), notificationTime.getMinutes(), notificationTime.getSeconds())

      // Check if the scheduled time is in the past
      if (scheduledDate.getTime() <= Date.now()) {
        Alert.alert("Lỗi", "Thời gian thông báo phải ở tương lai")
        return
      }

      // Lấy tên soundId không có đuôi .mp3
      const soundId = settings.selectedSoundId.replace('.mp3', '')

      // Create a notification channel for Android
      let channelId = soundId || 'alarm';
      if (Platform.OS === "android") {
        channelId = await notifee.createChannel({
          id: soundId || "alarm",
          name: "Alarm Channel",
          sound: soundId,
          vibration: true,
          importance: AndroidImportance.HIGH,
        });
      }

      // Create the trigger
      const trigger = {
        type: TriggerType.TIMESTAMP as const,
        timestamp: scheduledDate.getTime(),
      }

      // Schedule the notification
      await notifee.createTriggerNotification(
        {
          title: notificationTitle,
          body: notificationBody,
          android: {
            channelId: channelId,
            importance: AndroidImportance.HIGH,
            sound: soundId,
            vibrationPattern: [500, 1000, 500, 1000],
            color: settings.notificationColor,
            smallIcon: "ic_notification",
            pressAction: {
              id: "stop_alarm",
            },
            category: AndroidCategory.ALARM,
            visibility: AndroidVisibility.PUBLIC,
            autoCancel: false,
            ongoing: true,
            fullScreenAction: {
              id: 'stop_alarm',
            },
          },
          ios: {
            sound: soundId,
            foregroundPresentationOptions: {
              badge: true,
              sound: true,
              banner: true,
              list: true,
            },
          },
        },
        trigger,
      )

      Alert.alert("Thành công", "Đã lên lịch thông báo kiểu báo thức!")

      // Reset form
      setNotificationTitle("")
      setNotificationBody("")
      setNotificationDate(new Date())
      setNotificationTime(new Date())
    } catch (error) {
      console.error("Error scheduling notification:", error)
      Alert.alert("Lỗi", "Không thể lên lịch thông báo")
    }
  }

  // Lắng nghe sự kiện bấm vào notification để tắt báo thức
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.pressAction?.id === 'stop_alarm') {
        notifee.cancelAllNotifications();
      }
    });
    return () => unsubscribe();
  }, []);

  // Test notification
  const testNotification = async () => {
    try {
      let channelId = 'alarm';
      if (Platform.OS === "android") {
        channelId = await notifee.createChannel({
          id: "alarm",
          name: "Alarm Channel",
          sound: 'default',
          vibration: true,
          importance: AndroidImportance.HIGH,
        });
      }
      await notifee.displayNotification({
        title: "Báo thức!",
        body: "Đây là thông báo thử nghiệm kiểu báo thức.",
        android: {
          channelId: channelId,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [500, 1000, 500, 1000],
          color: settings.notificationColor,
          smallIcon: "ic_notification",
          pressAction: {
            id: "default",
          },
          category: AndroidCategory.ALARM,
          visibility: AndroidVisibility.PUBLIC,
          autoCancel: false,
          ongoing: true,
          fullScreenAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            badge: true,
            sound: true,
            banner: true,
            list: true,
          },
        },
      })
    } catch (error) {
      console.error("Error testing notification:", error)
      Alert.alert("Lỗi", "Không thể hiển thị thông báo thử nghiệm")
    }
  }

  // Cancel all notifications
  const cancelAllNotifications = async () => {
    try {
      await notifee.cancelAllNotifications()
      Alert.alert("Thành công", "Đã hủy tất cả thông báo")
    } catch (error) {
      console.error("Error canceling notifications:", error)
      Alert.alert("Lỗi", "Không thể hủy thông báo")
    }
  }

  // Get all scheduled notifications
  const getScheduledNotifications = async () => {
    try {
      const notifications = await notifee.getTriggerNotifications()
      if (notifications.length === 0) {
        Alert.alert("Thông báo", "Không có thông báo nào được lên lịch")
      } else {
        // Tạo danh sách chi tiết
        const list = notifications.map((n, idx) => {
          const title = n.notification.title || "(Không tiêu đề)"
          const body = n.notification.body || ""
          let time = ""
          if (n.trigger && 'timestamp' in n.trigger && n.trigger.timestamp) {
            const d = new Date(n.trigger.timestamp)
            time = d.toLocaleString()
          }
          return `${idx + 1}. ${title}\n${body}${time ? `\nThời gian: ${time}` : ''}`
        }).join("\n\n")
        Alert.alert("Thông báo đã lên lịch", list)
      }
    } catch (error) {
      console.error("Error getting scheduled notifications:", error)
      Alert.alert("Lỗi", "Không thể lấy danh sách thông báo")
    }
  }

  const openEditTemplateModal = (template: NotificationTemplate | null) => {
    setCurrentTemplate(template);
    if (template) {
      setEditedTemplateName(template.name);
      setEditedTemplateTitle(template.title);
      setEditedTemplateBody(template.body);
    } else {
      setEditedTemplateName("");
      setEditedTemplateTitle("");
      setEditedTemplateBody("");
    }
    setEditTemplateModalVisible(true);
  };

  const saveTemplate = () => {
    if (!editedTemplateName || !editedTemplateTitle || !editedTemplateBody) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin mẫu thông báo");
      return;
    }
    if (currentTemplate) {
      setTemplates(
        templates.map((template) =>
          template.id === currentTemplate.id
            ? {
                ...template,
                name: editedTemplateName,
                title: editedTemplateTitle,
                body: editedTemplateBody,
              }
            : template
        )
      );
    } else {
      const newTemplate: NotificationTemplate = {
        id: Date.now().toString(),
        name: editedTemplateName,
        title: editedTemplateTitle,
        body: editedTemplateBody,
      };
      setTemplates([...templates, newTemplate]);
    }
    setEditTemplateModalVisible(false);
  };

  const deleteTemplate = (id: string) => {
    if (templates.length <= 1) {
      Alert.alert("Lỗi", "Bạn cần giữ lại ít nhất một mẫu thông báo");
      return;
    }
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa mẫu thông báo này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setTemplates(templates.filter((template) => template.id !== id));
        },
      },
    ]);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Icon name="notifications" size={28} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Quản lý thông báo thông minh</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Bật/Tắt thông báo</Text>
              <Text style={styles.settingDescription}>Cho phép nhận thông báo nhắc nhở</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#767577", true: COLORS.primary }}
              thumbColor={notificationsEnabled ? "#FFFFFF" : "#F5F5F5"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tùy chỉnh thông báo</Text>
          <TouchableOpacity style={styles.customizationButton} onPress={() => setSoundModalVisible(true)}>
            <Icon name="music-note" size={24} color={COLORS.primary} />
            <View style={styles.customizationInfo}>
              <Text style={styles.customizationTitle}>Âm thanh thông báo</Text>
              <Text style={styles.customizationDescription}>
                {sounds.find((sound) => sound.id === settings.selectedSoundId)?.name || "Mặc định"}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.customizationButton} onPress={() => setTemplateModalVisible(true)}>
            <Icon name="description" size={24} color={COLORS.primary} />
            <View style={styles.customizationInfo}>
              <Text style={styles.customizationTitle}>Mẫu thông báo</Text>
              <Text style={styles.customizationDescription}>Quản lý các mẫu thông báo</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tạo thông báo mới</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tiêu đề thông báo</Text>
            <TextInput
              style={styles.textInput}
              value={notificationTitle}
              onChangeText={setNotificationTitle}
              placeholder="Nhập tiêu đề thông báo"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nội dung thông báo</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={notificationBody}
              onChangeText={setNotificationBody}
              placeholder="Nhập nội dung thông báo"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.dateTimeContainer}>
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar-today" size={24} color={COLORS.primary} />
              <Text style={styles.dateTimeText}>
                {notificationDate.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
              <Icon name="access-time" size={24} color={COLORS.primary} />
              <Text style={styles.dateTimeText}>
                {notificationTime.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={notificationDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker value={notificationTime} mode="time" display="default" onChange={onTimeChange} />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.scheduleButton} onPress={scheduleNotification}>
              <Icon name="alarm-add" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Lên lịch thông báo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý thông báo</Text>
          <View style={styles.managementButtons}>
            <TouchableOpacity style={styles.managementButton} onPress={testNotification}>
              <Icon name="notifications-active" size={24} color="#FFFFFF" />
              <Text style={styles.managementButtonText}>Thử thông báo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.managementButton} onPress={getScheduledNotifications}>
              <Icon name="list" size={24} color="#FFFFFF" />
              <Text style={styles.managementButtonText}>Xem thông báo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.managementButton, styles.cancelButton]} onPress={cancelAllNotifications}>
              <Icon name="notifications-off" size={24} color="#FFFFFF" />
              <Text style={styles.managementButtonText}>Hủy tất cả</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Sound Selection Modal */}
        <Modal
          visible={soundModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSoundModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn âm thanh thông báo</Text>
                <TouchableOpacity onPress={() => setSoundModalVisible(false)}>
                  <Icon name="close" size={24} color="#999999" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={sounds}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.soundItem, item.selected && styles.selectedSoundItem]}
                    onPress={() => selectSound(item.id)}
                  >
                    <Icon
                      name={item.selected ? "radio-button-checked" : "radio-button-unchecked"}
                      size={24}
                      color={item.selected ? COLORS.primary : "#CCCCCC"}
                    />
                    <Text style={styles.soundName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={styles.soundList}
              />

              <TouchableOpacity style={styles.modalButton} onPress={() => setSoundModalVisible(false)}>
                <Text style={styles.modalButtonText}>Xác nhận</Text>
              </TouchableOpacity>
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
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mẫu thông báo</Text>
                <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
                  <Icon name="close" size={24} color="#999999" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={templates}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.templateItem}>
                    <View style={styles.templateHeader}>
                      <Text style={styles.templateName}>{item.name}</Text>
                      <View style={styles.templateActions}>
                        <TouchableOpacity style={styles.templateAction} onPress={() => openEditTemplateModal(item)}>
                          <Icon name="edit" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.templateAction} onPress={() => deleteTemplate(item.id)}>
                          <Icon name="delete" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.templateTitle}>{item.title}</Text>
                    <Text style={styles.templateBody}>{item.body}</Text>
                  </View>
                )}
                style={styles.templateList}
              />

              <TouchableOpacity style={styles.addTemplateButton} onPress={() => openEditTemplateModal(null)}>
                <Icon name="add" size={24} color="#FFFFFF" />
                <Text style={styles.addTemplateText}>Thêm mẫu mới</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButton} onPress={() => setTemplateModalVisible(false)}>
                <Text style={styles.modalButtonText}>Đóng</Text>
              </TouchableOpacity>
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
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {currentTemplate ? "Chỉnh sửa mẫu thông báo" : "Thêm mẫu thông báo mới"}
                </Text>
                <TouchableOpacity onPress={() => setEditTemplateModalVisible(false)}>
                  <Icon name="close" size={24} color="#999999" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tên mẫu</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedTemplateName}
                  onChangeText={setEditedTemplateName}
                  placeholder="Nhập tên mẫu thông báo"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tiêu đề thông báo</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedTemplateTitle}
                  onChangeText={setEditedTemplateTitle}
                  placeholder="Nhập tiêu đề thông báo"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nội dung thông báo</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  value={editedTemplateBody}
                  onChangeText={setEditedTemplateBody}
                  placeholder="Nhập nội dung thông báo"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <Text style={styles.templateHint}>
                Sử dụng các biến: [TÊN SỰ KIỆN], [GIỜ], [ĐỊA ĐIỂM], [NGÀY], [MÔ TẢ]
              </Text>

              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.cancelActionButton]}
                  onPress={() => setEditTemplateModalVisible(false)}
                >
                  <Text style={styles.cancelActionButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalActionButton, styles.saveActionButton]} onPress={saveTemplate}>
                  <Text style={styles.saveActionButtonText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginLeft: 12,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#999999",
  },
  customizationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  customizationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customizationTitle: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 4,
  },
  customizationDescription: {
    fontSize: 12,
    color: "#999999",
  },
  sliderContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  sliderValue: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderMarkers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  sliderMarkerText: {
    fontSize: 12,
    color: "#999999",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333333",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    flex: 0.48,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  dateTimeText: {
    fontSize: 16,
    color: "#333333",
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 8,
  },
  scheduleButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  managementButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  managementButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flex: 0.32,
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
  },
  managementButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  saveSettingsButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  soundList: {
    marginBottom: 16,
  },
  soundItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedSoundItem: {
    backgroundColor: "#F0F8FF",
  },
  soundName: {
    fontSize: 16,
    color: "#333333",
    flex: 1,
    marginLeft: 12,
  },
  playButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  volumeContainer: {
    marginBottom: 16,
  },
  volumeLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  volumeValue: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  volumeSlider: {
    width: "100%",
    height: 40,
  },
  volumeIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  templateList: {
    marginBottom: 16,
  },
  templateItem: {
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
  templateActions: {
    flexDirection: "row",
  },
  templateAction: {
    padding: 4,
    marginLeft: 8,
  },
  templateTitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  templateBody: {
    fontSize: 12,
    color: "#999999",
  },
  addTemplateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  addTemplateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  templateHint: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
    marginBottom: 16,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalActionButton: {
    borderRadius: 8,
    padding: 12,
    flex: 0.48,
    alignItems: "center",
  },
  cancelActionButton: {
    backgroundColor: "#F5F5F5",
  },
  saveActionButton: {
    backgroundColor: COLORS.primary,
  },
  cancelActionButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "700",
  },
  saveActionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
})

export default NotificationManager
