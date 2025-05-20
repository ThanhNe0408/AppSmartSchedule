"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useAuth } from "../context/AuthContext"
import { COLORS } from "../../styles/theme"
import { getUserEvents } from "../../services/firestore"
import { useTheme } from "../context/ThemeContext"
import { fetchWeatherForecast, fetchPublicHolidays } from "../../services/apiService"
import Geolocation, { GeoPosition, GeoError } from "react-native-geolocation-service"
import { request, PERMISSIONS, RESULTS } from "react-native-permissions"
import DayDetailModal from './DayDetailModal'
import { NavigationProp } from '@react-navigation/native'
import { Event } from '../../types/calendar'
import { deleteEvent } from '../../services/firestore'

interface WeatherData {
  date: string // Format: YYYY-MM-DD
  temp: {
    day: number
    min: number
    max: number
  }
  weather: {
    main: string
    description: string
    icon: string
  }
}

interface HolidayData {
  date: string // Format: YYYY-MM-DD
  name: string
  localName: string
}

interface CalendarDay {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  events: any[]
  weather?: WeatherData
  holiday?: HolidayData
}

interface SmartCalendarProps {
  navigation: NavigationProp<any>
}

const SmartCalendar: React.FC<SmartCalendarProps> = ({ navigation }) => {
  const { user } = useAuth()
  const { isDarkMode, colors } = useTheme()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [holidayData, setHolidayData] = useState<HolidayData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">("month")
  const [userLocation, setUserLocation] = useState({ latitude: 10.75, longitude: 106.66 }) // Default to Ho Chi Minh City
  const [isDayDetailsVisible, setIsDayDetailsVisible] = useState(false) // Declare setIsDayDetailsVisible
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null) // Declare selectedDay

  // Weather icon mapping for Material Icons
  const weatherIcons: { [key: string]: string } = {
    "01d": "wb_sunny", // clear sky day
    "01n": "nights_stay", // clear sky night
    "02d": "partly_cloudy_day", // few clouds day
    "02n": "nights_stay", // few clouds night
    "03d": "cloud", // scattered clouds
    "03n": "cloud", // scattered clouds night
    "04d": "cloud", // broken clouds
    "04n": "cloud", // broken clouds night
    "09d": "grain", // shower rain
    "09n": "grain", // shower rain night
    "10d": "water_drop", // rain
    "10n": "water_drop", // rain night
    "11d": "thunderstorm", // thunderstorm
    "11n": "thunderstorm", // thunderstorm night
    "13d": "ac_unit", // snow
    "13n": "ac_unit", // snow night
    "50d": "foggy", // mist
    "50n": "foggy", // mist night
  }

  // Vietnamese weekday names
  const weekdayNames = ["CN", "TH 2", "TH 3", "TH 4", "TH 5", "TH 6", "TH 7"]
  const fullWeekdayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
  const monthNames = [
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
      (position: GeoPosition) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
        loadWeatherData(latitude, longitude)
      },
      (error: GeoError) => {
        console.error("Error getting location:", error)
        // Use default location
        loadWeatherData(userLocation.latitude, userLocation.longitude)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
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

  // Load user events
  const loadEvents = useCallback(async () => {
    if (!user) return

    try {
      const userEvents = await getUserEvents(user.id)
      setEvents(userEvents)
    } catch (error) {
      console.error("Error loading events:", error)
      Alert.alert("Lỗi", "Không thể tải lịch sự kiện. Vui lòng thử lại sau.")
    }
  }, [user])

  // Generate calendar days for the current month
  const generateCalendarDays = useCallback(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

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
      const isToday = currentDay.getTime() === today.getTime()

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
  }, [currentDate, events, weatherData, holidayData])

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

  // Initial data loading
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Generate calendar days when data changes
  useEffect(() => {
    generateCalendarDays()
  }, [generateCalendarDays, currentDate, events, weatherData, holidayData])

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadAllData()
  }, [loadAllData])

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Render a calendar day
  const renderDay = (day: CalendarDay, index: number) => {
    const dayStyle = [styles.calendarDay, !day.isCurrentMonth && styles.otherMonthDay, day.isToday && styles.todayDay]

    // Get holiday information
    const holiday = day.holiday

    // Get weather information
    const weather = day.weather

    return (
      <TouchableOpacity key={index} style={dayStyle} onPress={() => handleDayPress(day)}>
        <Text
          style={[
            styles.dayNumber,
            !day.isCurrentMonth && styles.otherMonthDayText,
            day.isToday && styles.todayDayText,
          ]}
        >
          {day.dayOfMonth}
        </Text>

        {/* Holiday indicator */}
        {holiday && (
          <View style={styles.holidayContainer}>
            <Text style={styles.holidayText} numberOfLines={1}>
              {holiday.localName}
            </Text>
          </View>
        )}

        {/* Weather indicator */}
        {weather && day.isCurrentMonth && (
          <View style={styles.weatherContainer}>
            <Icon name={weatherIcons[weather.weather.icon] || "weather-partly-cloudy"} size={14} color="#666" />
            <Text style={styles.temperatureText}>{Math.round(weather.temp.max)}°C</Text>
          </View>
        )}

        {/* Event indicators */}
        {day.events.length > 0 && (
          <View style={styles.eventIndicatorContainer}>
            {day.events.slice(0, 2).map((event, eventIndex) => (
              <View
                key={eventIndex}
                style={[styles.eventIndicator, { backgroundColor: event.indicatorColor || COLORS.primary }]}
              />
            ))}
            {day.events.length > 2 && <Text style={styles.moreEventsText}>+{day.events.length - 2}</Text>}
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // Handle day press
  const handleDayPress = (day: CalendarDay) => {
    setSelectedDay(day)
    setIsDayDetailsVisible(true)
  }

  // Render month view
  const renderMonthView = () => {
    return (
      <View style={styles.calendarContainer}>
        {/* Weekday headers */}
        <View style={styles.weekdayHeader}>
          {weekdayNames.map((name, index) => (
            <Text key={index} style={[styles.weekdayText, { color: isDarkMode ? colors.darkText : colors.text }]}>
              {name}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>{calendarDays.map((day, index) => renderDay(day, index))}</View>
      </View>
    )
  }

  // Render calendar header
  const renderCalendarHeader = () => {
    return (
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navigationButton}>
          <Icon name="chevron-left" size={24} color={isDarkMode ? colors.darkText : colors.text} />
        </TouchableOpacity>

        <View style={styles.monthYearContainer}>
          <Text style={[styles.monthYearText, { color: isDarkMode ? colors.darkText : colors.text }]}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
        </View>

        <TouchableOpacity onPress={goToNextMonth} style={styles.navigationButton}>
          <Icon name="chevron-right" size={24} color={isDarkMode ? colors.darkText : colors.text} />
        </TouchableOpacity>
      </View>
    )
  }

  // Render view mode selector
  const renderViewModeSelector = () => {
    return (
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === "month" && styles.activeViewMode]}
          onPress={() => setViewMode("month")}
        >
          <Text style={[styles.viewModeText, viewMode === "month" && styles.activeViewModeText]}>Tháng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === "week" && styles.activeViewMode]}
          onPress={() => setViewMode("week")}
        >
          <Text style={[styles.viewModeText, viewMode === "week" && styles.activeViewModeText]}>Tuần</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === "day" && styles.activeViewMode]}
          onPress={() => setViewMode("day")}
        >
          <Text style={[styles.viewModeText, viewMode === "day" && styles.activeViewModeText]}>Ngày</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === "list" && styles.activeViewMode]}
          onPress={() => setViewMode("list")}
        >
          <Text style={[styles.viewModeText, viewMode === "list" && styles.activeViewModeText]}>Danh sách</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Handle edit event
  const handleEditEvent = (calendarEvent: Event) => {
    setIsDayDetailsVisible(false)
    navigation.navigate('EditEvent', { event: calendarEvent })
  }

  // Handle delete event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      loadEvents() // Reload events after deletion
    } catch (error) {
      console.error('Error deleting event:', error)
      Alert.alert('Error', 'Could not delete event')
    }
  }

  // Handle create event
  const handleCreateEvent = () => {
    if (selectedDay) {
      setIsDayDetailsVisible(false)
      const date = new Date(selectedDay.date)
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      navigation.navigate('CreateEvent', { 
        date: formattedDate,
        timestamp: date.getTime()
      })
    }
  }

  // Main render
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? colors.dark.background : colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Today button */}
      <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
        <Text style={styles.todayButtonText}>Hôm nay</Text>
      </TouchableOpacity>

      {/* View mode selector */}
      {renderViewModeSelector()}

      {/* Calendar header */}
      {renderCalendarHeader()}

      {/* Loading indicator */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch...</Text>
        </View>
      ) : /* Calendar content based on view mode */
      viewMode === "month" ? (
        renderMonthView()
      ) : (
        <View style={styles.otherViewPlaceholder}>
          <Text style={styles.placeholderText}>
            {viewMode === "week" ? "Chế độ xem tuần" : viewMode === "day" ? "Chế độ xem ngày" : "Chế độ xem danh sách"}
          </Text>
          <Text style={styles.placeholderSubtext}>Tính năng này đang được phát triển</Text>
        </View>
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
        <DayDetailModal
          visible={isDayDetailsVisible}
          onClose={() => setIsDayDetailsVisible(false)}
          date={selectedDay.date}
          events={selectedDay.events}
          weather={selectedDay.weather}
          holiday={selectedDay.holiday}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          monthNames={monthNames}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 300,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  todayButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginVertical: 16,
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
  viewModeContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeViewMode: {
    backgroundColor: COLORS.primary,
  },
  viewModeText: {
    fontWeight: "600",
    color: "#424242",
    fontSize: 15,
  },
  activeViewModeText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navigationButton: {
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  monthYearContainer: {
    flex: 1,
    alignItems: "center",
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  calendarContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  weekdayHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  otherMonthDay: {
    backgroundColor: "#F9F9F9",
  },
  todayDay: {
    backgroundColor: "#E8F5E9",
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  otherMonthDayText: {
    color: "#AAAAAA",
  },
  todayDayText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  holidayContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
    alignItems: "center",
  },
  holidayText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  weatherContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  temperatureText: {
    fontSize: 10,
    color: "#666666",
    marginLeft: 2,
  },
  eventIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  eventIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  moreEventsText: {
    fontSize: 8,
    color: "#666666",
    marginLeft: 2,
  },
  otherViewPlaceholder: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#666666",
  },
})

export default SmartCalendar
