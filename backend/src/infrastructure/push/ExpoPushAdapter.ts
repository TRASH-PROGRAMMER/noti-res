import {
  Expo,
  ExpoPushMessage
} from 'expo-server-sdk';

import {
  NotificationSender,
  PushMessage,
  PushTicketResult
} from '../../domain/ports/NotificationSender';

export class ExpoPushAdapter implements NotificationSender { // Implement the notification sender interface
  private expo: Expo;

  constructor(accessToken?: string) {
    this.expo = new Expo({ accessToken });
  }

  async sendBatch(messages: PushMessage[]): Promise<PushTicketResult[]> {
    if (messages.length === 0) {
      return [];
    }

    const results: PushTicketResult[] = new Array(messages.length);
    const validEntries: Array<{ index: number; payload: ExpoPushMessage }> = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (!Expo.isExpoPushToken(message.token)) {
        results[i] = {
          status: 'error',
          message: 'Invalid Expo push token',
          details: { error: 'INVALID_TOKEN' }
        };
        continue;
      }

      validEntries.push({
        index: i,
        payload: {
          to: message.token,
          sound: 'default',
          title: message.title,
          body: message.body,
          data: message.data,
          priority: 'high',
          channelId: 'orders'
        }
      });
    }

    if (validEntries.length === 0) {
      return results;
    }

    // Divide hasta 100 mensajes por lote según el límite de Expo SDK.
    const chunks = this.expo.chunkPushNotifications(
      validEntries.map((entry) => entry.payload)
    );

    let offset = 0;

    for (const chunk of chunks) {
      const chunkEntries = validEntries.slice(offset, offset + chunk.length);
      offset += chunk.length;

      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);

        for (let j = 0; j < chunkEntries.length; j++) {
          const targetIndex = chunkEntries[j].index;
          const ticket = tickets[j];

          if (!ticket) {
            results[targetIndex] = {
              status: 'error',
              message: 'Expo did not return a ticket for this message',
              details: { error: 'MISSING_TICKET' }
            };
            continue;
          }

          if (ticket.status === 'ok') {
            results[targetIndex] = {
              status: 'ok',
              id: ticket.id
            };
          } else {
            results[targetIndex] = {
              status: 'error',
              message:
                ticket.message ||
                ticket.details?.error ||
                'Push notification failed',
              details: ticket.details
            };
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to send push notification';

        for (const entry of chunkEntries) {
          results[entry.index] = {
            status: 'error',
            message: errorMessage,
            details: { error: 'EXPO_REQUEST_ERROR' }
          };
        }
      }
    }

    return results;
  }
}
