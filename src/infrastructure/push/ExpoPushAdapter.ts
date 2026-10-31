import {
  Expo,
  ExpoPushMessage
} from 'expo-server-sdk';

import {
  PushMessage
} from '../../domain/ports/NotificationSender';

type PushResult = {
  status: 'sent' | 'failed';
  error?: string;
};

export class ExpoPushAdapter {// Implement the notification sender interface
  private expo: Expo;
  constructor(accessToken?: string) {
    this.expo = new Expo({ accessToken });
  }

  async send(message: PushMessage): Promise<PushResult> {
    if (!Expo.isExpoPushToken(message.token)) {
        return {
            status: 'failed',
            error: 'Invalid Expo push token'
        };
    }
    const payload: ExpoPushMessage = {
      to: message.token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data,
      priority: 'high',
      channelId: 'orders'
    };

    try {
      const [ticket] = await this.expo.sendPushNotificationsAsync([payload]);

      if (ticket.status === 'ok') {
        return { status: 'sent' };
      }

      return {
        status: 'failed',
        error: ticket.message || ticket.details?.error || 'Push notification failed'
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to send push notification'
      };
    }
  }
}
