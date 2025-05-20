import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { COLORS } from '../../styles/theme';
import { saveUserPreferences, getUserPreferences } from '../../services/firestore';
import { useAuth } from '../context/AuthContext';
import notifee, { TimestampTrigger, TriggerType, AndroidImportance } from '@notifee/react-native';

interface NotificationSettings {
  beforeMinutes: number;
  useVoice: boolean;
  useSound: boolean;
  volume: number;
}

interface UserPreferences {
  notificationSettings: NotificationSettings;
}

const SmartNotification = ({ eventId, eventTitle, eventDateTime }: { 
  eventId: string;
  eventTitle: string;
  eventDateTime: Date;
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    beforeMinutes: 15,
    useVoice: true,
    useSound: true,
    volume: 0.7,
  });

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      try {
        const prefs = await getUserPreferences(user.id);
        if (prefs?.notificationSettings) {
          setSettings(prefs.notificationSettings);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };
    loadSettings();
  }, [user]);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    if (user?.id) {
      try {
        await saveUserPreferences(user.id, {
          notificationSettings: updatedSettings
        });
        // Update notification if it's already set
        if (eventId) {
          await scheduleNotification(updatedSettings);
        }
      } catch (error) {
        console.error('Error saving notification settings:', error);
        Alert.alert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại.');
      }
    }
  };

  const scheduleNotification = async (currentSettings: NotificationSettings) => {
    try {
      // Cancel any existing notifications for this event
      await notifee.cancelTriggerNotification(eventId);

      // Calculate notification time
      const notificationTime = new Date(eventDateTime.getTime() - (currentSettings.beforeMinutes * 60 * 1000));
      
      // Create trigger
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationTime.getTime(),
      };

      // Create notification channel for Android
      if (Platform.OS === 'android') {
        const channelId = await notifee.createChannel({
          id: 'event-reminders',
          name: 'Event Reminders',
          sound: currentSettings.useSound ? 'notification' : undefined,
          importance: AndroidImportance.HIGH,
        });

        // Create the notification
        await notifee.createTriggerNotification(
          {
            id: eventId,
            title: 'Nhắc nhở sự kiện',
            body: `${eventTitle} sẽ bắt đầu trong ${currentSettings.beforeMinutes} phút nữa`,
            android: {
              channelId,
              importance: AndroidImportance.HIGH,
              sound: currentSettings.useSound ? 'notification' : undefined,
            },
          },
          trigger,
        );
      } else {
        // iOS notification
        await notifee.createTriggerNotification(
          {
            id: eventId,
            title: 'Nhắc nhở sự kiện',
            body: `${eventTitle} sẽ bắt đầu trong ${currentSettings.beforeMinutes} phút nữa`,
            ios: {
              sound: currentSettings.useSound ? 'notification.wav' : undefined,
            },
          },
          trigger,
        );
      }

      Alert.alert('Thành công', 'Đã thiết lập thông báo cho sự kiện');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Lỗi', 'Không thể thiết lập thông báo. Vui lòng thử lại.');
    }
  };

  const testNotification = async () => {
    try {
      if (Platform.OS === 'android') {
        const channelId = await notifee.createChannel({
          id: 'test-notification',
          name: 'Test Notifications',
          sound: settings.useSound ? 'notification' : undefined,
          importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
          title: 'Thử nghiệm thông báo',
          body: `${eventTitle} sẽ bắt đầu trong ${settings.beforeMinutes} phút nữa`,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            sound: settings.useSound ? 'notification' : undefined,
          },
        });
      } else {
        await notifee.displayNotification({
          title: 'Thử nghiệm thông báo',
          body: `${eventTitle} sẽ bắt đầu trong ${settings.beforeMinutes} phút nữa`,
          ios: {
            sound: settings.useSound ? 'notification.wav' : undefined,
          },
        });
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      Alert.alert('Lỗi', 'Không thể hiển thị thông báo thử nghiệm');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thời gian nhắc trước</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>{settings.beforeMinutes} phút</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={60}
            step={5}
            value={settings.beforeMinutes}
            onValueChange={(value) => updateSettings({ beforeMinutes: value })}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>5 phút</Text>
            <Text style={styles.sliderLabel}>60 phút</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Thông báo bằng giọng nói</Text>
            <Text style={styles.settingDesc}>AI sẽ đọc thông tin sự kiện</Text>
          </View>
          <Switch
            value={settings.useVoice}
            onValueChange={(value) => updateSettings({ useVoice: value })}
            trackColor={{ false: '#767577', true: COLORS.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Âm thanh thông báo</Text>
            <Text style={styles.settingDesc}>Phát âm thanh khi thông báo</Text>
          </View>
          <Switch
            value={settings.useSound}
            onValueChange={(value) => updateSettings({ useSound: value })}
            trackColor={{ false: '#767577', true: COLORS.primary }}
          />
        </View>

        {settings.useSound && (
          <View style={styles.volumeContainer}>
            <Text style={styles.volumeLabel}>Âm lượng: {Math.round(settings.volume * 100)}%</Text>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              step={0.1}
              value={settings.volume}
              onValueChange={(value) => updateSettings({ volume: value })}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={testNotification}
        >
          <Icon name="notifications" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Thử thông báo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={() => scheduleNotification(settings)}
        >
          <Icon name="save" size={24} color="#FFF" />
          <Text style={styles.buttonText}>Lưu cài đặt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: COLORS.text,
  },
  settingDesc: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  volumeContainer: {
    marginTop: 8,
  },
  volumeLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  volumeSlider: {
    width: '100%',
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  testButton: {
    backgroundColor: COLORS.status.info,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SmartNotification; 