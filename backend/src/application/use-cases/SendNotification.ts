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

    const messages: PushMessage[] = deliveries.map((delivery) => ({
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

      for (const delivery of deliveries) {
        DeliveryStateMachine.assertTransition(
          DeliveryStatus.SENDING,
          DeliveryStatus.FAILED
        );
        await this.deliveries.markFailed(
          delivery.id,
          'SEND_BATCH_ERROR',
          errorMessage
        );
      }

      await this.notifications.updateStatus(notification.id, 'FAILED');
      throw error;
    }

    let sent = 0;
    let failed = 0;
    let firstTicketId: string | undefined;

    for (let i = 0; i < deliveries.length; i++) {
      const delivery = deliveries[i];
      const ticket = tickets[i];

      if (!ticket || ticket.status === 'error') {
        DeliveryStateMachine.assertTransition(
          DeliveryStatus.SENDING,
          DeliveryStatus.FAILED
        );
        await this.deliveries.markFailed(
          delivery.id,
          ticket?.errorCode ?? 'MISSING_TICKET',
          ticket?.errorMessage ?? 'Expo did not return a ticket'
        );
        failed++;
        continue;
      }

      DeliveryStateMachine.assertTransition(
        DeliveryStatus.SENDING,
        DeliveryStatus.RECEIPT_PENDING
      );
      const nextReceiptCheckAt = new Date(
        Date.now() + this.receiptCheckDelayMs
      );
      await this.deliveries.markReceiptPending(
        delivery.id,
        ticket.ticketId,
        nextReceiptCheckAt
      );

      if (!firstTicketId) {
        firstTicketId = ticket.ticketId;
      }
      sent++;
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