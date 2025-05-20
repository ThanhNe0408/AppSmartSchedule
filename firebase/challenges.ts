import firestore from "@react-native-firebase/firestore"
import { Alert } from "react-native"

// Challenge types
export type ChallengeType = "habit" | "task"

// Challenge category
export interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tasks: Task[]
  userId: string
}

// Task interface
export interface Task {
  id: string
  name: string
  description: string
  icon: string
  completed: boolean
  date?: Date
  rating?: number
  categoryId: string
}

// Challenge interface
export interface Challenge {
  id: string
  name: string
  type: ChallengeType
  icon: string
  color: string
  startDate: Date
  endDate?: Date
  frequency: "daily" | "weekly" | "monthly" | "once"
  reminder: boolean
  completed: boolean
  ratings: { date: Date; rating: number }[]
  userId: string
  categoryId?: string
  description?: string
}

// Collection references
const challengesCollection = firestore().collection("challenges")
const categoriesCollection = firestore().collection("categories")
const tasksCollection = firestore().collection("tasks")

// Get all challenges for a user
export const getUserChallenges = async (userId: string): Promise<Challenge[]> => {
  try {
    const snapshot = await challengesCollection.where("userId", "==", userId).orderBy("startDate", "desc").get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        ratings:
          data.ratings?.map((r: any) => ({
            ...r,
            date: r.date.toDate(),
          })) || [],
      } as Challenge
    })
  } catch (error) {
    console.error("Error fetching challenges:", error)
    Alert.alert("Lỗi", "Không thể tải thử thách. Vui lòng thử lại sau.")
    return []
  }
}

// Get all categories for a user
export const getUserCategories = async (userId: string): Promise<Category[]> => {
  try {
    const snapshot = await categoriesCollection.where("userId", "==", userId).get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[]
  } catch (error) {
    console.error("Error fetching categories:", error)
    Alert.alert("Lỗi", "Không thể tải danh mục. Vui lòng thử lại sau.")
    return []
  }
}

// Add a new challenge
export const addChallenge = async (challenge: Omit<Challenge, "id">): Promise<string> => {
  try {
    const docRef = await challengesCollection.add(challenge)
    return docRef.id
  } catch (error) {
    console.error("Error adding challenge:", error)
    Alert.alert("Lỗi", "Không thể tạo thử thách. Vui lòng thử lại sau.")
    throw error
  }
}

// Update a challenge
export const updateChallenge = async (challengeId: string, data: Partial<Challenge>): Promise<void> => {
  try {
    await challengesCollection.doc(challengeId).update(data)
  } catch (error) {
    console.error("Error updating challenge:", error)
    Alert.alert("Lỗi", "Không thể cập nhật thử thách. Vui lòng thử lại sau.")
    throw error
  }
}

// Delete a challenge
export const deleteChallenge = async (challengeId: string): Promise<void> => {
  try {
    await challengesCollection.doc(challengeId).delete()
  } catch (error) {
    console.error("Error deleting challenge:", error)
    Alert.alert("Lỗi", "Không thể xóa thử thách. Vui lòng thử lại sau.")
    throw error
  }
}

// Add a rating to a challenge
export const addRatingToChallenge = async (
  challengeId: string,
  rating: number,
  date: Date = new Date(),
): Promise<void> => {
  try {
    await challengesCollection.doc(challengeId).update({
      ratings: firestore.FieldValue.arrayUnion({
        rating,
        date,
      }),
      completed: true,
    })
  } catch (error) {
    console.error("Error adding rating:", error)
    Alert.alert("Lỗi", "Không thể lưu đánh giá. Vui lòng thử lại sau.")
    throw error
  }
}

// Add a new category
export const addCategory = async (category: Omit<Category, "id">): Promise<string> => {
  try {
    const docRef = await categoriesCollection.add(category)
    return docRef.id
  } catch (error) {
    console.error("Error adding category:", error)
    Alert.alert("Lỗi", "Không thể tạo danh mục. Vui lòng thử lại sau.")
    throw error
  }
}

// Update a category
export const updateCategory = async (categoryId: string, data: Partial<Category>): Promise<void> => {
  try {
    await categoriesCollection.doc(categoryId).update(data)
  } catch (error) {
    console.error("Error updating category:", error)
    Alert.alert("Lỗi", "Không thể cập nhật danh mục. Vui lòng thử lại sau.")
    throw error
  }
}

// Delete a category
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    await categoriesCollection.doc(categoryId).delete()
  } catch (error) {
    console.error("Error deleting category:", error)
    Alert.alert("Lỗi", "Không thể xóa danh mục. Vui lòng thử lại sau.")
    throw error
  }
}

// Get challenge statistics
export const getChallengeStats = async (userId: string) => {
  try {
    const challenges = await getUserChallenges(userId)

    // Calculate completion rate
    const totalChallenges = challenges.length
    const completedChallenges = challenges.filter((c) => c.completed).length
    const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0

    // Calculate average rating
    const allRatings = challenges.flatMap((c) => c.ratings.map((r) => r.rating))
    const avgRating =
      allRatings.length > 0 ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length : 0

    // Get monthly stats
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyCompletions = challenges.filter((c) => {
      return c.ratings.some((r) => {
        const ratingDate = r.date
        return ratingDate.getMonth() === currentMonth && ratingDate.getFullYear() === currentYear
      })
    }).length

    return {
      totalChallenges,
      completedChallenges,
      completionRate,
      avgRating,
      monthlyCompletions,
    }
  } catch (error) {
    console.error("Error getting challenge stats:", error)
    return {
      totalChallenges: 0,
      completedChallenges: 0,
      completionRate: 0,
      avgRating: 0,
      monthlyCompletions: 0,
    }
  }
}
