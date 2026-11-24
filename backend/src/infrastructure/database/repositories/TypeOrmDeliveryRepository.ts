import { In, Repository } from 'typeorm';

import { NotificationDeliveryEntity } from '../entities/NotificationDeliveryEntity';

import {
  CreateDeliveryInput,
  CreatedDelivery,
  DeliveryRepository,
  DeliveryRecord
} from '../../../domain/ports/DeliveryRepository';

import { DeliveryStatus } from '../../../domain/entities/DeliveryStatus';

export class TypeOrmDeliveryRepository implements DeliveryRepository {

  constructor(
    private repository: Repository<NotificationDeliveryEntity>
  ) {}

  async createMany(
    deliveries: CreateDeliveryInput[]
  ): Promise<CreatedDelivery[]> {

    if (!deliveries.length) return [];

    const entities = deliveries.map((item) =>
      this.repository.create({
        notificationId: item.notificationId,
        deviceId: item.deviceId,
        expoPushToken: item.expoPushToken,
        status: item.status ?? DeliveryStatus.PENDING,
        ticketId: null,
        errorCode: null,
        errorMessage: null,
        attempts: 0,
        nextReceiptCheckAt: null,
        receiptCheckedAt: null,
        readAt: null
      })
    );

    const saved = await this.repository.save(entities);

    return saved.map((record) => ({
      id: record.id,
      notificationId: record.notificationId,
      deviceId: record.deviceId,
      expoPushToken: record.expoPushToken,
      status: record.status
    }));
  }

  async markSending(ids: string[]): Promise<void> {

    if (!ids.length) return;

    await this.repository.update(
      {
        id: In(ids),
        status: DeliveryStatus.PENDING
      },
      {
        status: DeliveryStatus.SENDING
      }
    );
  }

  async markReceiptPending(
    id: string,
    ticketId: string,
    nextReceiptCheckAt: Date
  ): Promise<void> {

    await this.repository.update(
      {
        id,
        status: DeliveryStatus.SENDING
      },
      {
        ticketId,
        status: DeliveryStatus.RECEIPT_PENDING,
        nextReceiptCheckAt,
        errorCode: null,
        errorMessage: null
      }
    );
  }

  async markFailed(
    id: string,
    errorCode: string | null = null,
    errorMessage: string | null = null
  ): Promise<void> {

    await this.repository.update(
      {
        id,
        status: In([DeliveryStatus.PENDING, DeliveryStatus.SENDING])
      },
      {
        status: DeliveryStatus.FAILED,
        errorCode,
        errorMessage,
        nextReceiptCheckAt: null
      }
    );
  }

  async findPendingReceipts(
    limit: number
  ): Promise<DeliveryRecord[]> {

    const records = await this.repository
      .createQueryBuilder('delivery')
      .where('delivery.status = :status', {
        status: DeliveryStatus.RECEIPT_PENDING
      })
      .andWhere('delivery.nextReceiptCheckAt <= NOW()')
      .andWhere('delivery.ticketId IS NOT NULL')
      .orderBy('delivery.nextReceiptCheckAt', 'ASC')
      .take(limit)
      .getMany();

    return records.map(record => ({
      id: record.id,
      deviceId: record.deviceId,
      expoPushToken: record.expoPushToken,
      ticketId: record.ticketId!,
      status: record.status,
      attempts: record.attempts
    }));
  }

  async markChecking(ids: string[]): Promise<void> {

    if (!ids.length) return;

    await this.repository
      .createQueryBuilder()
      .update(NotificationDeliveryEntity)
      .set({
        status: DeliveryStatus.RECEIPT_CHECKING
      })
      .whereInIds(ids)
      .andWhere('status = :status', {
        status: DeliveryStatus.RECEIPT_PENDING
      })
      .execute();
  }

  async updateResult(
    id: string,
    status: DeliveryStatus,
    errorCode: string | null = null,
    errorMessage: string | null = null
  ): Promise<void> {

    await this.repository.update(
      {
        id,
        status: DeliveryStatus.RECEIPT_CHECKING
      },
      {
        status,
        errorCode,
        errorMessage,
        receiptCheckedAt: new Date(),
        nextReceiptCheckAt: null
      }
    );
  }

  async scheduleReceiptRetry(
    id: string,
    nextCheck: Date
  ): Promise<void> {

    await this.repository
      .createQueryBuilder()
      .update(NotificationDeliveryEntity)
      .set({
        status: DeliveryStatus.RECEIPT_PENDING,
        nextReceiptCheckAt: nextCheck,
        attempts: () => '"attempts" + 1'
      })
      .where('id = :id', { id })
      .andWhere('status = :status', {
        status: DeliveryStatus.RECEIPT_CHECKING
      })
      .execute();
  }

  async markExpired(id: string): Promise<void> {

    await this.repository.update(
      {
        id,
        status: DeliveryStatus.RECEIPT_PENDING
      },
      {
        status: DeliveryStatus.EXPIRED,
        nextReceiptCheckAt: null
      }
    );
  }
}