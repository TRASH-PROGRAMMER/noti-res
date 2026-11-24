import { DeliveryStatus } from '../entities/DeliveryStatus';

export interface DeliveryRecord {
  id: string;
  deviceId: string;
  expoPushToken: string;
  ticketId: string;
  status: DeliveryStatus;
  attempts: number;
}

export interface CreateDeliveryInput {
  notificationId: string;
  deviceId: string;
  expoPushToken: string;
  status?: DeliveryStatus;
}

export interface CreatedDelivery {
  id: string;
  notificationId: string;
  deviceId: string;
  expoPushToken: string;
  status: DeliveryStatus;
}

export interface DeliveryRepository {
  createMany(deliveries: CreateDeliveryInput[]): Promise<CreatedDelivery[]>;

  markSending(ids: string[]): Promise<void>;

  markReceiptPending(
    id: string,
    ticketId: string,
    nextReceiptCheckAt: Date
  ): Promise<void>;

  markFailed(
    id: string,
    errorCode?: string | null,
    errorMessage?: string | null
  ): Promise<void>;

  findPendingReceipts(
    limit: number
  ): Promise<DeliveryRecord[]>;

  markChecking(ids: string[]): Promise<void>;

  updateResult(
    id: string,
    status: DeliveryStatus,
    errorCode?: string | null,
    errorMessage?: string | null
  ): Promise<void>;

  scheduleReceiptRetry(
    id: string,
    nextCheck: Date
  ): Promise<void>;

  markExpired(id: string): Promise<void>;
}