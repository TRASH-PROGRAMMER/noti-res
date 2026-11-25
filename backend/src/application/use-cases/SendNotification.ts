import { DeliveryStatus } from '../../domain/entities/DeliveryStatus';
import { DeliveryRepository } from '../../domain/ports/DeliveryRepository';
import { DeviceRepository } from '../../domain/ports/DeviceRepository';
import { NotificationRepository } from '../../domain/ports/NotificationRepository';
import {
  NotificationSender,
  PushMessage,
  PushTicketResult
} from '../../domain/ports/NotificationSender';
import { DeliveryStateMachine } from '../../domain/service/DeliveryStateMachine';

const DEFAULT_RECEIPT_CHECK_DELAY_MS = 15 * 60 * 1000;
const EXPO_BATCH_SIZE = 100;

export interface SendNotificationDTO {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendNotificationResult {
  notificationId?: string;
  sent: number;
  failed: number;
}

export class SendNotification {

  constructor(
    private devices: DeviceRepository,
    private notifications: NotificationRepository,
    private deliveries: DeliveryRepository,
    private sender: NotificationSender,
    private receiptCheckDelayMs: number = DEFAULT_RECEIPT_CHECK_DELAY_MS
  ) {}

  async execute(dto: SendNotificationDTO): Promise<SendNotificationResult> {

    const devices = await this.devices.findActiveByUser(
      dto.userId
    );

    if (!devices.length) {
      return { sent: 0, failed: 0 };
    }

    const notification = await this.notifications.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      data: dto.data
    });

    const deliveries = await this.deliveries.createMany(
      devices.map((device) => ({
        notificationId: notification.id,
        deviceId: device.id,
        expoPushToken: device.expoPushToken,
        status: DeliveryStatus.PENDING
      }))
    );

    for (const delivery of deliveries) {
      DeliveryStateMachine.assertTransition(
        delivery.status,
        DeliveryStatus.SENDING
      );
    }

    await this.deliveries.markSending(
      deliveries.map((delivery) => delivery.id)
    );

    let sent = 0;
    let failed = 0;
    let firstTicketId: string | undefined;

    for (let offset = 0; offset < deliveries.length; offset += EXPO_BATCH_SIZE) {
      const batchDeliveries = deliveries.slice(offset, offset + EXPO_BATCH_SIZE);
      const messages: PushMessage[] = batchDeliveries.map((delivery) => ({
        token: delivery.expoPushToken,
        title: dto.title,
        body: dto.body,
        data: {
          ...dto.data,
          notificationId: notification.id,
          deliveryId: delivery.id
        }
      }));

      let tickets: PushTicketResult[];
      try {
        tickets = await this.sender.sendBatch(messages);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to send push notification batch';

        for (const pendingDelivery of deliveries.slice(offset)) {
          DeliveryStateMachine.assertTransition(
            DeliveryStatus.SENDING,
            DeliveryStatus.FAILED
          );
          await this.deliveries.updateResult(
            pendingDelivery.id,
            DeliveryStatus.FAILED,
            'SEND_BATCH_ERROR',
            errorMessage
          );
        }

        await this.notifications.updateStatus(notification.id, 'FAILED');
        throw error;
      }

      for (let i = 0; i < batchDeliveries.length; i++) {
        const delivery = batchDeliveries[i];
        const ticket = tickets[i];

        if (!ticket) {
          DeliveryStateMachine.assertTransition(
            DeliveryStatus.SENDING,
            DeliveryStatus.FAILED
          );
          await this.deliveries.updateResult(
            delivery.id,
            DeliveryStatus.FAILED,
            'MISSING_TICKET',
            'Expo did not return a ticket'
          );
          failed++;
          continue;
        }

        if (ticket.status === 'error') {
          const code = ticket.details?.error ?? 'UNKNOWN_ERROR';
          const isInvalidToken =
            code === 'DeviceNotRegistered' || code === 'INVALID_TOKEN';

          if (isInvalidToken) {
            await this.devices.deactivate(delivery.expoPushToken);
          }

          const nextStatus = isInvalidToken
            ? DeliveryStatus.INVALID_TOKEN
            : DeliveryStatus.FAILED;

          DeliveryStateMachine.assertTransition(
            DeliveryStatus.SENDING,
            nextStatus
          );

          await this.deliveries.updateResult(
            delivery.id,
            nextStatus,
            code,
            ticket.message
          );
          failed++;
        } else {
          DeliveryStateMachine.assertTransition(
            DeliveryStatus.SENDING,
            DeliveryStatus.RECEIPT_PENDING
          );

          await this.deliveries.updateTicket(
            delivery.id,
            ticket.id,
            new Date(Date.now() + this.receiptCheckDelayMs)
          );

          if (!firstTicketId) {
            firstTicketId = ticket.id;
          }
          sent++;
        }
      }
    }

    const notificationStatus =
      sent === 0
        ? 'FAILED'
        : failed > 0
          ? 'PARTIALLY_FAILED'
          : 'PROCESSING';

    await this.notifications.updateStatus(
      notification.id,
      notificationStatus,
      deliveries.length === 1 ? firstTicketId : undefined
    );

    return {
      notificationId: notification.id,
      sent,
      failed
    };
  }
}