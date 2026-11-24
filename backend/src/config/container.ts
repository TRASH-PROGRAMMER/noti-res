import { AppDataSource } from './database';
import { DeviceEntity } from '../infrastructure/database/entities/DeviceEntity';
import { NotificationEntity } from '../infrastructure/database/entities/NotificationEntity';
import { NotificationDeliveryEntity } from '../infrastructure/database/entities/NotificationDeliveryEntity';

import { TypeOrmDeviceRepository } from '../infrastructure/database/repositories/TypeOrmDeviceRepository';
import { TypeOrmNotificationRepository } from '../infrastructure/database/repositories/TypeOrmNotificationRepository';
import { TypeOrmDeliveryRepository } from '../infrastructure/database/repositories/TypeOrmDeliveryRepository';

import { ExpoPushAdapter } from '../infrastructure/push/ExpoPushAdapter';
import { ExpoReceiptAdapter } from '../infrastructure/push/ExpoReceiptAdapter';

import { RegisterDevice } from '../application/use-cases/RegisterDevice';
import { SendNotification } from '../application/use-cases/SendNotification';
import { ProcessPushReceipts } from '../application/use-cases/ProcessPushReceipts';

export const deviceRepository = new TypeOrmDeviceRepository(
  AppDataSource.getRepository(DeviceEntity)
);

export const notificationRepository = new TypeOrmNotificationRepository(
  AppDataSource.getRepository(NotificationEntity)
);

export const deliveryRepository = new TypeOrmDeliveryRepository(
  AppDataSource.getRepository(NotificationDeliveryEntity)
);

export const notificationSender = new ExpoPushAdapter(
  process.env.EXPO_ACCESS_TOKEN
);

export const pushReceiptGateway = new ExpoReceiptAdapter(
  process.env.EXPO_ACCESS_TOKEN
);

export const registerDevice = new RegisterDevice(
  deviceRepository
);

export const sendNotification = new SendNotification(
  deviceRepository,
  notificationRepository,
  deliveryRepository,
  notificationSender
);

export const processPushReceipts = new ProcessPushReceipts(
  deliveryRepository,
  pushReceiptGateway,
  deviceRepository
);