import notifee, {
  type TimestampTrigger,
  TriggerType,
  type RepeatFrequency,
  AndroidImportance,
  EventType,
} from "@notifee/react-native"
import { Platform } from "react-native"
import firestore from '@react-native-firebase/firestore'

// Define types
export interface NotificationSettings {
  enabled: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  selectedSoundId: string
  volume: number
  repeatFrequency: RepeatFrequency | null
  snoozeEnabled: boolean
  snoozeDuration: number
  smartNotifications: boolean
  notificationColor: string
  notificationIcon: string
  showInForeground: boolean
}

export interface ScheduledNotification {
  id: string
  title: string
  body: string
  timestamp: number
  repeatFrequency: RepeatFrequency | null
  soundId: string
  eventId?: string
  categoryId?: string
}

// Default notification settings
export const defaultSettings: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  selectedSoundId: "default",
  volume: 0.7,
  repeatFrequency: null,
  snoozeEnabled: true,
  snoozeDuration: 5,
  smartNotifications: false,
  notificationColor: "#6C63FF",
  notificationIcon: "notifications",
  showInForeground: true,
}

// Initialize notification channels for Android
export const initializeNotifications = async () => {
  // Create default channel for Android
  if (Platform.OS === "android") {
    await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      sound: "default",
      importance: AndroidImportance.HIGH,
    })

    // Create channel for reminders
    await notifee.createChannel({
      id: "reminders",
      name: "Reminders",
      sound: "default",
      importance: AndroidImportance.HIGH,
      vibration: true,
    })

    // Create channel for events
    await notifee.createChannel({
      id: "events",
      name: "Events",
      sound: "default",
      importance: AndroidImportance.HIGH,
      vibration: true,
    })
  }

  // Set up foreground service options for Android
  if (Platform.OS === "android") {
    await notifee.registerForegroundService((notification) => {
      return new Promise(() => {
        // Keep the service alive until stopForegroundService is called
      })
    })
  }

  // Set up notification listeners
  return notifee.onForegroundEvent(({ type, detail }) => {
    switch (type) {
      case EventType.DISMISSED:
        console.log("User dismissed notification", detail.notification)
        break
      case EventType.PRESS:
        console.log("User pressed notification", detail.notification)
        break
      case EventType.ACTION_PRESS:
        console.log("User pressed notification action", detail.pressAction)
        if (detail.pressAction?.id === "snooze") {
          // Handle snooze action
          handleSnoozeAction(detail.notification)
        }
        break
    }
  })
}

// Handle snooze action
const handleSnoozeAction = async (notification: any) => {
  if (!notification) return

  try {
    // Get user settings
    const settings = await getUserSettings()

    // Calculate new time (current time + snooze duration)
    const snoozeTime = new Date(Date.now() + settings.snoozeDuration * 60 * 1000)

    // Create a new notification with the same content but new time
    await scheduleNotification({
      title: notification.title || "Reminder",
      body: notification.body || "",
      date: snoozeTime,
      sound: settings.selectedSoundId,
      vibration: settings.vibrationEnabled,
      repeatFrequency: null, // Snoozed notifications don't repeat
      data: notification.data,
    })

    console.log("Notification snoozed for", settings.snoozeDuration, "minutes")
  } catch (error) {
    console.error("Error handling snooze action:", error)
  }
}

// Get user notification settings
export const getUserSettings = async (userId?: string): Promise<NotificationSettings> => {
  if (!userId) {
    return defaultSettings
  }

  try {
    const doc = await firestore().collection("userSettings").doc(userId).get()
    const data = doc.data()

    if (data && typeof data === 'object' && 'notificationSettings' in data) {
      return {
        ...defaultSettings,
        ...data.notificationSettings,
      }
    }

    return defaultSettings
  } catch (error) {
    console.error("Error getting user notification settings:", error)
    return defaultSettings
  }
}

// Save user notification settings
export const saveUserSettings = async (userId: string, settings: Partial<NotificationSettings>): Promise<void> => {
  try {
    await firestore().collection("userSettings").doc(userId).set(
      {
        notificationSettings: settings,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    console.log("User notification settings saved")
  } catch (error) {
    console.error("Error saving user notification settings:", error)
    throw error
  }
}

// Schedule a notification
export const scheduleNotification = async ({
  title,
  body,
  date,
  sound = "default",
  vibration = true,
  repeatFrequency = null,
  data = {},
  channelId = "default",
}: {
  title: string
  body: string
  date: Date
  sound?: string
  vibration?: boolean
  repeatFrequency?: RepeatFrequency | null
  data?: any
  channelId?: string
}): Promise<string> => {
  try {
    // Create trigger
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: repeatFrequency === null ? undefined : repeatFrequency,
    }

    // Create notification
    const notificationId = await notifee.createTriggerNotification(
      {
        title,
        body,
        data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound: sound !== "none" ? sound : undefined,
          vibrationPattern: vibration ? [300, 500] : undefined,
          smallIcon: "ic_notification",
          pressAction: {
            id: "default",
          },
          actions: [
            {
              title: "Tạm hoãn",
              pressAction: {
                id: "snooze",
              },
            },
          ],
        },
        ios: {
          sound: sound !== "none" ? sound : undefined,
          foregroundPresentationOptions: {
            badge: true,
            sound: sound !== "none",
            banner: true,
            list: true,
          },
        },
      },
      trigger,
    )

    console.log("Notification scheduled with ID:", notificationId)
    return notificationId
  } catch (error) {
    console.error("Error scheduling notification:", error)
    throw error
  }
}

// Cancel a notification
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await notifee.cancelNotification(notificationId)
    console.log("Notification canceled:", notificationId)
  } catch (error) {
    console.error("Error canceling notification:", error)
    throw error
  }
}

// Cancel all notifications
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await notifee.cancelAllNotifications()
    console.log("All notifications canceled")
  } catch (error) {
    console.error("Error canceling all notifications:", error)
    throw error
  }
}

// Get all scheduled notifications
export const getScheduledNotifications = async (): Promise<any[]> => {
  try {
    const notifications = await notifee.getTriggerNotifications()
    return notifications
  } catch (error) {
    console.error("Error getting scheduled notifications:", error)
    throw error
  }
}

// Display an immediate notification
export const displayNotification = async ({
  title,
  body,
  sound = "default",
  vibration = true,
  data = {},
  channelId = "default",
}: {
  title: string
  body: string
  sound?: string
  vibration?: boolean
  data?: any
  channelId?: string
}): Promise<string> => {
  try {
    const notificationId = await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        sound: sound !== "none" ? sound : undefined,
        vibrationPattern: vibration ? [300, 500] : undefined,
        smallIcon: "ic_notification",
        pressAction: {
          id: "default",
        },
      },
      ios: {
        sound: sound !== "none" ? sound : undefined,
        foregroundPresentationOptions: {
          badge: true,
          sound: sound !== "none",
          banner: true,
          list: true,
        },
      },
    })

    console.log("Notification displayed with ID:", notificationId)
    return notificationId
  } catch (error) {
    console.error("Error displaying notification:", error)
    throw error
  }
}

// Save a scheduled notification to Firestore
export const saveScheduledNotification = async (userId: string, notification: ScheduledNotification): Promise<void> => {
  try {
    await firestore().collection("users").doc(userId).collection("scheduledNotifications").doc(notification.id).set({
        ...notification,
        createdAt: firestore.FieldValue.serverTimestamp(),
      })

    console.log("Scheduled notification saved to Firestore")
  } catch (error) {
    console.error("Error saving scheduled notification to Firestore:", error)
    throw error
  }
}

// Get all scheduled notifications from Firestore
export const getScheduledNotificationsFromFirestore = async (userId: string): Promise<ScheduledNotification[]> => {
  try {
    const snapshot = await firestore().collection("users").doc(userId).collection("scheduledNotifications").get()

    const notifications: ScheduledNotification[] = []
    snapshot.forEach((doc: any) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      } as ScheduledNotification)
    })

    return notifications
  } catch (error) {
    console.error("Error getting scheduled notifications from Firestore:", error)
    throw error
  }
}

// Delete a scheduled notification from Firestore
export const deleteScheduledNotificationFromFirestore = async (
  userId: string,
  notificationId: string,
): Promise<void> => {
  try {
    await firestore().collection("users").doc(userId).collection("scheduledNotifications").doc(notificationId).delete()

    console.log("Scheduled notification deleted from Firestore")
  } catch (error) {
    console.error("Error deleting scheduled notification from Firestore:", error)
    throw error
  }
}

// Sync notifications between device and Firestore
export const syncNotifications = async (userId: string): Promise<void> => {
  try {
    // Get all scheduled notifications from device
    const deviceNotifications = await notifee.getTriggerNotifications()

    // Get all scheduled notifications from Firestore
    const firestoreNotifications = await getScheduledNotificationsFromFirestore(userId)

    // Map device notifications by ID
    const deviceNotificationsMap = new Map()
    deviceNotifications.forEach((notification) => {
      deviceNotificationsMap.set(notification.notification.id, notification)
    })

    // Map Firestore notifications by ID
    const firestoreNotificationsMap = new Map()
    firestoreNotifications.forEach((notification) => {
      firestoreNotificationsMap.set(notification.id, notification)
    })

    // Add notifications from Firestore that don't exist on device
    for (const notification of firestoreNotifications) {
      if (!deviceNotificationsMap.has(notification.id)) {
        // Schedule notification on device
        await scheduleNotification({
          title: notification.title,
          body: notification.body,
          date: new Date(notification.timestamp),
          repeatFrequency: notification.repeatFrequency,
          sound: notification.soundId,
          data: { id: notification.id },
        })
      }
    }

    // Add notifications from device that don't exist in Firestore
    for (const [id, notification] of deviceNotificationsMap.entries()) {
      if (!firestoreNotificationsMap.has(id)) {
        // Save notification to Firestore
        await saveScheduledNotification(userId, {
          id,
          title: notification.notification.title || "",
          body: notification.notification.body || "",
          timestamp: notification.trigger.timestamp || Date.now(),
          repeatFrequency: (notification.trigger as TimestampTrigger).repeatFrequency || null,
          soundId: notification.notification.android?.sound || "default",
        })
      }
    }

    console.log("Notifications synced between device and Firestore")
  } catch (error) {
    console.error("Error syncing notifications:", error)
    throw error
  }
}

export default {
  initializeNotifications,
  getUserSettings,
  saveUserSettings,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  displayNotification,
  saveScheduledNotification,
  getScheduledNotificationsFromFirestore,
  deleteScheduledNotificationFromFirestore,
  syncNotifications,
}
