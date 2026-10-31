import { Router } from 'express';

import {
  deviceRepository,
  notificationRepository,
  registerDevice,
  sendNotification
} from '../../config/container';

import { DeviceController } from '../controllers/DeviceController';
import { NotificationController } from '../controllers/NotificationController';

import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

const deviceController = new DeviceController(
  registerDevice,
  deviceRepository
);

const notificationController = new NotificationController(
  sendNotification,
  notificationRepository
);

router.post(
  '/devices/register',
  authMiddleware,
  deviceController.register
);

router.delete(
  '/devices/:token',
  authMiddleware,
  deviceController.deactivate
);

router.post(
  '/notifications/send',
  authMiddleware,
  adminMiddleware,
  notificationController.send
);

router.patch(
  '/notifications/:id/read',
  authMiddleware,
  notificationController.markAsRead
);

export default router;