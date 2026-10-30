import { DeviceRepository } from '../../domain/ports/DeviceRepository';
import { NotificationRepository } from '../../domain/ports/NotificationRepository';
import { NotificationSender } from '../../domain/ports/NotificationSender';

interface SendNotificationDTO {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class SendNotification {

  constructor(
    private devices: DeviceRepository,
    private notifications: NotificationRepository,
    private sender: NotificationSender
  ) {}

  async execute(dto: SendNotificationDTO) {

    const devices = await this.devices.findActiveByUser(
      dto.userId
    );

    if (!devices.length) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const device of devices) {

      const notification = await this.notifications.create({
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        data: dto.data
      });

      const result = await this.sender.send({
        token: device.expoPushToken,
        title: dto.title,
        body: dto.body,
        data: {
          ...dto.data,
          notificationId: notification.id
        }
      });

      await this.notifications.updateStatus(
        notification.id,
        result.status,
        result.ticketId
      );

      if (result.status === 'accepted') {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }
}