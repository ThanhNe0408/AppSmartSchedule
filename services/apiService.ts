// OpenWeatherMap API key
const WEATHER_API_KEY = "b2c3a6c53115bc72cddd4c4a1b4f5455"

// Weather forecast interface
interface WeatherForecastResponse {
  list: Array<{
    dt: number
    main: {
      temp: number
      temp_min: number
      temp_max: number
    }
    weather: Array<{
      id: number
      main: string
      description: string
      icon: string
    }>
  }>
}

// Holiday interface
interface HolidayResponse {
  date: string
  localName: string
  name: string
  countryCode: string
  fixed: boolean
  global: boolean
  counties: string[] | null
  launchYear: number | null
  types: string[]
}

/**
 * Fetch weather forecast data from OpenWeatherMap API
 * @param lat Latitude
 * @param lon Longitude
 * @param days Number of days to forecast (max 5)
 * @returns Processed weather data
 */
export const fetchWeatherForecast = async (lat: number, lon: number, days = 5) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`,
    )
    
    if (!response.ok) {
      throw new Error(`Weather API returned status: ${response.status}`)
    }
    
    const data: WeatherForecastResponse = await response.json()

    // Group forecast data by day
    const dailyForecasts = new Map<string, {
      temp_max: number
      temp_min: number
      weather: {
        main: string
        description: string
        icon: string
      }
    }>()

    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000)
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

      const existing = dailyForecasts.get(dateKey)
      if (existing) {
        existing.temp_max = Math.max(existing.temp_max, item.main.temp_max)
        existing.temp_min = Math.min(existing.temp_min, item.main.temp_min)
      } else {
        dailyForecasts.set(dateKey, {
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          weather: {
            main: item.weather[0].main,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
          }
        })
      }
    })

    // Convert to array and sort by date
    return Array.from(dailyForecasts.entries())
      .map(([date, forecast]) => ({
        date,
        temp: {
          day: (forecast.temp_max + forecast.temp_min) / 2,
          min: forecast.temp_min,
          max: forecast.temp_max,
        },
        weather: forecast.weather,
      }))
      .slice(0, days)

  } catch (error) {
    console.error("Error fetching weather data:", error)
    // If the API fails, return mock data for development
    return generateMockWeatherData(days)
  }
}

/**
 * Fetch public holidays from Nager.Date API
 * @param year Year to fetch holidays for
 * @param countryCode Country code (e.g., VN for Vietnam)
 * @returns List of holidays
 */
export const fetchPublicHolidays = async (year: number, countryCode: string) => {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
    const data: HolidayResponse[] = await response.json()

    // Process the response data
    return data.map((item) => ({
      date: item.date,
      name: item.name,
      localName: item.localName,
    }))
  } catch (error) {
    console.error("Error fetching holiday data:", error)

    // If the API fails, return mock data for development
    return generateMockHolidayData(year)
  }
}

/**
 * Generate mock weather data for development
 * @param days Number of days to generate
 * @returns Mock weather data
 */
const generateMockWeatherData = (days: number) => {
  const today = new Date()
  const mockData = []

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    // Random temperature between 25-35°C
    const maxTemp = Math.floor(Math.random() * 10) + 25
    const minTemp = maxTemp - Math.floor(Math.random() * 8) - 2

    // Random weather conditions
    const weatherConditions = [
      { main: "Clear", description: "clear sky", icon: "01d" },
      { main: "Clouds", description: "few clouds", icon: "02d" },
      { main: "Clouds", description: "scattered clouds", icon: "03d" },
      { main: "Clouds", description: "broken clouds", icon: "04d" },
      { main: "Rain", description: "light rain", icon: "10d" },
    ]

    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]

    mockData.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      temp: {
        day: (maxTemp + minTemp) / 2,
        min: minTemp,
        max: maxTemp,
      },
      weather: {
        main: randomWeather.main,
        description: randomWeather.description,
        icon: randomWeather.icon,
      },
    })
  }

  return mockData
}

/**
 * Generate mock holiday data for development
 * @param year Year to generate holidays for
 * @returns Mock holiday data
 */
const generateMockHolidayData = (year: number) => {
  return [
    {
      date: `${year}-01-01`,
      name: "International New Year's Day",
      localName: "Tết Dương lịch",
    },
    {
      date: `${year}-01-25`,
      name: "Tet Holiday",
      localName: "Tết Nguyên đán",
    },
    {
      date: `${year}-01-28`,
      name: "Vietnamese New Year's Eve",
      localName: "Giao thừa",
    },
    {
      date: `${year}-01-29`,
      name: "Vietnamese New Year",
      localName: "Tết Nguyên đán",
    },
    {
      date: `${year}-01-30`,
      name: "Tet Holiday",
      localName: "Tết Nguyên đán",
    },
    {
      date: `${year}-02-14`,
      name: "Valentine's Day",
      localName: "Lễ tình nhân",
    },
    {
      date: `${year}-03-20`,
      name: "March Equinox",
      localName: "Xuân phân",
    },
    {
      date: `${year}-04-07`,
      name: "Hung Kings Festival",
      localName: "Giỗ Tổ Hùng Vương",
    },
    {
      date: `${year}-04-20`,
      name: "Easter Sunday",
      localName: "Lễ Phục sinh",
    },
    {
      date: `${year}-04-26`,
      name: "Working Day for May 2",
      localName: "Ngày làm bù",
    },
    {
      date: `${year}-04-30`,
      name: "Liberation Day/Reunification Day",
      localName: "Ngày giải phóng miền Nam",
    },
    {
      date: `${year}-05-01`,
      name: "International Labor Day",
      localName: "Ngày Quốc tế Lao động",
    },
    {
      date: `${year}-05-02`,
      name: "International Labor Day Holiday",
      localName: "Ngày Quốc tế Lao động",
    },
    {
      date: `${year}-05-12`,
      name: "Vesak",
      localName: "Lễ Phật Đản",
    },
    {
      date: `${year}-06-21`,
      name: "June Solstice",
      localName: "Hạ chí",
    },
    {
      date: `${year}-06-28`,
      name: "Vietnamese Family Day",
      localName: "Ngày Gia đình Việt Nam",
    },
    {
      date: `${year}-09-01`,
      name: "Independence Day Holiday",
      localName: "Ngày Quốc khánh",
    },
    {
      date: `${year}-09-02`,
      name: "Independence Day",
      localName: "Ngày Quốc khánh",
    },
    {
      date: `${year}-09-22`,
      name: "September Equinox",
      localName: "Thu phân",
    },
    {
      date: `${year}-10-20`,
      name: "Vietnamese Women's Day",
      localName: "Ngày Phụ nữ Việt Nam",
    },
    {
      date: `${year}-10-31`,
      name: "Halloween",
      localName: "Lễ hội Halloween",
    },
    {
      date: `${year}-12-21`,
      name: "December Solstice",
      localName: "Đông chí",
    },
    {
      date: `${year}-12-24`,
      name: "Christmas Eve",
      localName: "Đêm Giáng sinh",
    },
    {
      date: `${year}-12-25`,
      name: "Christmas Day",
      localName: "Lễ Giáng sinh",
    },
    {
      date: `${year}-12-31`,
      name: "International New Year's Eve",
      localName: "Đêm Giao thừa",
    },
  ]
}

// Weather icon mapping for Material Icons
export const weatherIcons: { [key: string]: string } = {
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

// Holiday types and colors
export const holidayTypes: { [key: string]: string } = {
  "Tết Dương lịch": "#4CAF50", // Green
  "Tết Nguyên đán": "#E91E63", // Pink
  "Ngày giải phóng miền Nam": "#2196F3", // Blue
  "Ngày Quốc tế Lao động": "#FF9800", // Orange
  "Lễ Phật Đản": "#9C27B0", // Purple
  "Giỗ Tổ Hùng Vương": "#2196F3", // Blue
  "Ngày Quốc khánh": "#2196F3", // Blue
  "Lễ Giáng sinh": "#F44336", // Red
  default: "#4CAF50", // Default green
}

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

export interface CalendarDay {
  date: Date
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  events: any[]
  weather?: WeatherData
  holiday?: HolidayData
}
