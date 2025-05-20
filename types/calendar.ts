export interface WeatherData {
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

export interface HolidayData {
  date: string // Format: YYYY-MM-DD
  name: string
  localName: string
}

export interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  color?: string
  date: string
}

export interface CalendarDay {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  events: Event[]
  weather?: WeatherData
  holiday?: HolidayData
} 