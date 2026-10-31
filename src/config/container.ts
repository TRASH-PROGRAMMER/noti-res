import { AppDataSource } from './database';
import { DeviceEntity } from '../infrastructure/database/entities/DeviceEntity';
import { NotificationEntity } from '../infrastructure/database/entities/NotificationEntity';

import { TypeOrmDeviceRepository } from '../infrastructure/database/repositories/TypeOrmDeviceRepository';
import { TypeOrmNotificationRepository } from '../infrastructure/database/repositories/TypeOrmNotificationRepository';

import { ExpoPushAdapter } from '../infrastructure/push/ExpoPushAdapter';

import { RegisterDevice } from '../application/use-cases/RegisterDevice';
import { SendNotification } from '../application/use-cases/SendNotification';

export const deviceRepository = new TypeOrmDeviceRepository(
  AppDataSource.getRepository(DeviceEntity)
);

export const notificationRepository = new TypeOrmNotificationRepository(
  AppDataSource.getRepository(NotificationEntity)
);

const expoPushAdapter = new ExpoPushAdapter(
  process.env.EXPO_ACCESS_TOKEN
);

export const notificationSender = {
  send: async (...args: Parameters<typeof expoPushAdapter.send>) => {
    const result = await expoPushAdapter.send(...args);

    return {
      status: result.status === 'sent' ? 'accepted' as const : 'failed' as const,
      ticketId:
        result.status === 'sent' &&
        'ticketId' in result &&
        typeof result.ticketId === 'string'
          ? result.ticketId
          : undefined
    };
  }
};

export const registerDevice = new RegisterDevice(
  deviceRepository
);

export const sendNotification = new SendNotification(
  deviceRepository,
  notificationRepository,
  notificationSender
);