import {
  Expo,
  ExpoPushMessage
} from 'expo-server-sdk';

import {
  NotificationSender,
  PushMessage,
  PushResult
} from '../../domain/ports/NotificationSender';

export class ExpoPushAdapter implements NotificationSender {// Implement the NotificationSender interface
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
    const playload: ExpoPushMessage = {
      to: message.token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data,
      priority: 'high',
      channelId: 'orders'
    };
    


