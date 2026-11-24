import { Repository } from 'typeorm';

import { NotificationDeliveryEntity } from '../entities/NotificationDeliveryEntity';

import {
  DeliveryRepository,
  DeliveryRecord
} from '../../../domain/ports/DeliveryRepository';

import { DeliveryStatus } from '../../../domain/entities/DeliveryStatus';

export class TypeOrmDeliveryRepository implements DeliveryRepository {

  constructor(
    private repository: Repository<NotificationDeliveryEntity>
  ) {}

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