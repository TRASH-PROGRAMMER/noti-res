import { Request, Response } from 'express';
import { SendNotification } from '../../application/use-cases/SendNotification';
import { NotificationRepository } from '../../domain/ports/NotificationRepository';

export class NotificationController {

  constructor(
    private sendNotification: SendNotification,
    private notifications: NotificationRepository
  ) {}

  send = async (req: Request, res: Response) => {

    const result = await this.sendNotification.execute({
      userId: req.body.userId,
      title: req.body.title,
      body: req.body.body,
      data: req.body.data
    });

    return res.json(result);
  };

  markAsRead = async (req: Request, res: Response) => {

    await this.notifications.markAsRead(
      req.params.id,
      req.user!.id
    );

    return res.json({
      message: 'Notification marked as read'
    });
  };
}