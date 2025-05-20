import firestore from "@react-native-firebase/firestore"
import { Alert } from "react-native"
import auth from "@react-native-firebase/auth"

// Event interface matching your Firestore structure
export interface Event {
  id: string
  title: string
  info: string
  date?: Date
  day: string
  month: string
  startTime: string
  endTime: string
  indicatorColor: string
  userId: string
}

// Collection references
const eventsCollection = firestore().collection("events")
const usersCollection = firestore().collection("users")

// Add this function to handle Firestore permission errors
const handleFirestoreError = (error: any) => {
  console.error("Firestore error:", error)

  // Check for specific error types
  if (error.code === "permission-denied") {
    // Handle permission denied errors
    Alert.alert(
      "Lỗi quyền truy cập",
      "Ứng dụng không có quyền truy cập dữ liệu. Vui lòng đăng nhập lại hoặc kiểm tra kết nối mạng.",
      [
        {
          text: "Đăng nhập lại",
          onPress: async () => {
            try {
              // Sign out and redirect to login
              await auth().signOut()
            } catch (logoutError) {
              console.error("Error during logout:", logoutError)
            }
          },
        },
        { text: "Đóng" },
      ],
    )
    return []
  }

  // Generic error handling
  Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại sau.")
  return []
}

// Get all events for a user
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    // Simple query without complex ordering to avoid index issues
    const snapshot = await eventsCollection.where("userId", "==", userId).get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title || "",
        info: data.info || "",
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
        day: data.day || "",
        month: data.month || "",
        startTime: data.startTime || "",
        endTime: data.endTime || "",
        indicatorColor: data.indicatorColor || "#4285F4",
        userId: data.userId || userId,
      }
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return handleFirestoreError(error)
  }
}

// Add a new event
export const addEvent = async (userId: string, event: Omit<Event, "id">): Promise<string> => {
  try {
    // Convert date to Firestore timestamp if it exists
    const firestoreEvent = {
      ...event,
      userId,
      date: event.date ? firestore.Timestamp.fromDate(event.date) : null,
      createdAt: firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await eventsCollection.add(firestoreEvent)
    return docRef.id
  } catch (error) {
    console.error("Error adding event:", error)
    Alert.alert("Lỗi", "Không thể thêm lịch. Vui lòng thử lại sau.")
    throw error
  }
}

// Update an existing event
export const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<void> => {
  try {
    // Convert date to Firestore timestamp if it exists
    const firestoreEventData = {
      ...eventData,
      date: eventData.date ? firestore.Timestamp.fromDate(eventData.date) : null,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    }

    await eventsCollection.doc(eventId).update(firestoreEventData)
  } catch (error) {
    console.error("Error updating event:", error)
    Alert.alert("Lỗi", "Không thể cập nhật lịch. Vui lòng thử lại sau.")
    throw error
  }
}

// Delete an event
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await eventsCollection.doc(eventId).delete()
  } catch (error) {
    console.error("Error deleting event:", error)
    Alert.alert("Lỗi", "Không thể xóa lịch. Vui lòng thử lại sau.")
    throw error
  }
}

// Save user preferences
export const saveUserPreferences = async (userId: string, preferences: any): Promise<void> => {
  try {
    await usersCollection.doc(userId).set(
      {
        preferences,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error("Error saving preferences:", error)
    Alert.alert("Lỗi", "Không thể lưu cài đặt. Vui lòng thử lại sau.")
    throw error
  }
}

// Get user preferences
export const getUserPreferences = async (userId: string): Promise<any> => {
  try {
    const doc = await usersCollection.doc(userId).get()
    // Handle both cases where exists might be a property or a function
    return (typeof doc.exists === "function" ? doc.exists() : doc.exists) ? doc.data()?.preferences || {} : {}
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return handleFirestoreError(error)
  }
}
