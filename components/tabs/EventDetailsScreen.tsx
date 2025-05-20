import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Share,
  Platform,
  Modal
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList, Event } from '../../SmartSchedulerApp'; // Adjust the import path as necessary
import SmartNotification from '../notifications/SmartNotification';
import { COLORS } from '../../styles/theme';

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
type EventDetailNavigationProp = StackNavigationProp<RootStackParamList>;

const EventDetailScreen: React.FC = () => {
  const route = useRoute<EventDetailRouteProp>();
  const navigation = useNavigation<EventDetailNavigationProp>();
  const { event } = route.params;
  const [reminderSet, setReminderSet] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Determine weekday from the event date
  const getWeekday = (date: Date) => {
    const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return weekdays[date.getDay()];
  };

  const formattedDate = `${getWeekday(event.date)}, ${event.day} tháng ${event.month.replace('Th.', '')}`;

  const handleEdit = () => {
    // Navigate back to schedule screen with edit flag
    navigation.goBack();
    // In a real app, you would pass data back to the schedule screen to edit this event
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa lịch này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: () => {
            // Delete logic would go here
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event.title} - ${formattedDate}\n\n${event.info}`,
        title: event.title,
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chia sẻ sự kiện');
    }
  };

  const toggleReminder = () => {
    // In a real app, you would set up a notification here
    setReminderSet(!reminderSet);
    
    if (!reminderSet) {
      Alert.alert(
        "Thông báo",
        "Đã thiết lập nhắc nhở cho sự kiện này",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Thông báo",
        "Đã hủy nhắc nhở cho sự kiện này",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Event header with color indicator */}
        <View style={[styles.header, { backgroundColor: event.indicatorColor }]}>
          <View style={styles.dateContainer}>
            <Text style={styles.day}>{event.day}</Text>
            <Text style={styles.month}>{event.month}</Text>
            <Text style={styles.weekday}>{getWeekday(event.date)}</Text>
          </View>
        </View>

        {/* Event details */}
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          <View style={styles.infoItem}>
            <Icon name="event" size={24} color="#555" style={styles.infoIcon} />
            <Text style={styles.infoText}>{formattedDate}</Text>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.infoItem}>
            <Icon name="subject" size={24} color="#555" style={styles.infoIcon} />
            <Text style={styles.infoText}>Chi tiết:</Text>
          </View>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{event.info || "Không có mô tả chi tiết"}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.reminderButton, reminderSet && styles.reminderActive]} 
          onPress={() => setShowNotificationSettings(true)}
        >
          <Icon 
            name={reminderSet ? "notifications-active" : "notifications-none"} 
            size={24} 
            color={reminderSet ? "#fff" : "#333"} 
          />
          <Text style={[styles.actionText, reminderSet && styles.activeActionText]}>
            {reminderSet ? "Đã thiết lập" : "Nhắc nhở"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
          <Icon name="share" size={24} color="#333" />
          <Text style={styles.actionText}>Chia sẻ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEdit}>
          <Icon name="edit" size={24} color="#fff" />
          <Text style={[styles.actionText, styles.activeActionText]}>Chỉnh sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
          <Icon name="delete" size={24} color="#fff" />
          <Text style={[styles.actionText, styles.activeActionText]}>Xóa</Text>
        </TouchableOpacity>
      </View>

      {/* Add notification settings modal */}
      <Modal
        visible={showNotificationSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cài đặt thông báo</Text>
              <TouchableOpacity 
                onPress={() => setShowNotificationSettings(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <SmartNotification 
              eventId={event.id}
              eventTitle={event.title}
              eventDateTime={event.date}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  day: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  month: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  weekday: {
    fontSize: 16,
    color: '#666',
  },
  eventDetails: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: -20,
    marginHorizontal: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  descriptionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  reminderButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reminderActive: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  shareButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionText: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
  },
  activeActionText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
});

export default EventDetailScreen;