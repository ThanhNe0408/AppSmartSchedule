"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native"
import { launchCamera, launchImageLibrary } from "react-native-image-picker"
import Card from "../UI/Card"
import CustomButton from "../UI/CustomButton"
import { useAuth } from "../context/AuthContext"
import { addEvent } from "../../services/firestore"
import MlkitOcr from "react-native-mlkit-ocr"

// Define the recognized event type
interface RecognizedEvent {
  id: string
  title: string
  date: Date
  startTime: string
  endTime: string
  location?: string
  description?: string
}

const ImageScheduleRecognition = () => {
  const { user } = useAuth()
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognizedEvents, setRecognizedEvents] = useState<RecognizedEvent[]>([])
  const [selectedEvents, setSelectedEvents] = useState<{ [key: string]: boolean }>({})
  const [ocrText, setOcrText] = useState<string>("")
  const [noScheduleFound, setNoScheduleFound] = useState(false)
  const [moduleDownloading, setModuleDownloading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // State for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentEditEvent, setCurrentEditEvent] = useState<RecognizedEvent | null>(null)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDate, setEditedDate] = useState("")
  const [editedStartTime, setEditedStartTime] = useState("")
  const [editedEndTime, setEditedEndTime] = useState("")
  const [editedLocation, setEditedLocation] = useState("")
  const [editedDescription, setEditedDescription] = useState("")

  // Request camera permissions (Android only)
  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: "Quyền truy cập máy ảnh",
          message: "Ứng dụng cần quyền truy cập máy ảnh để chụp ảnh lịch học",
          buttonNeutral: "Hỏi lại sau",
          buttonNegative: "Từ chối",
          buttonPositive: "Đồng ý",
        })

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Quyền bị từ chối", "Bạn cần cấp quyền truy cập máy ảnh để sử dụng tính năng này.")
          return false
        }
        return true
      } catch (err) {
        console.warn(err)
        return false
      }
    }
    return true
  }

  // Take a photo of schedule
  const takePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) return

      launchCamera(
        {
          mediaType: "photo",
          quality: 0.8,
          saveToPhotos: true,
        },
        (response) => {
          if (response.didCancel) {
            console.log("User cancelled camera")
          } else if (response.errorCode) {
            console.log("Camera Error: ", response.errorMessage)
            Alert.alert("Lỗi", `Lỗi máy ảnh: ${response.errorMessage}`)
          } else if (response.assets && response.assets.length > 0) {
            setImage(response.assets[0].uri || null)
            processImage(response.assets[0].uri || "")
          }
        },
      )
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("Lỗi", "Không thể sử dụng máy ảnh. Vui lòng thử lại.")
    }
  }

  // Select image from gallery
  const selectImage = () => {
    try {
      launchImageLibrary(
        {
          mediaType: "photo",
          quality: 0.8,
        },
        (response) => {
          if (response.didCancel) {
            console.log("User cancelled image picker")
          } else if (response.errorCode) {
            console.log("ImagePicker Error: ", response.errorMessage)
            Alert.alert("Lỗi", `Lỗi chọn ảnh: ${response.errorMessage}`)
          } else if (response.assets && response.assets.length > 0) {
            setImage(response.assets[0].uri || null)
            processImage(response.assets[0].uri || "")
          }
        },
      )
    } catch (error) {
      console.error("Error selecting image:", error)
      Alert.alert("Lỗi", "Không thể chọn ảnh từ thư viện.")
    }
  }

  // Process the image to extract schedule information using OCR
  const processImage = async (imageUri: string) => {
    if (!imageUri) return

    setIsProcessing(true)
    setNoScheduleFound(false)
    setRecognizedEvents([])
    setOcrText("")
    setModuleDownloading(false)

    try {
      // Perform OCR on the image
      let result
      try {
        console.log("Starting OCR on image:", imageUri)
        result = await MlkitOcr.detectFromUri(imageUri)
        console.log("OCR completed successfully")
      } catch (error) {
        const errorMessage = String(error)
        console.log("OCR Error:", errorMessage)

        if (
          errorMessage.includes("module to be downloaded") ||
          errorMessage.includes("MlKitException") ||
          errorMessage.includes("text optional module")
        ) {
          setModuleDownloading(true)
          setRetryCount(retryCount + 1)

          if (retryCount < 5) {
            Alert.alert(
              "Đang tải module nhận diện văn bản",
              "Hệ thống đang tải module nhận diện văn bản. Vui lòng đợi trong giây lát...",
              [
                {
                  text: "OK",
                  onPress: () => {
                    // Retry after a delay
                    setTimeout(() => {
                      processImage(imageUri)
                    }, 5000)
                  },
                },
              ],
            )
          } else {
            Alert.alert(
              "Không thể tải module",
              "Không thể tải module nhận diện văn bản sau nhiều lần thử. Vui lòng kiểm tra kết nối mạng và thử lại sau.",
            )
          }

          setIsProcessing(false)
          return
        } else {
          throw error
        }
      }

      // Extract text from OCR result
      const extractedText = result.map((block: any) => block.text).join("\n")
      setOcrText(extractedText)
      console.log("Extracted text:", extractedText)

      // Parse the OCR text to extract schedule information
      const events = parseScheduleFromText(extractedText)

      if (events.length > 0) {
        setRecognizedEvents(events)

        // Initialize all events as selected
        const initialSelection: { [key: string]: boolean } = {}
        events.forEach((event) => {
          initialSelection[event.id] = true
        })
        setSelectedEvents(initialSelection)

        Alert.alert("Thành công", `Đã nhận diện ${events.length} lịch học từ ảnh`)
      } else {
        setNoScheduleFound(true)
        Alert.alert(
          "Không tìm thấy lịch học",
          "Không thể nhận diện lịch học từ ảnh. Vui lòng thử lại với ảnh khác hoặc điều chỉnh góc chụp.",
        )
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setNoScheduleFound(true)
      Alert.alert("Lỗi", "Không thể xử lý ảnh. Vui lòng thử lại.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Create mock events for testing
  const createMockEvents = (): RecognizedEvent[] => {
    return [
      {
        id: "1",
        title: "Phát triển ứng dụng di động đa nền tảng (2+0)",
        date: new Date(2025, 4, 16), // May 16, 2025
        startTime: "7:00",
        endTime: "8:40",
        location: "K23-101",
        description: "Nhóm: CNTT.CQ.01, GV: Võ Văn Lên, Thứ 6, Tiết 1",
      },
      {
        id: "2",
        title: "Đồ án chuyên ngành (0+2)",
        date: new Date(2025, 4, 16), // May 16, 2025
        startTime: "13:40",
        endTime: "15:20",
        location: "E2-104",
        description: "Nhóm: CNTT.TH.05, GV: Dương Thị Kim Chi, Thứ 6, Tiết 8",
      },
      {
        id: "3",
        title: "Thực hành Phát triển ứng dụng di động đa nền tảng (0+1)",
        date: new Date(2025, 4, 14), // May 14, 2025
        startTime: "9:30",
        endTime: "11:10",
        location: "K23-203",
        description: "Nhóm: CNTT.TH.01, GV: Võ Văn Lên, Thứ 4, Tiết 3",
      },
    ]
  }

  // Parse schedule text to extract events
  const parseScheduleFromText = (text: string): RecognizedEvent[] => {
    const events: RecognizedEvent[] = []
    if (!text || text.trim() === "") return []

    // Tách các block bắt đầu bằng "Thứ X", nếu không có thì mỗi block là một event
    const blocks = text.split(/(?=Thứ\s*\d)/g).map(b => b.trim()).filter(Boolean)
    let id = 0

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      // Tìm thứ, nếu không có thì vẫn nhận diện event
      let dayMatch = lines[0].match(/Thứ\s*(\d)/)
      let weekday = dayMatch ? parseInt(dayMatch[1]) : undefined

      // Nếu không có "Thứ", lấy toàn bộ block làm event, ngày là hôm nay
      let title = '', location = '', teacher = '', group = '', code = '', description = ''
      let startLine = 1
      if (!lines[0].startsWith('Thứ')) {
        title = lines[0]
        startLine = 1
      } else {
        startLine = 1
      }

      for (const line of lines.slice(startLine)) {
        if (line.startsWith('Phòng:')) location = line.replace('Phòng:', '').trim()
        else if (line.startsWith('GV:')) teacher = line.replace('GV:', '').trim()
        else if (line.startsWith('Nhóm:')) group = line.replace('Nhóm:', '').trim()
        else if (!title) {
          title = line
          const codeMatch = title.match(/\(([^()]+)\)$/)
          code = codeMatch ? codeMatch[1] : ''
        } else {
          description += line + ' '
        }
      }

      // Ngày mặc định là hôm nay nếu không có thứ
      const today = new Date()
      const date = new Date(today)
      if (weekday) {
        const diff = weekday - (today.getDay() === 0 ? 7 : today.getDay())
        date.setDate(today.getDate() + diff)
      }

      const startTime = "07:00"
      const endTime = "08:40"

      if (title) {
        events.push({
          id: (++id).toString(),
          title: title.replace(/\s*\([^()]+\)$/, '').trim(),
          date,
          startTime,
          endTime,
          location,
          description: `Nhóm: ${group}${teacher ? ', GV: ' + teacher : ''}${code ? ', Mã: ' + code : ''}${description ? ', ' + description.trim() : ''}`,
        })
      }
    }
    return events
  }

  // Toggle event selection
  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents({
      ...selectedEvents,
      [eventId]: !selectedEvents[eventId],
    })
  }

  // Open edit modal
  const openEditModal = (event: RecognizedEvent) => {
    setCurrentEditEvent(event)
    setEditedTitle(event.title)
    setEditedDate(formatDate(event.date))
    setEditedStartTime(event.startTime)
    setEditedEndTime(event.endTime)
    setEditedLocation(event.location || "")
    setEditedDescription(event.description || "")
    setEditModalVisible(true)
  }

  // Save edited event
  const saveEventEdit = () => {
    if (!currentEditEvent) return

    // Parse date from string
    const dateParts = editedDate.split("/")
    if (dateParts.length !== 3) {
      Alert.alert("Lỗi", "Định dạng ngày không hợp lệ. Vui lòng sử dụng DD/MM/YYYY")
      return
    }

    const day = Number.parseInt(dateParts[0])
    const month = Number.parseInt(dateParts[1]) - 1
    const year = Number.parseInt(dateParts[2])
    const newDate = new Date(year, month, day)

    // Update event
    const updatedEvents = recognizedEvents.map((event) => {
      if (event.id === currentEditEvent.id) {
        return {
          ...event,
          title: editedTitle,
          date: newDate,
          startTime: editedStartTime,
          endTime: editedEndTime,
          location: editedLocation || undefined,
          description: editedDescription || undefined,
        }
      }
      return event
    })

    setRecognizedEvents(updatedEvents)

    // Update the selectedEvents state to maintain selection after edit
    const updatedSelectedEvents = { ...selectedEvents }
    updatedSelectedEvents[currentEditEvent.id] = selectedEvents[currentEditEvent.id] || true
    setSelectedEvents(updatedSelectedEvents)

    setEditModalVisible(false)

    // Show confirmation message
    Alert.alert("Thành công", "Đã cập nhật thông tin lịch học")
  }

  // Toggle select all events
  const toggleSelectAll = () => {
    if (recognizedEvents.length === 0) return

    // Check if all events are selected
    const allSelected = recognizedEvents.every((event) => selectedEvents[event.id])

    // Create new object with all events selected or deselected
    const newSelectedEvents: { [key: string]: boolean } = {}
    recognizedEvents.forEach((event) => {
      newSelectedEvents[event.id] = !allSelected
    })

    setSelectedEvents(newSelectedEvents)
  }

  // Add a single event to calendar
  const addEventToCalendar = async (event: RecognizedEvent) => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thêm lịch")
      return
    }

    setIsProcessing(true)

    try {
      await addEvent(user.id, {
        title: event.title,
        info: event.description || "",
        day: event.date.getDate().toString(),
        month: (event.date.getMonth() + 1).toString(),
        startTime: event.startTime,
        endTime: event.endTime,
        indicatorColor: "#4285F4", // Default color for classes
        date: event.date,
        userId: user.id,
      })

      Alert.alert("Thành công", "Đã thêm lịch vào lịch của bạn")

      // Remove the event from the list after adding
      setRecognizedEvents(recognizedEvents.filter((e) => e.id !== event.id))

      // Update selectedEvents
      const newSelectedEvents = { ...selectedEvents }
      delete newSelectedEvents[event.id]
      setSelectedEvents(newSelectedEvents)
    } catch (error) {
      console.error("Error adding event to calendar:", error)
      Alert.alert("Lỗi", "Không thể thêm lịch. Vui lòng thử lại sau.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Add selected events to calendar
  const addEventsToCalendar = async () => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thêm lịch")
      return
    }

    const eventsToAdd = recognizedEvents.filter((event) => selectedEvents[event.id])

    if (eventsToAdd.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một lịch để thêm")
      return
    }

    setIsProcessing(true)

    try {
      // Add each selected event to Firestore
      for (const event of eventsToAdd) {
        await addEvent(user.id, {
          title: event.title,
          info: event.description || "",
          day: event.date.getDate().toString(),
          month: (event.date.getMonth() + 1).toString(),
          startTime: event.startTime,
          endTime: event.endTime,
          indicatorColor: "#4285F4", // Default color for classes
          date: event.date,
          userId: user.id,
        })
      }

      Alert.alert("Thành công", `Đã thêm ${eventsToAdd.length} lịch vào lịch của bạn`)

      // Clear the recognized events after adding
      setRecognizedEvents([])
      setSelectedEvents({})
      setImage(null)
      setOcrText("")
    } catch (error) {
      console.error("Error adding events to calendar:", error)
      Alert.alert("Lỗi", "Không thể thêm lịch. Vui lòng thử lại sau.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }

  return (
    <ScrollView>
      <Card title="📷 Nhận diện lịch học từ ảnh">
        <Text style={styles.description}>
          Chụp ảnh hoặc chọn ảnh lịch học của bạn để tự động nhận diện và thêm vào lịch.
        </Text>

        <View style={styles.imageOptions}>
          <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
            <View style={styles.iconContainer}>
              <Text style={styles.optionIcon}>📸</Text>
            </View>
            <Text style={styles.optionText}>Chụp ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imageOption} onPress={selectImage}>
            <View style={styles.iconContainer}>
              <Text style={styles.optionIcon}>🖼️</Text>
            </View>
            <Text style={styles.optionText}>Chọn từ thư viện</Text>
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.processingText}>
              {moduleDownloading ? "Đang tải module nhận diện văn bản..." : "Đang xử lý ảnh..."}
            </Text>
          </View>
        )}

        {image && !isProcessing && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.previewTitle}>Ảnh đã chọn:</Text>
            <Image source={{ uri: image }} style={styles.imagePreview} />
          </View>
        )}

        {noScheduleFound && !isProcessing && (
          <View style={styles.noScheduleContainer}>
            <Text style={styles.noScheduleTitle}>Không tìm thấy lịch học</Text>
            <Text style={styles.noScheduleText}>
              Không thể nhận diện lịch học từ ảnh. Vui lòng thử lại với ảnh khác hoặc điều chỉnh góc chụp.
            </Text>

            {ocrText && (
              <View style={styles.ocrResultContainer}>
                <Text style={styles.ocrResultTitle}>Văn bản đã nhận diện:</Text>
                <View style={styles.ocrTextContainer}>
                  <Text style={styles.ocrText}>{ocrText}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {recognizedEvents.length > 0 && !isProcessing && (
          <View style={styles.recognizedEventsContainer}>
            <View style={styles.recognizedHeader}>
              <Text style={styles.recognizedTitle}>Lịch học đã nhận diện:</Text>
              <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
                <Text style={styles.selectAllText}>
                  {recognizedEvents.every((event) => selectedEvents[event.id]) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </Text>
              </TouchableOpacity>
            </View>

            {recognizedEvents.map((event) => (
              <View key={event.id} style={styles.eventItemContainer}>
                <TouchableOpacity
                  style={[
                    styles.eventItem,
                    selectedEvents[event.id] ? styles.selectedEventItem : styles.unselectedEventItem,
                  ]}
                  onPress={() => toggleEventSelection(event.id)}
                >
                  <View style={styles.eventCheckbox}>
                    {selectedEvents[event.id] && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                    <Text style={styles.eventTime}>
                      {event.startTime} - {event.endTime}
                    </Text>
                    {event.location && <Text style={styles.eventLocation}>Phòng: {event.location}</Text>}
                    {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.eventActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(event)}>
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addSingleButton} onPress={() => addEventToCalendar(event)}>
                    <Text>➕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <CustomButton
              title="Thêm vào lịch"
              onPress={addEventsToCalendar}
              style={styles.addButton}
              isLoading={isProcessing}
            />

            {ocrText && (
              <View style={styles.ocrResultContainer}>
                <Text style={styles.ocrResultTitle}>Văn bản gốc đã nhận diện:</Text>
                <TouchableOpacity style={styles.ocrTextContainer} onPress={() => Alert.alert("Văn bản OCR", ocrText)}>
                  <Text style={styles.ocrText} numberOfLines={5}>
                    {ocrText}
                  </Text>
                  <Text style={styles.viewMoreText}>Nhấn để xem đầy đủ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Mẹo để cải thiện nhận diện:</Text>
          <Text style={styles.tipItem}>• Chụp ảnh rõ nét, đủ sáng và thẳng góc</Text>
          <Text style={styles.tipItem}>• Đảm bảo văn bản trong ảnh rõ ràng, không bị mờ</Text>
          <Text style={styles.tipItem}>• Tránh chụp ảnh có bóng đổ hoặc phản chiếu</Text>
          <Text style={styles.tipItem}>• Lần đầu sử dụng cần đợi tải module nhận diện</Text>
        </View>
      </Card>

      {/* Edit event modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, width: "100%" }}
          >
            <View style={[styles.modalContent, { flexGrow: 1 }]}> 
              <ScrollView
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>Chỉnh sửa thông tin lịch học</Text>

                <Text style={styles.inputLabel}>Tên môn học:</Text>
                <TextInput style={styles.modalInput} value={editedTitle} onChangeText={setEditedTitle} />

                <Text style={styles.inputLabel}>Ngày (DD/MM/YYYY):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedDate}
                  onChangeText={setEditedDate}
                  placeholder="DD/MM/YYYY (mặc định là hôm nay nếu không nhận diện được)"
                  keyboardType="numbers-and-punctuation"
                />
                {(() => {
                  // Hiển thị cảnh báo nếu ngày là hôm nay (có thể là mặc định)
                  const today = new Date()
                  const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
                  if (editedDate === todayStr) {
                    return (
                      <Text style={{color: '#FF9800', fontSize: 12, marginBottom: 8}}>
                        Ngày này được mặc định là hôm nay, hãy kiểm tra lại nếu cần.
                      </Text>
                    )
                  }
                  return null
                })()}

                <Text style={styles.inputLabel}>Giờ bắt đầu (HH:MM):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedStartTime}
                  onChangeText={setEditedStartTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                />

                <Text style={styles.inputLabel}>Giờ kết thúc (HH:MM):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedEndTime}
                  onChangeText={setEditedEndTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                />

                <Text style={styles.inputLabel}>Phòng học:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedLocation}
                  onChangeText={setEditedLocation}
                  placeholder="Phòng học"
                />

                <Text style={styles.inputLabel}>Mô tả:</Text>
                <TextInput
                  style={[styles.modalInput, styles.multilineInput]}
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Mô tả (giảng viên, ghi chú...)"
                  multiline={true}
                  numberOfLines={3}
                />
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveEventEdit}>
                  <Text style={[styles.buttonText, styles.saveButtonText]}>Lưu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={() => {
                    // First save the edits
                    saveEventEdit()
                    // Then add the edited event to calendar
                    if (currentEditEvent) {
                      const updatedEvent = recognizedEvents.find((e) => e.id === currentEditEvent.id)
                      if (updatedEvent) {
                        addEventToCalendar(updatedEvent)
                      }
                    }
                  }}
                >
                  <Text style={[styles.buttonText, styles.addButtonText]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
  imageOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  imageOption: {
    alignItems: "center",
    width: "45%",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0FF",
  },
  optionIcon: {
    fontSize: 32,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  processingContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  imagePreviewContainer: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
  },
  noScheduleContainer: {
    backgroundColor: "#FFF4F4",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF5252",
    marginBottom: 24,
  },
  noScheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF5252",
    marginBottom: 8,
  },
  noScheduleText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  recognizedEventsContainer: {
    marginBottom: 24,
  },
  recognizedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recognizedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  selectAllButton: {
    padding: 8,
    backgroundColor: "#f0f0ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6C63FF",
  },
  selectAllText: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "500",
  },
  eventItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    marginBottom: 0,
    borderWidth: 1,
    flex: 1,
  },
  selectedEventItem: {
    backgroundColor: "#F0F0FF",
    borderColor: "#6C63FF",
  },
  unselectedEventItem: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  eventCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6C63FF",
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#6C63FF",
    fontWeight: "bold",
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  eventActions: {
    flexDirection: "column",
    marginLeft: 8,
  },
  editButton: {
    padding: 10,
    backgroundColor: "#f0f0ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6C63FF",
    marginBottom: 8,
  },
  addSingleButton: {
    padding: 10,
    backgroundColor: "#e6f7ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4285F4",
  },
  addButton: {
    backgroundColor: "#388E3C",
  },
  ocrResultContainer: {
    marginTop: 24,
    backgroundColor: "#F5F7FA",
    padding: 16,
    borderRadius: 8,
  },
  ocrResultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ocrTextContainer: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  ocrText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  viewMoreText: {
    fontSize: 12,
    color: "#6C63FF",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  tipsContainer: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
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
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    backgroundColor: "#fff",
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#eee",
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#FF5252",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginLeft: 8,
    marginRight: 8,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButtonText: {
    color: "#FF5252",
  },
  saveButtonText: {
    color: "#fff",
  },
  addButtonText: {
    color: "#fff",
  },
})

export default ImageScheduleRecognition
