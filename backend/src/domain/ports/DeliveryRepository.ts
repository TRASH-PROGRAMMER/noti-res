import { DeliveryStatus } from '../entities/DeliveryStatus';

export interface DeliveryRecord {
  id: string;
  deviceId: string;
  expoPushToken: string;
  ticketId: string;
  status: DeliveryStatus;
  attempts: number;
}

export interface DeliveryRepository {

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