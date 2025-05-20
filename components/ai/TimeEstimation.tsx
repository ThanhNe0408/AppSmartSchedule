"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native"
import Card from "../UI/Card"
import CustomButton from "../UI/CustomButton"
import { useAuth } from "../context/AuthContext"
import { addEvent } from "../../services/firestore"

interface TaskEstimate {
  id: string
  name: string
  estimatedTime: number
  confidence: number
  category: string
}

const TimeEstimation = () => {
  const { user } = useAuth()
  const [taskInput, setTaskInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [taskEstimates, setTaskEstimates] = useState<TaskEstimate[]>([])
  const [selectedEstimate, setSelectedEstimate] = useState<TaskEstimate | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedTime, setEditedTime] = useState("")
  const [editedDate, setEditedDate] = useState("")
  const [editedStartTime, setEditedStartTime] = useState("")

  const sampleCategories = ["Học tập", "Bài tập", "Dự án", "Đọc sách", "Nghiên cứu"]

  const analyzeTask = async () => {
    if (!taskInput.trim()) return

    setIsAnalyzing(true)

    try {
      // Trong ứng dụng thực tế, bạn sẽ gọi API dịch vụ AI
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Tạo ước tính thực tế hơn dựa trên mô tả nhiệm vụ
      let estimatedTime = 0
      let confidence = 0
      let category = ""

      // Phân tích dựa trên từ khóa đơn giản
      const taskLower = taskInput.toLowerCase()

      if (taskLower.includes("bài tập") || taskLower.includes("homework")) {
        // Ước tính dựa trên độ phức tạp
        if (taskLower.includes("khó") || taskLower.includes("phức tạp")) {
          estimatedTime = Math.floor(Math.random() * 60) + 90 // 90-150 phút
          confidence = Math.floor(Math.random() * 10) + 75 // 75-85%
        } else {
          estimatedTime = Math.floor(Math.random() * 30) + 60 // 60-90 phút
          confidence = Math.floor(Math.random() * 10) + 80 // 80-90%
        }
        category = "Bài tập"
      } else if (taskLower.includes("đọc") || taskLower.includes("read")) {
        // Ước tính dựa trên độ dài - giả sử 30 phút mỗi chương
        const chapterMatch = taskLower.match(/(\d+)\s*chương/)
        const chapters = chapterMatch ? Number.parseInt(chapterMatch[1]) : 1
        estimatedTime = chapters * 30
        confidence = Math.floor(Math.random() * 15) + 75 // 75-90%
        category = "Đọc sách"
      } else if (taskLower.includes("thuyết trình") || taskLower.includes("presentation")) {
        // Ước tính dựa trên loại thuyết trình
        if (taskLower.includes("nhóm") || taskLower.includes("group")) {
          estimatedTime = Math.floor(Math.random() * 120) + 240 // 240-360 phút
        } else {
          estimatedTime = Math.floor(Math.random() * 120) + 180 // 180-300 phút
        }
        confidence = Math.floor(Math.random() * 10) + 85 // 85-95%
        category = "Thuyết trình"
      } else if (taskLower.includes("dự án") || taskLower.includes("project")) {
        // Ước tính dựa trên quy mô dự án
        if (taskLower.includes("lớn") || taskLower.includes("large")) {
          estimatedTime = Math.floor(Math.random() * 240) + 480 // 480-720 phút
        } else {
          estimatedTime = Math.floor(Math.random() * 240) + 360 // 360-600 phút
        }
        confidence = Math.floor(Math.random() * 20) + 70 // 70-90%
        category = "Dự án"
      } else {
        estimatedTime = Math.floor(Math.random() * 90) + 60 // 60-150 phút
        confidence = Math.floor(Math.random() * 20) + 70 // 70-90%
        category = sampleCategories[Math.floor(Math.random() * sampleCategories.length)]
      }

      // Lưu lịch sử ước tính để cải thiện độ chính xác trong tương lai
      const newEstimate: TaskEstimate = {
        id: Date.now().toString(),
        name: taskInput,
        estimatedTime: estimatedTime,
        confidence: confidence,
        category: category,
      }

      setTaskEstimates([newEstimate, ...taskEstimates])
      setTaskInput("")
    } catch (error) {
      console.error("Lỗi phân tích nhiệm vụ:", error)
      Alert.alert("Lỗi", "Không thể phân tích nhiệm vụ. Vui lòng thử lại sau.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "#4CAF50" // High confidence - green
    if (confidence >= 75) return "#FFC107" // Medium confidence - yellow
    return "#FF5722" // Low confidence - orange
  }

  // Open modal to add to calendar
  const openAddToCalendarModal = (estimate: TaskEstimate) => {
    setSelectedEstimate(estimate)

    // Set default values
    const today = new Date()
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
    const hours = today.getHours().toString().padStart(2, "0")
    const minutes = today.getMinutes().toString().padStart(2, "0")

    setEditedName(estimate.name)
    setEditedTime(estimate.estimatedTime.toString())
    setEditedDate(formattedDate)
    setEditedStartTime(`${hours}:${minutes}`)

    setModalVisible(true)
  }

  // Add task to calendar
  const addToCalendar = async () => {
    if (!user || !selectedEstimate) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thêm vào lịch")
      return
    }

    try {
      // Parse date
      const dateParts = editedDate.split("/")
      if (dateParts.length !== 3) {
        Alert.alert("Lỗi", "Định dạng ngày không hợp lệ. Vui lòng sử dụng DD/MM/YYYY")
        return
      }

      const day = Number.parseInt(dateParts[0])
      const month = Number.parseInt(dateParts[1]) - 1
      const year = Number.parseInt(dateParts[2])
      const date = new Date(year, month, day)

      // Parse start time
      const timeParts = editedStartTime.split(":")
      if (timeParts.length !== 2) {
        Alert.alert("Lỗi", "Định dạng giờ không hợp lệ. Vui lòng sử dụng HH:MM")
        return
      }

      const startHour = Number.parseInt(timeParts[0])
      const startMinute = Number.parseInt(timeParts[1])

      // Calculate end time
      const estimatedMinutes = Number.parseInt(editedTime)
      const endHour = (startHour + Math.floor(estimatedMinutes / 60)) % 24
      const endMinute = (startMinute + (estimatedMinutes % 60)) % 60

      const startTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`

      // Add to calendar
      await addEvent(user.id, {
        title: editedName,
        info: `Loại: ${selectedEstimate.category}, Thời gian ước tính: ${formatTime(Number.parseInt(editedTime))}`,
        day: day.toString(),
        month: (month + 1).toString(),
        startTime: startTime,
        endTime: endTime,
        indicatorColor: getColorForCategory(selectedEstimate.category),
        date: date,
        userId: user.id,
      })

      Alert.alert("Thành công", "Đã thêm nhiệm vụ vào lịch của bạn")
      setModalVisible(false)
    } catch (error) {
      console.error("Error adding to calendar:", error)
      Alert.alert("Lỗi", "Không thể thêm vào lịch. Vui lòng thử lại sau.")
    }
  }

  // Get color based on category
  const getColorForCategory = (category: string): string => {
    switch (category) {
      case "Bài tập":
        return "#4285F4" // Blue
      case "Đọc sách":
        return "#34A853" // Green
      case "Thuyết trình":
        return "#FBBC05" // Yellow
      case "Dự án":
        return "#FF5252" // Red
      default:
        return "#9C27B0" // Purple
    }
  }

  // Adjust estimated time
  const adjustEstimatedTime = (estimate: TaskEstimate, adjustment: number) => {
    const updatedEstimates = taskEstimates.map((item) => {
      if (item.id === estimate.id) {
        const newTime = Math.max(15, item.estimatedTime + adjustment)
        return { ...item, estimatedTime: newTime }
      }
      return item
    })
    setTaskEstimates(updatedEstimates)
  }

  return (
    <ScrollView>
      <Card title="⏱️ Dự đoán thời gian hoàn thành">
        <Text style={styles.description}>
          Nhập công việc của bạn để AI dự đoán thời gian hoàn thành dựa trên độ phức tạp và thói quen học tập của bạn.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập công việc cần dự đoán thời gian..."
            value={taskInput}
            onChangeText={setTaskInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.analyzeButton, !taskInput.trim() && styles.disabledButton]}
            onPress={analyzeTask}
            disabled={!taskInput.trim() || isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.analyzeButtonText}>Phân tích</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.suggestedTasks}>
          <Text style={styles.suggestedTitle}>Gợi ý:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.suggestionTag}
              onPress={() => setTaskInput("Làm bài tập lớn môn Toán cao cấp")}
            >
              <Text style={styles.suggestionText}>Bài tập lớn Toán cao cấp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionTag}
              onPress={() => setTaskInput("Đọc và tóm tắt 3 chương sách Kinh tế vĩ mô")}
            >
              <Text style={styles.suggestionText}>Đọc sách Kinh tế vĩ mô</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionTag}
              onPress={() => setTaskInput("Chuẩn bị bài thuyết trình môn Marketing")}
            >
              <Text style={styles.suggestionText}>Thuyết trình Marketing</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {taskEstimates.length > 0 && (
          <View style={styles.estimatesContainer}>
            <Text style={styles.estimatesTitle}>Kết quả dự đoán:</Text>

            {taskEstimates.map((estimate) => (
              <View key={estimate.id} style={styles.estimateCard}>
                <View style={styles.estimateHeader}>
                  <Text style={styles.estimateCategory}>{estimate.category}</Text>
                  <View style={styles.confidenceContainer}>
                    <View
                      style={[
                        styles.confidenceBar,
                        { width: `${estimate.confidence}%`, backgroundColor: getConfidenceColor(estimate.confidence) },
                      ]}
                    />
                    <Text style={styles.confidenceText}>{estimate.confidence}% chính xác</Text>
                  </View>
                </View>

                <Text style={styles.estimateTask}>{estimate.name}</Text>

                <View style={styles.timeContainer}>
                  <Text style={styles.timeIcon}>⏱️</Text>
                  <Text style={styles.timeText}>{formatTime(estimate.estimatedTime)}</Text>

                  <View style={styles.adjustTimeButtons}>
                    <TouchableOpacity style={styles.adjustButton} onPress={() => adjustEstimatedTime(estimate, -15)}>
                      <Text style={styles.adjustButtonText}>-15m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.adjustButton} onPress={() => adjustEstimatedTime(estimate, 15)}>
                      <Text style={styles.adjustButtonText}>+15m</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <CustomButton
                    title="Thêm vào lịch"
                    onPress={() => openAddToCalendarModal(estimate)}
                    style={styles.addButton}
                    textStyle={styles.addButtonText}
                  />
                  <CustomButton
                    title="Điều chỉnh"
                    onPress={() => openAddToCalendarModal(estimate)}
                    type="outline"
                    style={styles.adjustButton}
                    textStyle={styles.adjustButtonText}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Modal to add task to calendar */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm vào lịch</Text>

            <Text style={styles.inputLabel}>Tên nhiệm vụ:</Text>
            <TextInput style={styles.modalInput} value={editedName} onChangeText={setEditedName} />

            <Text style={styles.inputLabel}>Thời gian ước tính (phút):</Text>
            <TextInput
              style={styles.modalInput}
              value={editedTime}
              onChangeText={setEditedTime}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Ngày (DD/MM/YYYY):</Text>
            <TextInput
              style={styles.modalInput}
              value={editedDate}
              onChangeText={setEditedDate}
              placeholder="DD/MM/YYYY"
            />

            <Text style={styles.inputLabel}>Giờ bắt đầu (HH:MM):</Text>
            <TextInput
              style={styles.modalInput}
              value={editedStartTime}
              onChangeText={setEditedStartTime}
              placeholder="HH:MM"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={addToCalendar}>
                <Text style={styles.buttonText}>Thêm vào lịch</Text>
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
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    width: "100%",
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    fontSize: 16,
    color: "#333333",
    textAlignVertical: "top",
  },
  analyzeButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  analyzeButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  suggestedTasks: {
    marginBottom: 20,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  suggestionTag: {
    backgroundColor: "#F0F0FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0E0FF",
  },
  suggestionText: {
    color: "#6C63FF",
    fontSize: 14,
  },
  estimatesContainer: {
    marginTop: 16,
  },
  estimatesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  estimateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  estimateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  estimateCategory: {
    fontSize: 14,
    color: "#6C63FF",
    fontWeight: "500",
    backgroundColor: "#F0F0FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceContainer: {
    width: 100,
    height: 20,
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  confidenceBar: {
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
  },
  confidenceText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    lineHeight: 20,
  },
  estimateTask: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  timeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  adjustTimeButtons: {
    flexDirection: "row",
  },
  adjustButton: {
    backgroundColor: "#F0F0FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#6C63FF",
  },
  adjustButtonText: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#4CAF50",
  },
  addButtonText: {
    color: "#FFFFFF",
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})

export default TimeEstimation
