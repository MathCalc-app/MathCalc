import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSettings } from './storageUtil';
import {SchedulableTriggerInputTypes} from "expo-notifications/build/Notifications.types";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Requests permission to send notifications
 * @returns A boolean indicating if permission was granted
 */
export async function requestNotificationsPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

/**
 * Schedule a local notification if notifications are enabled in settings
 * @param title The notification title
 * @param body The notification body text
 * @param trigger When to show the notification (default: immediate)
 * @returns The notification identifier or null if notifications are disabled
 */
export async function scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput = null
): Promise<string | null> {
    try {
        const settings = await getSettings();

        if (!settings.notificationsEnabled) {
            console.log('Notification not sent: disabled in settings');
            return null;
        }

        const hasPermission = await requestNotificationsPermission();

        if (!hasPermission) {
            console.log('Notification not sent: no permission');
            return null;
        }

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger,
        });

        console.log(`Notification scheduled: ${identifier}`);
        return identifier;
    } catch (error) {
        console.error('Failed to schedule notification:', error);
        return null;
    }
}

/**
 * Schedules a reminder to practice math after the specified number of days
 * @param days Number of days after which to show the reminder
 */
export async function schedulePracticeReminder(days: number = 1): Promise<void> {
    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + days);
    triggerDate.setHours(18, 0, 0);

    await scheduleNotification(
        'Time to Practice Math',
        'Regular practice helps reinforce concepts. Open the app to solve some problems!',
        {
            type: SchedulableTriggerInputTypes.DATE,
            date: triggerDate
        }
    );
}

/**
 * Sends an immediate notification about a completed solution
 * @param problem The math problem that was solved
 */
export async function notifySolutionComplete(problem: string): Promise<void> {
    await scheduleNotification(
        'Solution Complete',
        `Your solution for "${problem.length > 30 ? problem.substring(0, 30) + '...' : problem}" is ready to review.`
    );
}

/**
 * Cancels all pending notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancels a specific notification by ID
 * @param notificationId The ID of the notification to cancel
 */
export async function cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}
