"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import Icon from "react-native-vector-icons/MaterialIcons"
import Card from "../UI/Card"
import CustomButton from "../UI/CustomButton"
import EventItem from "../schedule/EventItem"
import { useAuth } from "../context/AuthContext"
import { getUserEvents, addEvent, updateEvent, deleteEvent, type Event as FirestoreEvent } from "../../services/firestore"
import { useTheme } from "../context/ThemeContext"
import { COLORS } from "../../styles/theme"
import {
  fetchWeatherForecast,
  fetchPublicHolidays,
  weatherIcons,
  holidayTypes,
  type WeatherData,
  type HolidayData,
  type CalendarDay,
} from "../../services/apiService"
import Geolocation from "react-native-geolocation-service"
import { request, PERMISSIONS, RESULTS } from "react-native-permissions"
import DayDetailModal from "../calendar/DayDetailModal"
import { Event as CalendarEvent } from '../../types/calendar'

type CalendarViewType = "day" | "week" | "month" | "agenda"

// Color meanings
const colorMeanings = {
  "#4CAF50": "Ưu tiên", // Xanh lá
  "#2196F3": "Học tập/Công việc", // Xanh dương
  "#FF9800": "Cá nhân/Sức khỏe", // Cam
  "#E91E63": "Giải trí/Xã hội", // Hồng đậm
  "#F44336": "Quan trọng/Khẩn cấp", // Đỏ
  "#9E9E9E": "Khác", // Xám
}

// Helper function to convert FirestoreEvent to CalendarEvent
const convertToCalendarEvent = (event: FirestoreEvent): CalendarEvent => {
  return {
    id: event.id,
    title: event.title,
    description: event.info,
    startTime: event.startTime,
    endTime: event.endTime,
    color: event.indicatorColor,
    date: event.date?.toISOString() || new Date().toISOString()
  }
}

// Helper function to convert CalendarEvent to FirestoreEvent
const convertToFirestoreEvent = (event: CalendarEvent, userId: string): FirestoreEvent => {
  return {
    id: event.id,
    title: event.title,
    info: event.description || '',
    date: new Date(event.date),
    day: new Date(event.date).getDate().toString(),
    month: (new Date(event.date).getMonth() + 1).toString(),
    startTime: event.startTime,
    endTime: event.endTime || event.startTime,
    indicatorColor: event.color || '#4CAF50',
    userId
  }
}

const ScheduleTab: React.FC = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<FirestoreEvent[]>([])
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [newEvent, setNewEvent] = useState<Partial<FirestoreEvent>>({
    title: "",
    info: "",
    day: "",
    month: "",
    startTime: "",
    endTime: "",
    indicatorColor: "#4CAF50",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewType, setViewType] = useState<CalendarViewType>("month")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [startTimeDate, setStartTimeDate] = useState(new Date())
  const [endTimeDate, setEndTimeDate] = useState(new Date())

  // Weather and holiday states
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [holidayData, setHolidayData] = useState<HolidayData[]>([])
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [userLocation, setUserLocation] = useState({ latitude: 10.75, longitude: 106.66 }) // Default to Ho Chi Minh City

  // Day detail modal
  const [dayDetailVisible, setDayDetailVisible] = useState(false)
  const [selectedDayDetail, setSelectedDayDetail] = useState<CalendarDay | null>(null)

  // Thêm state cho modal chi tiết lịch
  const [showEventDetailModal, setShowEventDetailModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<FirestoreEvent | null>(null)

  const colorOptions = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#F44336", "#9E9E9E"]

  const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
  const shortWeekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ]

  const { isDarkMode, colors } = useTheme()

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const result = await request(
        Platform.OS === "ios" ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      )

      if (result === RESULTS.GRANTED) {
        getCurrentLocation()
      } else {
        console.log("Location permission denied")
        // Use default location (Ho Chi Minh City)
        loadWeatherData(userLocation.latitude, userLocation.longitude)
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
      // Use default location
      loadWeatherData(userLocation.latitude, userLocation.longitude)
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
        loadWeatherData(latitude, longitude)
      },
      (error) => {
        console.error("Error getting location:", error)
        // Use default location
        loadWeatherData(userLocation.latitude, userLocation.longitude)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  // Load weather data
  const loadWeatherData = async (latitude: number, longitude: number) => {
    try {
      const data = await fetchWeatherForecast(latitude, longitude, 16) // Get 16 days forecast
      setWeatherData(data)
    } catch (error) {
      console.error("Error loading weather data:", error)
      Alert.alert("Lỗi", "Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau.")
    }
  }

  // Load holiday data
  const loadHolidayData = async () => {
    try {
      const year = currentDate.getFullYear()
      const data = await fetchPublicHolidays(year, "VN") // Get Vietnamese holidays
      setHolidayData(data)
    } catch (error) {
      console.error("Error loading holiday data:", error)
      Alert.alert("Lỗi", "Không thể tải dữ liệu ngày lễ. Vui lòng thử lại sau.")
    }
  }

  // Load events from Firestore
  const loadEvents = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const userEvents = await getUserEvents(user.id)
      setEvents(userEvents)
    } catch (error) {
      console.error("Error loading events:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  // Generate calendar days for the current month
  const generateCalendarDays = useCallback(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1)
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay()

    // Calculate how many days from the previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate the start date (may be from the previous month)
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(startDate.getDate() - daysFromPrevMonth)

    // We'll show 6 weeks (42 days) to ensure we have enough days
    const totalDays = 42

    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < totalDays; i++) {
      const currentDay = new Date(startDate)
      currentDay.setDate(startDate.getDate() + i)

      const isCurrentMonth = currentDay.getMonth() === month
      const isToday =
        currentDay.getDate() === today.getDate() &&
        currentDay.getMonth() === today.getMonth() &&
        currentDay.getFullYear() === today.getFullYear()

      // Find events for this day
      const dayEvents = events.filter((event) => {
        if (!event.date) return false
        const eventDate = new Date(event.date)
        return (
          eventDate.getDate() === currentDay.getDate() &&
          eventDate.getMonth() === currentDay.getMonth() &&
          eventDate.getFullYear() === currentDay.getFullYear()
        )
      })

      // Find weather data for this day
      const dateString = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, "0")}-${String(currentDay.getDate()).padStart(2, "0")}`
      const dayWeather = weatherData.find((w) => w.date === dateString)

      // Find holiday data for this day
      const dayHoliday = holidayData.find((h) => h.date === dateString)

      days.push({
        date: currentDay,
        dayOfMonth: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        events: dayEvents,
        weather: dayWeather,
        holiday: dayHoliday,
      })
    }

    setCalendarDays(days)
  }, [selectedDate, events, weatherData, holidayData])

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([loadEvents(), loadHolidayData(), requestLocationPermission()])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [loadEvents])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Generate calendar days when data changes
  useEffect(() => {
    generateCalendarDays()
  }, [generateCalendarDays, selectedDate, events, weatherData, holidayData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadAllData()
  }, [loadAllData])

  const openModal = () => {
    const now = new Date()
    setCurrentDate(now)
    setStartTimeDate(now)

    // Set end time to 1 hour after start time by default
    const endTime = new Date(now)
    endTime.setHours(endTime.getHours() + 1)
    setEndTimeDate(endTime)

    setNewEvent({
      title: "",
      info: "",
      day: now.getDate().toString(),
      month: (now.getMonth() + 1).toString(),
      startTime: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      endTime: `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`,
      indicatorColor: colorOptions[0],
      date: now,
    })
    setEditingId(null)
    setModalVisible(true)
  }

  const validateEventTimes = () => {
    // Check if date is in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const selectedDay = new Date(currentDate)
    selectedDay.setHours(0, 0, 0, 0)

    if (selectedDay < today) {
      Alert.alert("Lỗi", "Không thể tạo lịch cho ngày trong quá khứ")
      return false
    }

    // Check if end time is after start time
    if (!newEvent.startTime || !newEvent.endTime) return false

    const [startHour, startMinute] = newEvent.startTime.split(":").map(Number)
    const [endHour, endMinute] = newEvent.endTime.split(":").map(Number)

    const startDateTime = new Date(currentDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(currentDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    if (endDateTime <= startDateTime) {
      Alert.alert("Lỗi", "Thời gian kết thúc phải sau thời gian bắt đầu")
      return false
    }

    return true
  }

  const checkTimeConflicts = (date: Date, startTime: string, endTime: string, excludeEventId?: string): boolean => {
    // Skip if no date or times
    if (!date || !startTime || !endTime) return false

    // Convert the selected date and times to Date objects for comparison
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startDateTime = new Date(date)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(date)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    // Check against all events
    return events.some((event) => {
      // Skip the current event being edited
      if (excludeEventId && event.id === excludeEventId) return false

      // Skip events on different days
      if (!event.date) return false
      const eventDate = new Date(event.date)
      if (
        eventDate.getDate() !== date.getDate() ||
        eventDate.getMonth() !== date.getMonth() ||
        eventDate.getFullYear() !== date.getFullYear()
      ) {
        return false
      }

      // Convert event times to Date objects
      const [eventStartHour, eventStartMinute] = event.startTime.split(":").map(Number)
      const [eventEndHour, eventEndMinute] = event.endTime.split(":").map(Number)

      const eventStartDateTime = new Date(eventDate)
      eventStartDateTime.setHours(eventStartHour, eventStartMinute, 0, 0)

      const eventEndDateTime = new Date(eventDate)
      eventEndDateTime.setHours(eventEndHour, eventEndMinute, 0, 0)

      // Check for overlap
      // Event starts during another event
      // or event ends during another event
      // or event completely contains another event
      return (
        (startDateTime >= eventStartDateTime && startDateTime < eventEndDateTime) ||
        (endDateTime > eventStartDateTime && endDateTime <= eventEndDateTime) ||
        (startDateTime <= eventStartDateTime && endDateTime >= eventEndDateTime)
      )
    })
  }

  const saveEvent = async () => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thực hiện chức năng này")
      return
    }

    if (!newEvent.title || !newEvent.day || !newEvent.month || !newEvent.startTime || !newEvent.endTime) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin lịch!")
      return
    }

    // Validate date and time
    if (!validateEventTimes()) {
      return
    }

    // Check for time conflicts
    // Fixed: Pass undefined instead of null for excludeEventId
    const hasConflict = checkTimeConflicts(currentDate, newEvent.startTime, newEvent.endTime, editingId || undefined)
    if (hasConflict) {
      Alert.alert("Trùng lịch", "Thời gian này đã có lịch khác. Vui lòng chọn thời gian khác.", [
        { text: "Đóng", style: "cancel" },
      ])
      return
    }

    // If no conflicts, save directly
    saveEventToFirestore()
  }

  const saveEventToFirestore = async () => {
    // Fixed: Check if user is null
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thực hiện chức năng này")
      return
    }

    try {
      setIsLoading(true)

      // Create a proper date object
      const eventDate = new Date(currentDate)
      // Fixed: Add null check for startTime
      if (newEvent.startTime) {
        const [startHour, startMinute] = newEvent.startTime.split(":").map(Number)
        eventDate.setHours(startHour, startMinute, 0, 0)
      }

      // Update the event with the proper date
      const eventWithDate = {
        ...newEvent,
        date: eventDate,
      }

      if (editingId) {
        // Update existing event
        await updateEvent(editingId, eventWithDate)
        setEvents(
          events.map((event) =>
            event.id === editingId ? ({ ...event, ...eventWithDate, id: editingId } as FirestoreEvent) : event,
          ),
        )
      } else {
        // Add new event
        const eventId = await addEvent(user.id, eventWithDate as Omit<FirestoreEvent, "id">)
        setEvents([...events, { id: eventId, ...eventWithDate, userId: user.id } as FirestoreEvent])
      }

      setModalVisible(false)
      Alert.alert("Thành công", editingId ? "Đã cập nhật lịch thành công!" : "Đã thêm lịch thành công!")
    } catch (error) {
      console.error("Error saving event:", error)
      Alert.alert("Lỗi", "Không thể lưu lịch. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  const editEvent = (event: FirestoreEvent) => {
    setNewEvent({
      title: event.title,
      info: event.info,
      day: event.day,
      month: event.month,
      startTime: event.startTime,
      endTime: event.endTime,
      indicatorColor: event.indicatorColor,
      date: event.date,
    })
    setEditingId(event.id)
    setCurrentDate(event.date || new Date())

    // Set start and end time dates for the pickers
    const startDate = new Date(event.date || new Date())
    const [startHour, startMinute] = event.startTime.split(":").map(Number)
    startDate.setHours(startHour, startMinute, 0, 0)
    setStartTimeDate(startDate)

    const endDate = new Date(event.date || new Date())
    const [endHour, endMinute] = event.endTime.split(":").map(Number)
    endDate.setHours(endHour, endMinute, 0, 0)
    setEndTimeDate(endDate)

    setModalVisible(true)
  }

  const confirmDelete = (eventId: string) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa lịch này không?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => handleDeleteEvent(eventId) },
    ])
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setIsLoading(true)
      await deleteEvent(eventId)
      setEvents(events.filter((event) => event.id !== eventId))
      Alert.alert("Thành công", "Đã xóa lịch thành công!")
    } catch (error) {
      console.error("Error deleting event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      // Check if date is in the past
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selected = new Date(selectedDate)
      selected.setHours(0, 0, 0, 0)

      if (selected < today) {
        Alert.alert("Lỗi", "Không thể chọn ngày trong quá khứ")
        return
      }

      const day = selectedDate.getDate().toString()
      const month = (selectedDate.getMonth() + 1).toString()
      setNewEvent({
        ...newEvent,
        day,
        month,
        date: selectedDate,
      })
      setCurrentDate(selectedDate)
    }
  }

  const onChangeStartTime = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false)
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0")
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0")
      setNewEvent({ ...newEvent, startTime: `${hours}:${minutes}` })
      setStartTimeDate(selectedDate)

      // Automatically set end time to 1 hour after start time if not already set
      if (!newEvent.endTime) {
        const endDate = new Date(selectedDate)
        endDate.setHours(endDate.getHours() + 1)
        const endHours = endDate.getHours().toString().padStart(2, "0")
        const endMinutes = endDate.getMinutes().toString().padStart(2, "0")
        setNewEvent((prev) => ({ ...prev, endTime: `${endHours}:${endMinutes}` }))
        setEndTimeDate(endDate)
      }
    }
  }

  const onChangeEndTime = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false)
    if (selectedDate) {
      // Check if end time is after start time
      if (newEvent.startTime) {
        const [startHour, startMinute] = newEvent.startTime.split(":").map(Number)
        const startDate = new Date(currentDate)
        startDate.setHours(startHour, startMinute, 0, 0)

        if (selectedDate <= startDate) {
          Alert.alert("Lỗi", "Thời gian kết thúc phải sau thời gian bắt đầu")
          return
        }
      }

      const hours = selectedDate.getHours().toString().padStart(2, "0")
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0")
      setNewEvent({ ...newEvent, endTime: `${hours}:${minutes}` })
      setEndTimeDate(selectedDate)
    }
  }

  // Filter events based on selected date and view type
  const getFilteredEvents = () => {
    if (!events.length) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (viewType) {
      case "day":
        return events.filter((event) => {
          if (!event.date) return false
          const eventDate = new Date(event.date)
          return (
            eventDate.getDate() === selectedDate.getDate() &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear()
          )
        })

      case "week":
        const startOfWeek = new Date(selectedDate)
        const day = selectedDate.getDay()
        startOfWeek.setDate(selectedDate.getDate() - day + (day === 0 ? -6 : 1)) // Start from Monday

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        return events.filter((event) => {
          if (!event.date) return false
          const eventDate = new Date(event.date)
          return eventDate >= startOfWeek && eventDate <= endOfWeek
        })

      case "month":
        return events.filter((event) => {
          if (!event.date) return false
          const eventDate = new Date(event.date)
          return (
            eventDate.getMonth() === selectedDate.getMonth() && eventDate.getFullYear() === selectedDate.getFullYear()
          )
        })

      case "agenda":
        // Show all upcoming events
        return events
          .filter((event) => {
            if (!event.date) return false
            const eventDate = new Date(event.date)
            return eventDate >= today
          })
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0
            const dateB = b.date ? new Date(b.date).getTime() : 0
            return dateA - dateB
          })

      default:
        return events
    }
  }

  const filteredEvents = getFilteredEvents()

  // Get dates for week view
  const getWeekDates = () => {
    const dates = []
    const startOfWeek = new Date(selectedDate)
    const day = selectedDate.getDay()
    startOfWeek.setDate(selectedDate.getDate() - day + (day === 0 ? -6 : 1)) // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  // Navigate to previous period based on view type
  const goToPrevious = () => {
    const newDate = new Date(selectedDate)

    switch (viewType) {
      case "day":
        newDate.setDate(newDate.getDate() - 1)
        break
      case "week":
        newDate.setDate(newDate.getDate() - 7)
        break
      case "month":
        newDate.setMonth(newDate.getMonth() - 1)
        break
    }

    setSelectedDate(newDate)
  }

  // Navigate to next period based on view type
  const goToNext = () => {
    const newDate = new Date(selectedDate)

    switch (viewType) {
      case "day":
        newDate.setDate(newDate.getDate() + 1)
        break
      case "week":
        newDate.setDate(newDate.getDate() + 7)
        break
      case "month":
        newDate.setMonth(newDate.getMonth() + 1)
        break
    }

    setSelectedDate(newDate)
  }

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }

  // Render navigation header based on view type
  const renderNavigationHeader = () => {
    let title = ""

    switch (viewType) {
      case "day":
        title = `${weekdays[selectedDate.getDay()]}, ${selectedDate.getDate()} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
        break
      case "week":
        const weekDates = getWeekDates()
        title = `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`
        break
      case "month":
        title = `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
        break
      case "agenda":
        title = "Lịch sắp tới"
        break
    }

    return (
      <View style={[styles.navigationHeader, { backgroundColor: isDarkMode ? colors.darkCard : colors.card }]}>
        <TouchableOpacity onPress={goToPrevious} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: isDarkMode ? colors.darkText : colors.text }]}>◀</Text>
        </TouchableOpacity>

        <Text style={[styles.navigationTitle, { color: isDarkMode ? colors.darkText : colors.text }]}>{title}</Text>

        <TouchableOpacity onPress={goToNext} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: isDarkMode ? colors.darkText : colors.text }]}>▶</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Handle day press - show day detail modal
  const handleDayPress = (day: CalendarDay) => {
    console.log("Day pressed:", day)
    setSelectedDayDetail(day)
    setDayDetailVisible(true)
  }

  // Hàm mở modal chi tiết lịch
  const openEventDetail = (event: FirestoreEvent) => {
    setSelectedEvent(event)
    setShowEventDetailModal(true)
  }

  // Render day view
  const renderDayView = () => {
    // Find the selected day in calendarDays
    const selectedDay = calendarDays.find(
      (day) =>
        day.date.getDate() === selectedDate.getDate() &&
        day.date.getMonth() === selectedDate.getMonth() &&
        day.date.getFullYear() === selectedDate.getFullYear(),
    )

    // Get weather and holiday for the selected day
    const weather = selectedDay?.weather
    const holiday = selectedDay?.holiday

    return (
      <View>
        {/* Weather information */}
        {weather && (
          <View style={styles.dayWeatherContainer}>
            <Icon
              name={
                weather.weather.icon && weatherIcons[weather.weather.icon]
                  ? weatherIcons[weather.weather.icon]
                  : "cloud"
              }
              size={24}
              color={isDarkMode ? "#FFFFFF" : "#666666"}
            />
            <Text style={[styles.dayWeatherText, { color: isDarkMode ? "#FFFFFF" : "#666666" }]}>
              {weather.weather.main}, {Math.round(weather.temp.max)}°C / {Math.round(weather.temp.min)}°C
            </Text>
          </View>
        )}

        {/* Holiday information */}
        {holiday && (
          <View style={styles.dayHolidayContainer}>
            <View
              style={[
                styles.holidayIndicator,
                { backgroundColor: holidayTypes[holiday.localName] || holidayTypes.default },
              ]}
            />
            <Text style={styles.holidayName}>{holiday.localName}</Text>
            {holiday.name !== holiday.localName && (
              <Text style={styles.holidayInternationalName}>({holiday.name})</Text>
            )}
          </View>
        )}

        {/* Events */}
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <View key={event.id} style={styles.eventItemContainer}>
              <TouchableOpacity onPress={() => openEventDetail(event)}>
                <EventItem
                  day={event.day}
                  month={event.month}
                  title={`${event.startTime} - ${event.endTime}`}
                  info={event.title}
                  indicatorColor={event.indicatorColor}
                />
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => editEvent(event)} style={styles.editButton}>
                  <Text style={styles.buttonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(event.id)} style={styles.deleteButton}>
                  <Text style={styles.buttonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noEventsText}>
            {holiday ? "Không có sự kiện nào khác cho ngày này" : "Không có lịch cho ngày này"}
          </Text>
        )}
      </View>
    )
  }

  // Render week view
  const renderWeekView = () => {
    const weekDates = getWeekDates()

    return (
      <View>
        <View style={styles.weekHeader}>
          {weekDates.map((date, index) => {
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear()

            // Find the day in calendarDays
            const calendarDay = calendarDays.find(
              (day) =>
                day.date.getDate() === date.getDate() &&
                day.date.getMonth() === date.getMonth() &&
                day.date.getFullYear() === date.getFullYear(),
            )

            return (
              <TouchableOpacity
                key={index}
                style={[styles.weekDay, isToday && styles.todayHeader]}
                onPress={() => {
                  if (calendarDay) {
                    handleDayPress(calendarDay)
                  }
                }}
              >
                <Text style={[styles.weekDayText, isToday && styles.todayText]}>{shortWeekdays[date.getDay()]}</Text>
                <Text style={[styles.weekDateText, isToday && styles.todayText]}>{date.getDate()}</Text>

                {/* Weather indicator */}
                {calendarDay?.weather && (
                  <View style={styles.weekWeatherContainer}>
                    <Text style={styles.weekTemperatureText}>{Math.round(calendarDay.weather.temp.max)}°C</Text>
                  </View>
                )}

                {/* Holiday indicator */}
                {calendarDay?.holiday && (
                  <View
                    style={[
                      styles.weekHolidayIndicator,
                      { backgroundColor: holidayTypes[calendarDay.holiday.localName] || holidayTypes.default },
                    ]}
                  />
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {weekDates.map((date, dateIndex) => {
          const dayEvents = events.filter((event) => {
            if (!event.date) return false
            const eventDate = new Date(event.date)
            return (
              eventDate.getDate() === date.getDate() &&
              eventDate.getMonth() === date.getMonth() &&
              eventDate.getFullYear() === date.getFullYear()
            )
          })

          // Find the day in calendarDays
          const calendarDay = calendarDays.find(
            (day) =>
              day.date.getDate() === date.getDate() &&
              day.date.getMonth() === date.getMonth() &&
              day.date.getFullYear() === date.getFullYear(),
          )

          return (
            <View key={dateIndex} style={styles.weekDayEvents}>
              <TouchableOpacity
                style={styles.weekDayTitleContainer}
                onPress={() => {
                  if (calendarDay) {
                    handleDayPress(calendarDay)
                  }
                }}
              >
                <Text style={styles.weekDayTitle}>
                  {shortWeekdays[date.getDay()]} {date.getDate()}
                </Text>

                {/* Holiday name */}
                {calendarDay?.holiday && <Text style={styles.weekHolidayName}>{calendarDay.holiday.localName}</Text>}
              </TouchableOpacity>

              {dayEvents.length > 0 ? (
                dayEvents.map((event) => (
                  <View key={event.id} style={[styles.weekEventItem, { borderLeftColor: event.indicatorColor }]}>
                    <View style={styles.weekEventContent}>
                      <Text style={styles.weekEventTime}>
                        {event.startTime} - {event.endTime}
                      </Text>
                      <Text style={styles.weekEventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.weekEventCategory}>
                        {colorMeanings[event.indicatorColor as keyof typeof colorMeanings]}
                      </Text>
                    </View>
                    <View style={styles.weekEventActions}>
                      <TouchableOpacity onPress={() => editEvent(event)} style={styles.smallActionButton}>
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete(event.id)} style={styles.smallActionButton}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noEventsText}>Không có lịch</Text>
              )}
            </View>
          )
        })}
      </View>
    )
  }

  // Render month view
  const renderMonthView = () => {
    return (
      <View
        style={[
          styles.monthContainer,
          isDarkMode && {
            borderColor: COLORS.primary,
            borderWidth: 1.5,
            backgroundColor: "#2D2D2D",
          },
        ]}
      >
        <View style={[styles.monthHeader, { backgroundColor: isDarkMode ? COLORS.primary : "#F5F5F5" }]}>
          {weekdays.map((day, index) => (
            <Text key={index} style={[styles.monthHeaderDay, { color: isDarkMode ? "#FFFFFF" : COLORS.primary }]}>
              {shortWeekdays[index]}
            </Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.emptyDay} />
            }

            return (
              <TouchableOpacity
                key={`date-${index}`}
                style={[styles.monthDay, !day.isCurrentMonth && styles.otherMonthDay, day.isToday && styles.todayCell]}
                onPress={() => {
                  console.log("Day pressed in month view:", day)
                  handleDayPress(day)
                }}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.monthDayText,
                    !day.isCurrentMonth && styles.otherMonthDayText,
                    day.isToday && styles.todayText,
                  ]}
                >
                  {day.dayOfMonth}
                </Text>

                {/* Holiday indicator */}
                {day.holiday && day.isCurrentMonth && (
                  <View
                    style={[
                      styles.monthHolidayIndicator,
                      { backgroundColor: holidayTypes[day.holiday.localName] || holidayTypes.default },
                    ]}
                  >
                    <Text style={styles.monthHolidayText} numberOfLines={1}>
                      {day.holiday.localName}
                    </Text>
                  </View>
                )}

                {/* Weather indicator */}
                {day.weather && day.isCurrentMonth && (
                  <View style={styles.monthWeatherContainer}>
                    <Text style={styles.monthTemperatureText}>{Math.round(day.weather.temp.max)}°C</Text>
                  </View>
                )}

                {/* Event indicators */}
                {day.events.length > 0 && (
                  <View style={styles.monthDayEvents}>
                    {day.events.slice(0, 2).map((event, eventIndex) => (
                      <View
                        key={eventIndex}
                        style={[styles.monthEventDot, { backgroundColor: event.indicatorColor }]}
                      />
                    ))}
                    {day.events.length > 2 && <Text style={styles.monthMoreEvents}>+{day.events.length - 2}</Text>}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  // Render agenda view
  const renderAgendaView = () => {
    if (filteredEvents.length === 0) {
      return <Text style={styles.noEventsText}>Không có lịch sắp tới</Text>
    }

    // Group events by date
    const groupedEvents: { [key: string]: FirestoreEvent[] } = {}

    filteredEvents.forEach((event) => {
      if (!event.date) return

      const dateKey = formatDate(event.date)
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = []
      }
      groupedEvents[dateKey].push(event)
    })

    return (
      <View>
        {Object.keys(groupedEvents).map((dateKey) => {
          // Find the day in calendarDays for this date
          const dateParts = dateKey.split("/")
          const day = Number.parseInt(dateParts[0])
          const month = Number.parseInt(dateParts[1]) - 1
          const year = Number.parseInt(dateParts[2])
          const date = new Date(year, month, day)

          const calendarDay = calendarDays.find(
            (day) =>
              day.date.getDate() === date.getDate() &&
              day.date.getMonth() === date.getMonth() &&
              day.date.getFullYear() === date.getFullYear(),
          )

          return (
            <View key={dateKey} style={styles.agendaDateGroup}>
              <TouchableOpacity
                style={styles.agendaDateHeader}
                onPress={() => {
                  if (calendarDay) {
                    handleDayPress(calendarDay)
                  }
                }}
              >
                <Text style={styles.agendaDate}>{dateKey}</Text>

                {/* Holiday name */}
                {calendarDay?.holiday && <Text style={styles.agendaHolidayName}>{calendarDay.holiday.localName}</Text>}

                {/* Weather */}
                {calendarDay?.weather && (
                  <View style={styles.agendaWeatherContainer}>
                    <Icon
                      name={weatherIcons[calendarDay.weather.weather.icon] || "weather-partly-cloudy"}
                      size={16}
                      color="#666666"
                    />
                    <Text style={styles.agendaWeatherText}>
                      {Math.round(calendarDay.weather.temp.max)}°C / {Math.round(calendarDay.weather.temp.min)}°C
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {groupedEvents[dateKey].map((event) => (
                <View key={event.id} style={[styles.agendaEventItem, { borderLeftColor: event.indicatorColor }]}>
                  <View style={styles.agendaEventTime}>
                    <Text style={styles.agendaTimeText}>{event.startTime}</Text>
                    <Text style={styles.agendaTimeText}>{event.endTime}</Text>
                  </View>
                  <View style={styles.agendaEventContent}>
                    <Text style={styles.agendaEventTitle}>{event.title}</Text>
                    <Text style={styles.agendaEventInfo} numberOfLines={1}>
                      {event.info}
                    </Text>
                    <Text style={styles.agendaEventCategory}>
                      {colorMeanings[event.indicatorColor as keyof typeof colorMeanings]}
                    </Text>
                  </View>
                  <View style={styles.agendaEventActions}>
                    <TouchableOpacity onPress={() => editEvent(event)} style={styles.smallActionButton}>
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(event.id)} style={styles.smallActionButton}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
        })}
      </View>
    )
  }

  // Render content based on selected view type
  const renderContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Đang tải lịch...</Text>
        </View>
      )
    }

    switch (viewType) {
      case "day":
        return renderDayView()
      case "week":
        return renderWeekView()
      case "month":
        return renderMonthView()
      case "agenda":
        return renderAgendaView()
      default:
        return renderDayView()
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      <View style={[styles.viewTypeContainer, { backgroundColor: isDarkMode ? "#2D2D2D" : "#F5F5F5" }]}>
        {["day", "week", "month", "agenda"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.viewTypeButton,
              viewType === type && styles.activeViewType,
              isDarkMode && viewType === type && styles.darkModeActiveTab,
              {
                backgroundColor: isDarkMode
                  ? viewType === type
                    ? COLORS.primary
                    : "#2D2D2D"
                  : viewType === type
                    ? COLORS.primary
                    : "#FFFFFF",
              },
            ]}
            onPress={() => setViewType(type as CalendarViewType)}
          >
            <Text
              style={[
                styles.viewTypeText,
                viewType === type && styles.activeViewTypeText,
                isDarkMode && {
                  color: viewType === type ? "#FFFFFF" : COLORS.primary,
                },
              ]}
            >
              {type === "day" ? "Ngày" : type === "week" ? "Tuần" : type === "month" ? "Tháng" : "Lịch trình"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.todayButton,
          {
            backgroundColor: "#FFFFFF",
            borderColor: COLORS.primary,
          },
        ]}
        onPress={goToToday}
      >
        <Text style={[styles.todayButtonText, { color: COLORS.primary }]}>Hôm nay</Text>
      </TouchableOpacity>

      <Card title="📅 Lịch của bạn">
        {renderNavigationHeader()}

        <CustomButton
          title="➕ Tạo lịch mới"
          onPress={() => {
            console.log("Opening create event modal")
            openModal()
          }}
          style={styles.createButton}
        />

        {renderContent()}
      </Card>

      {/* Modal nhập lịch */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? "Chỉnh sửa lịch" : "Tạo lịch mới"}</Text>

              <TouchableOpacity
                style={[styles.input, { justifyContent: "center" }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{newEvent.day && newEvent.month ? `${newEvent.day}/${newEvent.month}` : "Chọn ngày"}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker value={currentDate} mode="date" display="default" onChange={onChangeDate} />
              )}

              <TouchableOpacity
                style={[styles.input, { justifyContent: "center" }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text>{newEvent.startTime ? `Bắt đầu: ${newEvent.startTime}` : "Chọn giờ bắt đầu"}</Text>
              </TouchableOpacity>

              {showStartPicker && (
                <DateTimePicker value={startTimeDate} mode="time" display="default" onChange={onChangeStartTime} />
              )}

              <TouchableOpacity
                style={[styles.input, { justifyContent: "center" }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text>{newEvent.endTime ? `Kết thúc: ${newEvent.endTime}` : "Chọn giờ kết thúc"}</Text>
              </TouchableOpacity>

              {showEndPicker && (
                <DateTimePicker value={endTimeDate} mode="time" display="default" onChange={onChangeEndTime} />
              )}

              <TextInput
                style={styles.input}
                placeholder="Tiêu đề"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
              />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Thông tin chi tiết"
                value={newEvent.info}
                onChangeText={(text) => setNewEvent({ ...newEvent, info: text })}
                multiline={true}
                numberOfLines={3}
              />

              <Text style={styles.colorPickerLabel}>Chọn màu:</Text>
              <View style={styles.colorPicker}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      newEvent.indicatorColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setNewEvent({ ...newEvent, indicatorColor: color })}
                  />
                ))}
              </View>

              {/* Only show meaning for selected color */}
              <View style={styles.selectedColorMeaning}>
                <View style={[styles.colorLegendDot, { backgroundColor: newEvent.indicatorColor }]} />
                <Text style={styles.selectedColorText}>
                  {colorMeanings[newEvent.indicatorColor as keyof typeof colorMeanings]}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                  <Text style={styles.buttonTextModal}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEvent} style={styles.saveButton}>
                  <Text style={styles.buttonTextModal}>{editingId ? "Cập nhật" : "Lưu"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Day detail modal */}
      {selectedDayDetail && (
        <DayDetailModal
          visible={dayDetailVisible}
          onClose={() => setDayDetailVisible(false)}
          date={selectedDayDetail.date}
          events={selectedDayDetail.events.map(convertToCalendarEvent)}
          weather={selectedDayDetail.weather}
          holiday={selectedDayDetail.holiday}
          onEditEvent={(event) => {
            const firestoreEvent = convertToFirestoreEvent(event, user?.id || '')
            editEvent(firestoreEvent)
          }}
          onDeleteEvent={confirmDelete}
        />
      )}

      {/* Modal chi tiết lịch */}
      <Modal visible={showEventDetailModal} transparent animationType="slide" onRequestClose={() => setShowEventDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4285F4', marginBottom: 12 }}>Chi tiết lịch</Text>
            {selectedEvent && (
              <>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>{selectedEvent.title}</Text>
                <Text style={{ marginBottom: 4 }}>Ngày: {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('vi-VN') : ''}</Text>
                <Text style={{ marginBottom: 4 }}>Thời gian: {selectedEvent.startTime} - {selectedEvent.endTime}</Text>
                {selectedEvent.info ? <Text style={{ marginBottom: 4 }}>Mô tả: {selectedEvent.info}</Text> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Text>Màu: </Text>
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: selectedEvent.indicatorColor, borderWidth: 1, borderColor: '#ccc' }} />
                </View>
              </>
            )}
            <TouchableOpacity onPress={() => setShowEventDetailModal(false)} style={{ marginTop: 20, alignSelf: 'center', backgroundColor: '#4285F4', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewTypeContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  viewTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeViewType: {
    backgroundColor: COLORS.primary,
  },
  viewTypeText: {
    fontWeight: "600",
    color: "#424242",
    fontSize: 15,
  },
  activeViewTypeText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  todayButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  todayButtonText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  navigationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  navButton: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  navButtonText: {
    fontSize: 16,
    color: "#424242",
    fontWeight: "600",
  },
  createButton: {
    marginBottom: 16,
  },
  eventItemContainer: {
    position: "relative",
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  actionButtons: {
    flexDirection: "row",
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  editButton: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    padding: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
  },
  noEventsText: {
    textAlign: "center",
    padding: 16,
    color: "#757575",
    fontStyle: "italic",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  // Day view styles
  dayWeatherContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dayWeatherText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  dayHolidayContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  holidayIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  holidayName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  holidayInternationalName: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 4,
  },
  // Week view styles
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginHorizontal: 2,
  },
  todayHeader: {
    backgroundColor: "#4CAF50",
  },
  weekDayText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#333",
  },
  weekDateText: {
    fontSize: 14,
    color: "#333",
  },
  todayText: {
    color: "#fff",
  },
  weekWeatherContainer: {
    marginTop: 2,
    alignItems: "center",
  },
  weekTemperatureText: {
    fontSize: 10,
    color: "#666",
  },
  weekHolidayIndicator: {
    width: 8,
    height: 2,
    borderRadius: 1,
    marginTop: 2,
  },
  weekDayEvents: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  weekDayTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  weekDayTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  weekHolidayName: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    fontStyle: "italic",
  },
  weekEventItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  weekEventContent: {
    flex: 1,
  },
  weekEventTime: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  weekEventTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  weekEventCategory: {
    fontSize: 10,
    color: "#888",
    fontStyle: "italic",
  },
  weekEventActions: {
    flexDirection: "row",
  },
  smallActionButton: {
    padding: 4,
    marginLeft: 4,
  },
  // Month view styles
  monthContainer: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  monthHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
  },
  monthHeaderDay: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthDay: {
    width: "14.28%",
    aspectRatio: 0.8,
    padding: 4,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  otherMonthDay: {
    backgroundColor: "#F9F9F9",
  },
  emptyDay: {
    width: "14.28%",
    aspectRatio: 1,
  },
  todayCell: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  monthDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  otherMonthDayText: {
    color: "#AAAAAA",
  },
  monthHolidayIndicator: {
    width: "100%",
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginTop: 2,
    alignItems: "center",
  },
  monthHolidayText: {
    color: "#FFFFFF",
    fontSize: 6,
    fontWeight: "bold",
  },
  monthWeatherContainer: {
    marginTop: 2,
    alignItems: "center",
  },
  monthTemperatureText: {
    fontSize: 8,
    color: "#666",
  },
  monthDayEvents: {
    flexDirection: "row",
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  monthEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  monthMoreEvents: {
    fontSize: 8,
    color: "#666",
    marginLeft: 2,
  },
  // Agenda view styles
  agendaDateGroup: {
    marginBottom: 16,
  },
  agendaDateHeader: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  agendaDate: {
    fontWeight: "bold",
    color: "#333",
  },
  agendaHolidayName: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
  },
  agendaWeatherContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  agendaWeatherText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  agendaEventItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    alignItems: "center",
  },
  agendaEventTime: {
    marginRight: 12,
  },
  agendaTimeText: {
    fontSize: 12,
    color: "#666",
  },
  agendaEventContent: {
    flex: 1,
  },
  agendaEventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  agendaEventInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  agendaEventCategory: {
    fontSize: 10,
    color: "#888",
    fontStyle: "italic",
  },
  agendaEventActions: {
    flexDirection: "row",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    paddingBottom: 30, // Add extra padding at bottom
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#4285F4",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  colorPickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  colorPicker: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#000",
    transform: [{ scale: 1.1 }],
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingVertical: 10,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#9e9e9e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    minWidth: 120,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    minWidth: 120,
    alignItems: "center",
  },
  buttonTextModal: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  selectedColorMeaning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  selectedColorText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  colorLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  // Dark mode specific elements
  darkModeText: {
    color: COLORS.primary, // Use green color for text in dark mode
  },
  darkModeCell: {
    borderColor: COLORS.primary,
    borderWidth: 0.5,
  },
  darkModeActiveTab: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
})

export default ScheduleTab
