"use client"

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { WeatherData } from '../../services/apiService'
import { COLORS } from '../../styles/theme'

interface WeatherForecastListProps {
  data: WeatherData[]
}

const WeatherForecastList: React.FC<WeatherForecastListProps> = ({ data }) => {
  // Format date to Vietnamese format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    return `${weekdays[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`
  }

  // Capitalize first letter of description
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Get weather icon based on weather condition and temperature
  const getWeatherIcon = (weather: WeatherData) => {
    const temp = weather.temp.day
    const condition = weather.weather.main.toLowerCase()
    const timeOfDay = new Date().getHours() >= 18 || new Date().getHours() < 6 ? 'night' : 'day'

    // Map weather conditions to Material Icons
    const weatherIconMap = {
      // Mưa
      rain: 'water_drop',
      drizzle: 'grain',
      // Giông bão
      thunderstorm: 'thunderstorm',
      // Tuyết
      snow: 'ac_unit',
      // Sương mù
      mist: 'foggy',
      fog: 'foggy',
      haze: 'foggy',
      // Mây
      clouds: {
        few: 'partly_cloudy_day',
        scattered: 'cloud_queue',
        broken: 'cloud',
        overcast: 'cloud'
      },
      // Trời quang
      clear: {
        hot: 'wb_sunny',        // >= 35°C
        warm: 'light_mode',     // >= 30°C
        mild: 'wb_twilight',    // >= 25°C
        cool: 'nights_stay',    // < 20°C
        default: timeOfDay === 'night' ? 'nights_stay' : 'wb_sunny'
      }
    }

    // Xử lý trường hợp mưa
    if (condition.includes('rain') || condition.includes('drizzle')) {
      return weatherIconMap.rain
    }

    // Xử lý trường hợp giông bão
    if (condition.includes('thunderstorm')) {
      return weatherIconMap.thunderstorm
    }

    // Xử lý trường hợp tuyết
    if (condition.includes('snow')) {
      return weatherIconMap.snow
    }

    // Xử lý trường hợp sương mù
    if (['mist', 'fog', 'haze'].some(item => condition.includes(item))) {
      return weatherIconMap.mist
    }

    // Xử lý trường hợp mây
    if (condition.includes('clouds')) {
      const description = weather.weather.description.toLowerCase()
      if (description.includes('few')) return weatherIconMap.clouds.few
      if (description.includes('scattered')) return weatherIconMap.clouds.scattered
      if (description.includes('broken')) return weatherIconMap.clouds.broken
      return weatherIconMap.clouds.overcast
    }

    // Xử lý trời quang
    if (condition.includes('clear')) {
      if (temp >= 35) return weatherIconMap.clear.hot
      if (temp >= 30) return weatherIconMap.clear.warm
      if (temp >= 25) return weatherIconMap.clear.mild
      if (temp < 20) return weatherIconMap.clear.cool
      return weatherIconMap.clear.default
    }

    // Mặc định
    return weatherIconMap.clear.default
  }

  return (
    <View style={styles.container}>
      {data.map((item) => {
        const iconName = getWeatherIcon(item)
        return (
          <View key={item.date} style={styles.itemContainer}>
            <Icon name={iconName} size={32} color={COLORS.primary} />
            <View style={styles.infoContainer}>
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
              <Text style={styles.tempText}>
                {Math.round(item.temp.max)}°C / {Math.round(item.temp.min)}°C
              </Text>
              <Text style={styles.descText}>
                {capitalizeFirstLetter(item.weather.description)}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  tempText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 2,
  },
  descText: {
    fontSize: 14,
    color: '#888888',
  },
})

export default WeatherForecastList 