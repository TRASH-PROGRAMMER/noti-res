import {
  PushReceiptGateway
} from '../../domain/ports/PushReceiptGateway';

import {
  DeliveryRepository
} from '../../domain/ports/DeliveryRepository';

import {
  DeviceRepository
} from '../../domain/ports/DeviceRepository';

import {
  DeliveryStatus
} from '../../domain/entities/DeliveryStatus';

export class ProcessPushReceipts {
    constructor(
        private  deliveries: DeliveryRepository,
        private  receiptGateway: PushReceiptGateway,
        private   devices: DeviceRepository
    ) {}

  async execute() {
    const pending = await this.deliveries.findPendingReceipts(1000);
    if (pending.length === 0) {
        return {
            processed: 0,
            successful: 0,
            failed: 0,
            waiting: 0
        };
    }
    const ids = pending.map(item => item.id);

    await this.deliveries.markChecking(ids);

    let  successful = 0;
    let  failed = 0;
    let  waiting = 0;

  const receiptGroups = new Map<
      string,
      typeof pending
    >();

    for (const delivery of pending) {
        const group =
        receiptGroups.get(delivery.ticketId) ?? [];

      group.push(delivery);

     receiptGroups.set(delivery.ticketId, group);
    }
    const receiptIds =[...receiptGroups.keys()];
    let receipts;
    try {
        receipts = await this.receiptGateway.getReceipts(receiptIds);
    } catch (error) {
        // Marcar como FAILED por un error temporal al consultar el servicio de Expo.
        for (const delivery of pending) {
            await this.deliveries.scheduleReceiptRetry(
                delivery.id,
                new Date(Date.now() + 60_000)
            );
        }
        throw error;
    }

    for (const delivery of pending) {

      const receipt = receipts[delivery.ticketId];

      // Expo todavía no tiene el receipt disponible.
      if (!receipt) {

        await this.deliveries.scheduleReceiptRetry(
          delivery.id,
          new Date(Date.now() + 60_000)
        );

        waiting++;

        continue;
      }

      if (receipt.status === 'ok') {

        await this.deliveries.updateResult(
          delivery.id,
          DeliveryStatus.PROVIDER_ACCEPTED
        );

        successful++;

        continue;
      }

      const errorCode =
        receipt.details?.error ?? 'UNKNOWN_ERROR';

      const errorMessage =
        receipt.message ?? 'Push receipt failed';

      if (errorCode === 'DeviceNotRegistered') {

        await this.devices.deactivate(
          delivery.expoPushToken
        );

        await this.deliveries.updateResult(
          delivery.id,
          DeliveryStatus.INVALID_TOKEN,
          errorCode,
          errorMessage
        );

        failed++;

        continue;
      }

      await this.deliveries.updateResult(
        delivery.id,
        DeliveryStatus.FAILED,
        errorCode,
        errorMessage
      );

      failed++;
    }

    return {
      processed: pending.length,
      successful,
      failed,
      waiting
    };
  }
}   
