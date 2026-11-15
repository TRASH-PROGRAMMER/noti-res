import { DeliveryStatus } from '../entities/DeliveryStatus';

const transitions: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [
    DeliveryStatus.SENDING,
    DeliveryStatus.FAILED,
  ],

  [DeliveryStatus.SENDING]: [
    DeliveryStatus.ACCEPTED,
    DeliveryStatus.RECEIPT_PENDING,
    DeliveryStatus.FAILED,
    DeliveryStatus.INVALID_TOKEN,
  ],

  [DeliveryStatus.ACCEPTED]: [
    DeliveryStatus.RECEIPT_PENDING,
    DeliveryStatus.FAILED,
  ],

  [DeliveryStatus.RECEIPT_PENDING]: [
    DeliveryStatus.RECEIPT_CHECKING,
    DeliveryStatus.EXPIRED,
  ],

  [DeliveryStatus.RECEIPT_CHECKING]: [
    DeliveryStatus.PROVIDER_ACCEPTED,
    DeliveryStatus.FAILED,
    DeliveryStatus.INVALID_TOKEN,
    DeliveryStatus.RECEIPT_PENDING, // reintento
    DeliveryStatus.EXPIRED,
  ],

  [DeliveryStatus.PROVIDER_ACCEPTED]: [
    DeliveryStatus.READ,
  ],

  [DeliveryStatus.FAILED]: [],
  [DeliveryStatus.INVALID_TOKEN]: [],
  [DeliveryStatus.EXPIRED]: [],
  [DeliveryStatus.READ]: [],
};

export class DeliveryStateMachine {
  static canTransition(current: DeliveryStatus, next: DeliveryStatus): boolean {
    return transitions[current].includes(next);
  }

  static assertTransition(current: DeliveryStatus, next: DeliveryStatus): void {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid delivery transition: ${current} → ${next}`);
    }
  }
}