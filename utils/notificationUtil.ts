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

export async function requestNotificationsPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput = null,
    data: { type: string } = { type: 'default' }
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
                data
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

export async function schedulePracticeReminder(days: number = 1): Promise<void> {
    try {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

        const existingReminder = scheduledNotifications.find(
            notification => notification.content.data?.type === 'practice_reminder'
        );

        if (existingReminder) {
            return;
        }

        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + days);
        triggerDate.setHours(18, 0, 0);

        await scheduleNotification(
            'Time to Practice Math',
            'Regular practice helps reinforce concepts. Open MathCalc to solve some problems!',
            {
                type: SchedulableTriggerInputTypes.DATE,
                date: triggerDate
            },
            { type: 'practice_reminder' }
        );

        console.log('Practice reminder scheduled for', triggerDate);
    } catch (error) {
        console.error('Failed to schedule practice reminder:', error);
    }
}

export async function notifySolutionComplete(problem: string): Promise<void> {
    await scheduleNotification(
        'Solution Complete',
        `Your solution for "${problem.length > 30 ? problem.substring(0, 30) + '...' : problem}" is ready to review.`
    );
}

export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}
