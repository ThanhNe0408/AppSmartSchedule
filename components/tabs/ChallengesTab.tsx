"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { COLORS } from "../../styles/theme"
import Card from "../UI/Card"
import CustomButton from "../UI/CustomButton"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import firestore from "@react-native-firebase/firestore"

// Challenge types
type ChallengeType = "habit" | "task"

// Challenge category
interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tasks: Task[]
}

// Task interface
interface Task {
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
interface Challenge {
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
}

const ChallengesTab = () => {
  const { user } = useAuth()
  const { isDarkMode, colors } = useTheme()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [newChallengeModalVisible, setNewChallengeModalVisible] = useState(false)
  const [ratingModalVisible, setRatingModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [activeTab, setActiveTab] = useState<"challenges" | "categories" | "stats">("challenges")
  const [newChallenge, setNewChallenge] = useState({
    name: "",
    type: "habit" as ChallengeType,
    icon: "star",
    color: COLORS.primary,
    frequency: "daily" as "daily" | "weekly" | "monthly" | "once",
    reminder: true,
    categoryId: "",
  })
  const [refreshing, setRefreshing] = useState(false)

  // Predefined categories with tasks
  // Predefined categories with tasks
const predefinedCategories: Category[] = [
  {
    id: "eat-healthy",
    name: "Ăn uống lành mạnh",
    description:
      "Ăn uống lành mạnh là về sự cân bằng và đảm bảo cơ thể nhận được các chất dinh dưỡng cần thiết để hoạt động tốt.",
    icon: "restaurant",
    color: "#FFC107",
    tasks: [
      {
        id: "breakfast",
        name: "Ăn một bữa sáng tuyệt vời",
        description: "Bữa sáng giúp bạn tỉnh táo, tập trung và vui vẻ hơn.",
        icon: "free-breakfast",
        completed: false,
        categoryId: "eat-healthy",
      },
      {
        id: "lunch",
        name: "Chuẩn bị bữa trưa",
        description: "Cung cấp năng lượng và chất dinh dưỡng để duy trì suốt buổi chiều.",
        icon: "lunch-dining",
        completed: false,
        categoryId: "eat-healthy",
      },
      {
        id: "fish",
        name: "Ăn cá",
        description: "Là nguồn quan trọng của axit béo Omega-3.",
        icon: "set-meal",
        completed: false,
        categoryId: "eat-healthy",
      },
      {
        id: "beef",
        name: "Ăn thịt bò",
        description:
          "Là nguồn tuyệt vời của sắt, kẽm, niacin, riboflavin, vitamin B12 và thiamine.",
        icon: "restaurant",
        completed: false,
        categoryId: "eat-healthy",
      },
      {
        id: "vitamins",
        name: "Uống vitamin tổng hợp hàng ngày",
        description: "Giảm căng thẳng và lo âu.",
        icon: "medication",
        completed: false,
        categoryId: "eat-healthy",
      },
      {
        id: "cakes",
        name: "Ăn bánh",
        description: "Giúp cải thiện tiêu hóa.",
        icon: "cake",
        completed: false,
        categoryId: "eat-healthy",
      },
      {
        id: "tea",
        name: "Uống một tách trà mỗi ngày",
        description: "Trà có thể giảm nguy cơ đau tim và đột quỵ.",
        icon: "emoji-food-beverage",
        completed: false,
        categoryId: "eat-healthy",
      },
    ],
  },
  {
    id: "self-relaxation",
    name: "Thư giãn bản thân",
    description:
      "Dành thời gian thư giãn và nạp lại năng lượng là điều cần thiết cho sức khỏe tinh thần và thể chất.",
    icon: "spa",
    color: "#4CAF50",
    tasks: [
      {
        id: "meditation",
        name: "Thiền định 10 phút",
        description: "Giảm căng thẳng và cải thiện sự tập trung.",
        icon: "self-improvement",
        completed: false,
        categoryId: "self-relaxation",
      },
      {
        id: "reading",
        name: "Đọc sách",
        description: "Mở rộng kiến thức và giảm căng thẳng.",
        icon: "menu-book",
        completed: false,
        categoryId: "self-relaxation",
      },
      {
        id: "bath",
        name: "Tắm nước ấm",
        description: "Thư giãn cơ bắp và cải thiện giấc ngủ.",
        icon: "bathtub",
        completed: false,
        categoryId: "self-relaxation",
      },
      {
        id: "music",
        name: "Nghe nhạc thư giãn",
        description: "Giảm lo âu và cải thiện tâm trạng.",
        icon: "music-note",
        completed: false,
        categoryId: "self-relaxation",
      },
    ],
  },
  {
    id: "be-active",
    name: "Hoạt động theo cách của tôi",
    description:
      "Hoạt động thể chất không chỉ tốt cho sức khỏe thể chất mà còn mang lại nhiều lợi ích tích cực khác.",
    icon: "directions-run",
    color: "#FF4081",
    tasks: [
      {
        id: "tidy-up",
        name: "Dọn dẹp",
        description:
          "Loại bỏ đống lộn xộn sẽ giúp cải thiện sức khỏe tinh thần của bạn rất nhiều.",
        icon: "cleaning-services",
        completed: false,
        categoryId: "be-active",
      },
      {
        id: "exercises",
        name: "Tập thể dục",
        description: "Cảm thấy thư giãn hơn và ngủ ngon hơn.",
        icon: "fitness-center",
        completed: false,
        categoryId: "be-active",
      },
      {
        id: "make-bed",
        name: "Dọn giường",
        description: "Cải thiện chất lượng giấc ngủ.",
        icon: "bed",
        completed: false,
        categoryId: "be-active",
      },
      {
        id: "running",
        name: "Đi chạy bộ",
        description: "Giúp duy trì cân nặng khỏe mạnh.",
        icon: "directions-run",
        completed: false,
        categoryId: "be-active",
      },
      {
        id: "walk",
        name: "Đi bộ",
        description: "Tăng cường xương và cải thiện sự cân bằng.",
        icon: "directions-walk",
        completed: false,
        categoryId: "be-active",
      },
      {
        id: "yoga",
        name: "Tham gia lớp yoga",
        description: "Cải thiện sức mạnh, sự cân bằng và linh hoạt.",
        icon: "self-improvement",
        completed: false,
        categoryId: "be-active",
      },
      {
        id: "cook",
        name: "Nấu ăn tại nhà",
        description: "Có thể khiến bạn trở thành người hạnh phúc hơn.",
        icon: "restaurant",
        completed: false,
        categoryId: "be-active",
      },
      {
        id: "creative",
        name: "Suy nghĩ sáng tạo",
        description: "Trở thành người giải quyết vấn đề tốt hơn.",
        icon: "lightbulb",
        completed: false,
        categoryId: "be-active",
      },
    ],
  },
  {
    id: "be-weird",
    name: "Hãy kỳ lạ. Hãy là chính bạn",
    description:
      "Bị gọi là kỳ lạ là điều tuyệt vời nhất, bởi vì bạn biết mình không giống ai.",
    icon: "psychology",
    color: "#7986CB",
    tasks: [
      {
        id: "job",
        name: "Tìm kiếm cơ hội việc làm",
        description: "Phát triển bản thân và kế hoạch sự nghiệp.",
        icon: "work",
        completed: false,
        categoryId: "be-weird",
      },
      {
        id: "pet",
        name: "Nuôi thú cưng",
        description: "Giúp bạn cảm thấy bớt cô đơn.",
        icon: "pets",
        completed: false,
        categoryId: "be-weird",
      },
      {
        id: "chess",
        name: "Chơi cờ vua",
        description: "Tăng cường sự tập trung và nâng cao sự sáng tạo.",
        icon: "casino",
        completed: false,
        categoryId: "be-weird",
      },
      {
        id: "party",
        name: "Tổ chức tiệc",
        description: "Gặp gỡ nhiều người mới và thú vị.",
        icon: "celebration",
        completed: false,
        categoryId: "be-weird",
      },
      {
        id: "painting",
        name: "Học vẽ tranh",
        description: "Kích thích thái độ lạc quan.",
        icon: "palette",
        completed: false,
        categoryId: "be-weird",
      },
      {
        id: "trip",
        name: "Đi du lịch",
        description: "Cải thiện kỹ năng xã hội và giao tiếp.",
        icon: "luggage",
        completed: false,
        categoryId: "be-weird",
      },
      {
        id: "trees",
        name: "Trồng cây",
        description: "Cây xanh làm mát đường phố và thành phố.",
        icon: "park",
        completed: false,
        categoryId: "be-weird",
      },
      {
        id: "friends",
        name: "Kết bạn mới",
        description: "Mở ra những khả năng mới.",
        icon: "people",
        completed: false,
        categoryId: "be-weird",
      },
    ],
  },
  // Thêm danh mục mới: Self Improvement
  {
    id: "self-improvement",
    name: "Tự cải thiện bản thân",
    description:
      "Một hành trình không ngừng nghỉ - giúp bạn nhận thức rõ hơn về tính cách, suy nghĩ và cảm xúc của mình.",
    icon: "self-improvement",
    color: "#F44336",
    tasks: [
      {
        id: "learn-languages",
        name: "Học ngôn ngữ mới",
        description: "Mở ra một thế giới cơ hội việc làm.",
        icon: "language",
        completed: false,
        categoryId: "self-improvement",
      },
      {
        id: "manage-workload",
        name: "Quản lý khối lượng công việc",
        description: "Cung cấp chất lượng công việc tốt hơn.",
        icon: "work",
        completed: false,
        categoryId: "self-improvement",
      },
      {
        id: "work-abroad",
        name: "Làm việc ở nước ngoài",
        description: "Tốt cho sự phát triển cá nhân.",
        icon: "flight",
        completed: false,
        categoryId: "self-improvement",
      },
      {
        id: "learn-skill",
        name: "Học một kỹ năng mới",
        description: "Tăng khả năng thích nghi của bạn.",
        icon: "school",
        completed: false,
        categoryId: "self-improvement",
      },
      {
        id: "get-things-done",
        name: "Hoàn thành công việc trước hạn chót",
        description: "Sẽ giúp tạo thêm động lực.",
        icon: "schedule",
        completed: false,
        categoryId: "self-improvement",
      },
      {
        id: "learn-instrument",
        name: "Học chơi nhạc cụ",
        description: "Khiến bạn trở nên sáng tạo hơn.",
        icon: "music-note",
        completed: false,
        categoryId: "self-improvement",
      },
      {
        id: "make-to-do-list",
        name: "Lập danh sách việc cần làm hàng ngày",
        description: "Phân chia mục tiêu thành các bước hành động.",
        icon: "format-list-bulleted",
        completed: false,
        categoryId: "self-improvement",
      },
      {
        id: "stabilize-expectations",
        name: "Ổn định kỳ vọng",
        description: "Đặt mục tiêu của bạn một cách rõ ràng.",
        icon: "build",
        completed: false,
        categoryId: "self-improvement",
      },
    ],
  },
  // Thêm danh mục mới: Connect with others
  {
    id: "connect-with-others",
    name: "Kết nối với người khác",
    description:
      "Giảm căng thẳng, giúp chúng ta sống lâu hơn và giảm nguy cơ cô lập và trầm cảm.",
    icon: "people",
    color: "#2196F3",
    tasks: [
      {
        id: "talk-family",
        name: "Trò chuyện với gia đình",
        description: "Xây dựng mối quan hệ gia đình và các thành viên có thể hòa thuận hơn.",
        icon: "group",
        completed: false,
        categoryId: "connect-with-others",
      },
      {
        id: "reconnect-friends",
        name: "Kết nối lại với bạn cũ",
        description: "Bạn từng là một phần trong cuộc sống của họ và họ cũng vậy với bạn.",
        icon: "people-outline",
        completed: false,
        categoryId: "connect-with-others",
      },
      {
        id: "get-involved-community",
        name: "Tham gia cộng đồng",
        description: "Hãy chủ động. Chia sẻ tiếng nói và ý kiến của bạn.",
        icon: "people",
        completed: false,
        categoryId: "connect-with-others",
      },
      {
        id: "travel",
        name: "Du lịch",
        description: "Cải thiện sự hiểu biết của bạn về các nền văn hóa khác.",
        icon: "flight",
        completed: false,
        categoryId: "connect-with-others",
      },
      {
        id: "save-animals",
        name: "Cứu giúp động vật",
        description: "Giữ chúng an toàn tại nhà.",
        icon: "pets",
        completed: false,
        categoryId: "connect-with-others",
      },
      {
        id: "care-for-others",
        name: "Chăm sóc người khác",
        description: "Giúp phát triển sự đồng cảm và khả năng kết nối với mọi người.",
        icon: "favorite",
        completed: false,
        categoryId: "connect-with-others",
      },
      {
        id: "make-phone-call",
        name: "Gọi điện thoại",
        description: "Thể hiện sự quan tâm của bạn đến người khác.",
        icon: "phone",
        completed: false,
        categoryId: "connect-with-others",
      },
      {
        id: "add-value",
        name: "Thêm giá trị",
        description: "Thêm giá trị vào cuộc sống của người khác.",
        icon: "add-circle",
        completed: false,
        categoryId: "connect-with-others",
      },
    ],
  },
]

  // Load user challenges and categories
  useEffect(() => {
    if (!user) return

    setIsLoading(true)

    const loadCategories = async () => {
      try {
        const categoriesSnapshot = await firestore().collection("categories").where("userId", "==", user.id).get()
        let userCategories: Category[] = []
        if (categoriesSnapshot.empty) {
          userCategories = predefinedCategories
          for (const category of predefinedCategories) {
            await firestore().collection("categories").add({
              ...category,
              userId: user.id,
            })
          }
        } else {
          userCategories = categoriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Category[]
        }
        setCategories(userCategories)
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }
    loadCategories()

    const unsubscribe = firestore()
      .collection("challenges")
      .where("userId", "==", user.id)
      .orderBy("startDate", "desc")
      .onSnapshot(
        (challengesSnapshot) => {
          const userChallenges = challengesSnapshot.docs
            .filter(doc => doc.data().startDate)
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              startDate: doc.data().startDate?.toDate(),
              endDate: doc.data().endDate?.toDate(),
              ratings:
                doc.data().ratings?.map((r: any) => ({
                  ...r,
                  date: r.date.toDate(),
                })) || [],
            })) as Challenge[]
          setChallenges(userChallenges)
          setIsLoading(false)
        },
        (error) => {
          setIsLoading(false)
          console.error("Error loading challenges:", error)
          Alert.alert("Lỗi", "Không thể tải thử thách. Vui lòng thử lại sau.")
        }
      )
    return () => unsubscribe()
  }, [user])

  const createChallenge = async () => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để tạo thử thách")
      return
    }

    if (!newChallenge.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên thử thách")
      return
    }

    try {
      setIsLoading(true)

      const startDate = new Date()
      let endDate = undefined

      if (newChallenge.type === "task") {
        endDate = new Date()
        endDate.setDate(endDate.getDate() + 7)
      }

      const challengeData = {
        ...newChallenge,
        startDate,
        endDate,
        completed: false,
        ratings: [],
        userId: user.id,
      }

      const docRef = await firestore().collection("challenges").add(challengeData)

      const newChallengeObj: Challenge = {
        id: docRef.id,
        ...challengeData,
        ratings: [],
      }

      setChallenges([newChallengeObj, ...challenges])
      setNewChallengeModalVisible(false)
      setNewChallenge({
        name: "",
        type: "habit",
        icon: "star",
        color: COLORS.primary,
        frequency: "daily",
        reminder: true,
        categoryId: "",
      })

      Alert.alert("Thành công", "Đã tạo thử thách mới!")
    } catch (error) {
      console.error("Error creating challenge:", error)
      Alert.alert("Lỗi", "Không thể tạo thử thách. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const addTaskAsChallenge = async (task: Task) => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thêm nhiệm vụ")
      return
    }

    try {
      setIsLoading(true)

      const startDate = new Date()
      const challengeData = {
        name: task.name,
        type: "task" as ChallengeType,
        icon: task.icon,
        color: selectedCategory?.color || COLORS.primary,
        startDate,
        frequency: "once" as "daily" | "weekly" | "monthly" | "once",
        reminder: true,
        completed: false,
        ratings: [],
        userId: user.id,
        categoryId: task.categoryId,
        description: task.description,
      }

      const docRef = await firestore().collection("challenges").add(challengeData)

      const newChallengeObj: Challenge = {
        id: docRef.id,
        ...challengeData,
        ratings: [],
      }

      setChallenges([newChallengeObj, ...challenges])
      Alert.alert("Thành công", `Đã thêm "${task.name}" vào thử thách của bạn!`)
    } catch (error) {
      console.error("Error adding task as challenge:", error)
      Alert.alert("Lỗi", "Không thể thêm nhiệm vụ. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const completeChallenge = (challenge: Challenge) => {
    setSelectedTask({
      id: challenge.id,
      name: challenge.name,
      description: "",
      icon: challenge.icon,
      completed: true,
      categoryId: challenge.categoryId || "",
    })
    setRatingModalVisible(true)
  }

  const saveRating = async () => {
    if (!selectedTask || !user) return

    try {
      setIsLoading(true)

      const today = new Date()
      const rating = {
        date: today,
        rating: selectedRating,
      }

      const challengeRef = firestore().collection("challenges").doc(selectedTask.id)
      const challengeDoc = await challengeRef.get()

      if (challengeDoc.exists()) {
        await challengeRef.update({
          completed: true,
          ratings: firestore.FieldValue.arrayUnion(rating),
        })

        setChallenges(
          challenges.map((c) => {
            if (c.id === selectedTask.id) {
              return {
                ...c,
                completed: true,
                ratings: [...c.ratings, { date: today, rating: selectedRating }],
              }
            }
            return c
          }),
        )
      } else {
        const taskRef = firestore().collection("tasks").doc(selectedTask.id)
        await taskRef.update({
          completed: true,
          rating: selectedRating,
          completedDate: today,
        })

        if (selectedCategory) {
          const updatedCategories = categories.map((cat) => {
            if (cat.id === selectedCategory.id) {
              return {
                ...cat,
                tasks: cat.tasks.map((task) => {
                  if (task.id === selectedTask.id) {
                    return {
                      ...task,
                      completed: true,
                      rating: selectedRating,
                      date: today,
                    }
                  }
                  return task
                }),
              }
            }
            return cat
          })
          setCategories(updatedCategories)
        }
      }

      setRatingModalVisible(false)
      setSelectedRating(0)
      setSelectedTask(null)
      Alert.alert("Thành công", "Đã lưu đánh giá của bạn!")
    } catch (error) {
      console.error("Error saving rating:", error)
      Alert.alert("Lỗi", "Không thể lưu đánh giá. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatsData = () => {
    if (!challenges.length) return null

    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentRatings = challenges.flatMap((challenge) => challenge.ratings.filter((r) => r.date >= last30Days))

    const ratingsByDay: { [key: string]: number[] } = {}
    recentRatings.forEach((rating) => {
      const dateKey = rating.date.toISOString().split("T")[0]
      if (!ratingsByDay[dateKey]) {
        ratingsByDay[dateKey] = []
      }
      ratingsByDay[dateKey].push(rating.rating)
    })

    const labels: string[] = []
    const data: number[] = []

    Object.keys(ratingsByDay)
      .sort()
      .forEach((dateKey) => {
        const ratings = ratingsByDay[dateKey]
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

        const date = new Date(dateKey)
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`

        labels.push(formattedDate)
        data.push(avgRating)
      })

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    }
  }

  const getMonthlyCompletionRate = () => {
    if (!challenges.length) return 0

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const completedThisMonth = challenges.filter((challenge) => {
      return challenge.ratings.some((rating) => {
        const ratingDate = rating.date
        return ratingDate.getMonth() === currentMonth && ratingDate.getFullYear() === currentYear
      })
    })

    return (completedThisMonth.length / challenges.length) * 100
  }

  const getAverageRating = () => {
    if (!challenges.length) return 0

    const allRatings = challenges.flatMap((challenge) => challenge.ratings.map((r) => r.rating))
    if (!allRatings.length) return 0

    return allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
  }

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return "N/A"
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }

  // Render challenge item with date
  const renderChallengeItem = ({ item }: { item: Challenge }) => {
    return (
      <TouchableOpacity
        style={[
          styles.challengeItem,
          { backgroundColor: isDarkMode ? colors.darkCard : colors.card },
          item.completed && styles.completedChallenge,
        ]}
        onPress={() => !item.completed && completeChallenge(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.challengeIcon, { backgroundColor: item.color }]}>
          <Icon name={item.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.challengeContent}>
          <Text style={[styles.challengeName, { color: isDarkMode ? colors.darkText : colors.text }]}>{item.name}</Text>
          <Text style={[styles.challengeType, { color: isDarkMode ? colors.darkText : colors.text }]}>
            {item.type === "habit" ? "Thói quen thường xuyên" : "Nhiệm vụ một lần"}
          </Text>
          {/* Thêm thông tin ngày tháng */}
          <View style={styles.dateContainer}>
            <Icon name="calendar-today" size={14} color={isDarkMode ? "#888" : "#666"} />
            <Text style={[styles.dateText, { color: isDarkMode ? "#888" : "#666" }]}>
              {`Bắt đầu: ${formatDate(item.startDate)}`}
            </Text>
          </View>
          {item.endDate && (
            <View style={styles.dateContainer}>
              <Icon name="event" size={14} color={isDarkMode ? "#888" : "#666"} />
              <Text style={[styles.dateText, { color: isDarkMode ? "#888" : "#666" }]}>
                {`Kết thúc: ${formatDate(item.endDate)}`}
              </Text>
            </View>
          )}
          {item.completed && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={
                    item.ratings.length && item.ratings[item.ratings.length - 1].rating >= star ? "star" : "star-border"
                  }
                  size={16}
                  color="#FFC107"
                />
              ))}
            </View>
          )}
        </View>
        {!item.completed && (
          <TouchableOpacity style={styles.completeButton} onPress={() => completeChallenge(item)}>
            <Icon name="check-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  // Render category item with updated design
  const renderCategoryItem = ({ item }: { item: Category }) => {
    return (
      <TouchableOpacity
        style={[styles.categoryItem, { backgroundColor: isDarkMode ? colors.darkCard : colors.card }]}
        onPress={() => {
          setSelectedCategory(item)
          setModalVisible(true)
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
          <Icon name={item.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.categoryContent}>
          <Text style={[styles.categoryName, { color: isDarkMode ? colors.darkText : colors.text }]}>{item.name}</Text>
          <Text style={[styles.categoryTaskCount, { color: isDarkMode ? "#888" : "#666" }]}>
            {item.tasks.length} nhiệm vụ
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={isDarkMode ? colors.darkText : colors.text} />
      </TouchableOpacity>
    )
  }

  const renderTaskItem = ({ item }: { item: Task }) => {
    return (
      <View style={[styles.taskItem, { backgroundColor: isDarkMode ? colors.darkCard : colors.card }]}>
        <View style={styles.taskIconContainer}>
          <Icon name={item.icon} size={24} color={selectedCategory?.color || COLORS.primary} />
        </View>
        <View style={styles.taskContent}>
          <Text style={[styles.taskName, { color: isDarkMode ? colors.darkText : colors.text }]}>{item.name}</Text>
          <Text style={[styles.taskDescription, { color: isDarkMode ? "#888" : "#666" }]}>{item.description}</Text>
        </View>
        <TouchableOpacity style={styles.addTaskButton} onPress={() => addTaskAsChallenge(item)}>
          <View style={[styles.addButton, { backgroundColor: selectedCategory?.color || COLORS.primary }]}>
            <Icon name="add" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  const renderCategoryDetailModal = () => {
    if (!selectedCategory) return null

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalContent, { backgroundColor: isDarkMode ? colors.dark.background : colors.background }]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Icon name="arrow-back" size={24} color={isDarkMode ? colors.darkText : colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>
                {selectedCategory.name}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={[styles.categoryHeaderCard, { backgroundColor: selectedCategory.color }]}>
              <View style={styles.categoryHeaderContent}>
                <Text style={styles.categoryHeaderTitle}>{selectedCategory.name}</Text>
                <Text style={styles.categoryHeaderDescription}>{selectedCategory.description}</Text>
              </View>
              <View style={styles.categoryHeaderIconContainer}>
                <Icon name={selectedCategory.icon} size={48} color="#FFFFFF" />
              </View>
            </View>

            <FlatList
              data={selectedCategory.tasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.taskList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    )
  }

  const renderNewChallengeModal = () => {
    return (
      <Modal
        visible={newChallengeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewChallengeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalContent, { backgroundColor: isDarkMode ? colors.dark.background : colors.background }]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setNewChallengeModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={isDarkMode ? colors.darkText : colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>
                TẠO THỬ THÁCH MỚI
              </Text>
              <TouchableOpacity onPress={createChallenge} style={styles.saveButton}>
                <Icon name="check" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.newChallengeForm}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Icon name="edit" size={24} color={COLORS.primary} />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDarkMode ? colors.darkText : colors.text,
                      borderBottomColor: isDarkMode ? "#444" : "#DDD",
                    },
                  ]}
                  placeholder="Nhập tên thử thách"
                  placeholderTextColor={isDarkMode ? "#888" : "#999"}
                  value={newChallenge.name}
                  onChangeText={(text) => setNewChallenge({ ...newChallenge, name: text })}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>
                  Loại thử thách
                </Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      newChallenge.type === "habit" && [styles.selectedType, { borderColor: COLORS.primary }],
                    ]}
                    onPress={() => setNewChallenge({ ...newChallenge, type: "habit" })}
                  >
                    <Icon
                      name="repeat"
                      size={24}
                      color={newChallenge.type === "habit" ? COLORS.primary : isDarkMode ? "#888" : "#999"}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: newChallenge.type === "habit" ? COLORS.primary : isDarkMode ? "#888" : "#999" },
                      ]}
                    >
                      Thói quen thường xuyên
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      newChallenge.type === "task" && [styles.selectedType, { borderColor: COLORS.primary }],
                    ]}
                    onPress={() => setNewChallenge({ ...newChallenge, type: "task" })}
                  >
                    <Icon
                      name="event"
                      size={24}
                      color={newChallenge.type === "task" ? COLORS.primary : isDarkMode ? "#888" : "#999"}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        { color: newChallenge.type === "task" ? COLORS.primary : isDarkMode ? "#888" : "#999" },
                      ]}
                    >
                      Nhiệm vụ một lần
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>
                  Biểu tượng
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelector}>
                  {[
                    "star",
                    "favorite",
                    "fitness-center",
                    "self-improvement",
                    "restaurant",
                    "local-drink",
                    "book",
                    "school",
                    "work",
                    "code",
                    "music-note",
                    "brush",
                    "directions-run",
                    "directions-bike",
                    "hiking",
                    "spa",
                  ].map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.iconOption, newChallenge.icon === icon && { backgroundColor: COLORS.primary }]}
                      onPress={() => setNewChallenge({ ...newChallenge, icon })}
                    >
                      <Icon name={icon} size={24} color={newChallenge.icon === icon ? "#FFFFFF" : "#666666"} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>
                  Màu sắc
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorSelector}>
                  {[
                    "#4CAF50",
                    "#2196F3",
                    "#FF9800",
                    "#E91E63",
                    "#9C27B0",
                    "#3F51B5",
                    "#009688",
                    "#FF5722",
                    "#607D8B",
                    "#795548",
                  ].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newChallenge.color === color && styles.selectedColor,
                      ]}
                      onPress={() => setNewChallenge({ ...newChallenge, color })}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>
                  Tần suất
                </Text>
                <View style={styles.frequencySelector}>
                  {[
                    { value: "daily", label: "Hằng ngày", icon: "today" },
                    { value: "weekly", label: "Hằng tuần", icon: "view-week" },
                    { value: "monthly", label: "Hằng tháng", icon: "calendar-month" },
                    { value: "once", label: "Một lần", icon: "event" },
                  ].map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[
                        styles.frequencyOption,
                        newChallenge.frequency === freq.value && [
                          styles.selectedFrequency,
                          { borderColor: COLORS.primary },
                        ],
                      ]}
                      onPress={() => setNewChallenge({ ...newChallenge, frequency: freq.value as any })}
                    >
                      <Icon
                        name={freq.icon}
                        size={20}
                        color={newChallenge.frequency === freq.value ? COLORS.primary : isDarkMode ? "#888" : "#999"}
                      />
                      <Text
                        style={[
                          styles.frequencyText,
                          {
                            color:
                              newChallenge.frequency === freq.value ? COLORS.primary : isDarkMode ? "#888" : "#999",
                          },
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formSection}>
                <View style={styles.reminderToggle}>
                  <Text style={[styles.reminderText, { color: isDarkMode ? colors.darkText : colors.text }]}>
                    Nhắc nhở
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      { backgroundColor: newChallenge.reminder ? COLORS.primary : isDarkMode ? "#444" : "#DDD" },
                    ]}
                    onPress={() => setNewChallenge({ ...newChallenge, reminder: !newChallenge.reminder })}
                  >
                    <View
                      style={[styles.toggleKnob, { transform: [{ translateX: newChallenge.reminder ? 20 : 0 }] }]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <CustomButton
                title="Lưu"
                onPress={createChallenge}
                color={COLORS.primary}
                style={styles.saveButtonLarge}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  const renderRatingModal = () => {
    return (
      <Modal
        visible={ratingModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.ratingModalContainer}>
          <View style={[styles.ratingModalContent, { backgroundColor: isDarkMode ? colors.darkCard : colors.card }]}>
            <Text style={[styles.ratingModalTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>Làm tốt lắm!</Text>
            <Text style={[styles.ratingModalSubtitle, { color: isDarkMode ? "#888" : "#666" }]}>Bạn cảm thấy như thế nào?</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Icon
                    name={selectedRating >= star ? "star" : "star-border"}
                    size={36}
                    color="#FFC107"
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ratingButtonsContainer}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingCancelButton]}
                onPress={() => setRatingModalVisible(false)}
              >
                <Text style={[styles.ratingButtonText, { color: isDarkMode ? colors.darkText : colors.text }]}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingSaveButton, { opacity: selectedRating > 0 ? 1 : 0.5 }]}
                onPress={saveRating}
                disabled={selectedRating === 0}
              >
                <Text style={[styles.ratingButtonText, { color: COLORS.white }]}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  const renderStatsTab = () => {
    const statsData = getStatsData()
    const completionRate = getMonthlyCompletionRate()
    const avgRating = getAverageRating()

    return (
      <ScrollView style={styles.statsContainer}>
        <Card title="Biểu đồ hàng tháng">
          {statsData && statsData.labels.length > 0 ? (
            <LineChart
              data={statsData}
              width={Dimensions.get("window").width - 64}
              height={220}
              chartConfig={{
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                backgroundGradientFrom: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                backgroundGradientTo: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) =>
                  isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: COLORS.primary,
                },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="show-chart" size={48} color="#CCCCCC" />
              <Text style={[styles.noDataText, { color: isDarkMode ? "#888" : "#666" }]}>
                Cần thêm dữ liệu để vẽ biểu đồ. Kiểm tra lại sau nhé!
              </Text>
            </View>
          )}
        </Card>

        <Card title="Tổng quan">
          <View style={styles.statsOverview}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{challenges.length}</Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? "#888" : "#666" }]}>Tổng thử thách</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{Math.round(completionRate)}%</Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? "#888" : "#666" }]}>Hoàn thành tháng này</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{avgRating.toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: isDarkMode ? "#888" : "#666" }]}>Đánh giá trung bình</Text>
            </View>
          </View>
        </Card>

        <Card title="Nhiệm vụ đang tiến hành">
          {challenges.filter((c) => !c.completed).length > 0 ? (
            <FlatList
              data={challenges.filter((c) => !c.completed).slice(0, 3)}
              renderItem={renderChallengeItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Icon name="assignment" size={48} color="#CCCCCC" />
              <Text style={[styles.noDataText, { color: isDarkMode ? "#888" : "#666" }]}>
                Bạn chưa có nhiệm vụ nào đang tiến hành. Tạo thử thách mới ngay nào!
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.dark.background : colors.background }]}>
      {/* Tab selector with improved design */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "challenges" && styles.activeTab]}
          onPress={() => setActiveTab("challenges")}
          activeOpacity={0.8}
        >
          <Icon
            name="assignment"
            size={24}
            color={activeTab === "challenges" ? COLORS.primary : isDarkMode ? "#888" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "challenges" ? COLORS.primary : isDarkMode ? "#888" : "#999" },
            ]}
          >
            Thử thách
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "categories" && styles.activeTab]}
          onPress={() => setActiveTab("categories")}
          activeOpacity={0.8}
        >
          <Icon
            name="category"
            size={24}
            color={activeTab === "categories" ? COLORS.primary : isDarkMode ? "#888" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "categories" ? COLORS.primary : isDarkMode ? "#888" : "#999" },
            ]}
          >
            Danh mục
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "stats" && styles.activeTab]}
          onPress={() => setActiveTab("stats")}
          activeOpacity={0.8}
        >
          <Icon
            name="bar-chart"
            size={24}
            color={activeTab === "stats" ? COLORS.primary : isDarkMode ? "#888" : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "stats" ? COLORS.primary : isDarkMode ? "#888" : "#999" },
            ]}
          >
            Thống kê
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: isDarkMode ? colors.darkText : colors.text }]}>Đang tải...</Text>
        </View>
      ) : (
        <>
          {activeTab === "challenges" && (
            <>
              <FlatList
                data={challenges}
                renderItem={renderChallengeItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.challengeList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="assignment" size={64} color="#CCCCCC" />
                    <Text style={[styles.emptyText, { color: isDarkMode ? colors.darkText : colors.text }]}>
                      Bạn chưa có thử thách nào
                    </Text>
                    <Text style={[styles.emptySubtext, { color: isDarkMode ? "#888" : "#666" }]}>
                      Hãy tạo thử thách đầu tiên của bạn!
                    </Text>
                  </View>
                }
              />

              <TouchableOpacity
                style={[styles.floatingButton, { backgroundColor: COLORS.primary }]}
                onPress={() => setNewChallengeModalVisible(true)}
                activeOpacity={0.8}
              >
                <Icon name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          {activeTab === "categories" && (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.categoryList}
            />
          )}

          {activeTab === "stats" && renderStatsTab()}
        </>
      )}

      {renderCategoryDetailModal()}
      {renderNewChallengeModal()}
      {renderRatingModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    margin: 16,
    padding: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  challengeList: {
    padding: 16,
    paddingBottom: 80,
  },
  challengeItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  completedChallenge: {
    opacity: 0.7,
    backgroundColor: "#F3F3F3",
  },
  challengeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  challengeContent: {
    flex: 1,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  challengeType: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: "500",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  completeButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 44,
  },
  categoryList: {
    padding: 16,
    paddingBottom: 80,
  },
  categoryItem: {
    flexDirection: "row",
    backgroundColor: "#F8F9FB",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  categoryTaskCount: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    padding: 8,
  },
  categoryHeaderCard: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeaderContent: {
    flex: 1,
  },
  categoryHeaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  categoryHeaderDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  categoryHeaderIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 64,
  },
  taskList: {
    padding: 16,
    paddingTop: 0,
  },
  taskItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  addTaskButton: {
    marginLeft: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  floatingButton: {
    position: "absolute",
    right: 28,
    bottom: 32,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  newChallengeForm: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  inputIconContainer: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  selectedType: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  iconSelector: {
    flexDirection: "row",
    marginBottom: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    marginRight: 12,
  },
  colorSelector: {
    flexDirection: "row",
    marginBottom: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  frequencySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  frequencyOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedFrequency: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  frequencyText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  reminderToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  reminderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  saveButtonLarge: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  ratingModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  ratingModalContent: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  ratingModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  ratingModalSubtitle: {
    fontSize: 17,
    marginBottom: 28,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  ratingButtonsContainer: {
    flexDirection: "row",
    width: "100%",
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 12,
  },
  ratingCancelButton: {
    borderRightWidth: 0.5,
    borderColor: "#DDDDDD",
  },
  ratingSaveButton: {
    borderLeftWidth: 0.5,
    borderColor: "#DDDDDD",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  ratingButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  statsContainer: {
    padding: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsOverview: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 20,
  },
})

export default ChallengesTab