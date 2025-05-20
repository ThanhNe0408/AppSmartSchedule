"use client"

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { CalendarDay, Event, WeatherData, HolidayData } from '../../types/calendar'
import WeatherForecastList from '../weather/WeatherForecastList'

interface DayDetailModalProps {
  visible: boolean
  onClose: () => void
  date: Date
  events: Event[]
  weather?: WeatherData
  holiday?: HolidayData
  onEditEvent?: (event: Event) => void
  onDeleteEvent?: (eventId: string) => void
  monthNames?: string[]
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  visible,
  onClose,
  date,
  events,
  weather,
  holiday,
  onEditEvent,
  onDeleteEvent,
  monthNames = [
    "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
    "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
  ]
}) => {
  const [activeTab, setActiveTab] = useState('Lịch')
  const tabs = ['Lịch', 'Thời tiết', 'Phân tích', 'Cài đặt']

  const formattedDate = `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{formattedDate}</Text>
            <TouchableOpacity onPress={onClose} style={styles.addButton}>
              <Icon name="add" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.modalScrollContent}>
            {activeTab === 'Lịch' && (
              <>
                {holiday && (
                  <View style={styles.eventItem}>
                    <View style={styles.eventTimeColumn}>
                      <Text style={styles.eventTime}>01:00</Text>
                      <Text style={styles.eventTime}>CH</Text>
                    </View>
                    <View style={[styles.eventContent, { borderLeftColor: '#4CAF50' }]}>
                      <Text style={styles.eventTitle}>{holiday.localName}</Text>
                      <Text style={styles.eventSubtitle}>Public holiday</Text>
                    </View>
                  </View>
                )}

                {events.map((event: Event, index: number) => {
                  const startTime = event.startTime || '00:00'
                  const hour = parseInt(startTime.split(':')[0])
                  const minutes = startTime.split(':')[1] || '00'
                  const ampm = hour >= 12 ? 'CH' : 'SA'
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.eventItem}
                      onPress={() => onEditEvent && onEditEvent(event)}
                    >
                      <View style={styles.eventTimeColumn}>
                        <Text style={styles.eventTime}>
                          {String(displayHour).padStart(2, '0')}:{minutes}
                        </Text>
                        <Text style={styles.eventTime}>{ampm}</Text>
                      </View>
                      <View style={[styles.eventContent, { borderLeftColor: event.color || '#4CAF50' }]}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        {event.description && (
                          <Text style={styles.eventSubtitle}>{event.description}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )
                })}

                {!holiday && events.length === 0 && (
                  <Text style={styles.noEventsText}>Không có sự kiện</Text>
                )}
              </>
            )}

            {activeTab === 'Thời tiết' && (
              <View style={styles.weatherContainer}>
                {weather ? (
                  <>
                    <WeatherForecastList data={[weather]} />
                    <View style={styles.weatherTipsContainer}>
                      <Text style={styles.weatherTipsTitle}>Gợi ý cho bạn:</Text>
                      <Text style={styles.weatherTips}>
                        {weather.temp.max >= 35 ? (
                          "• Thời tiết rất nóng, hãy uống đủ nước và tránh ra ngoài vào giữa trưa"
                        ) : weather.temp.max >= 30 ? (
                          "• Thời tiết nóng, nhớ bôi kem chống nắng khi ra ngoài"
                        ) : weather.temp.max < 20 ? (
                          "• Thời tiết mát mẻ, thích hợp cho các hoạt động ngoài trời"
                        ) : (
                          "• Thời tiết dễ chịu, thích hợp cho mọi hoạt động"
                        )}
                      </Text>
                      {weather.weather.main.toLowerCase().includes('rain') && (
                        <Text style={styles.weatherTips}>• Nhớ mang theo ô khi ra ngoài</Text>
                      )}
                    </View>
                  </>
                ) : (
                  <Text style={styles.noWeatherText}>Không có dữ liệu thời tiết</Text>
                )}
              </View>
            )}

            {activeTab === 'Phân tích' && (
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
              </View>
            )}

            {activeTab === 'Cài đặt' && (
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderText}>Tính năng đang phát triển</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4CAF50',
  },
  modalScrollContent: {
    flex: 1,
    paddingVertical: 10,
  },
  eventItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  eventTimeColumn: {
    width: 65,
    marginRight: 15,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  eventContent: {
    flex: 1,
    borderLeftWidth: 3,
    paddingLeft: 15,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  noEventsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  placeholderContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  weatherContainer: {
    padding: 20,
  },
  weatherTipsContainer: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
  },
  weatherTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  weatherTips: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  noWeatherText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
})

export default DayDetailModal
