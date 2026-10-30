
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/NotificationEntity';
import {
  NotificationRepository
} from '../../../domain/ports/NotificationRepository';

export class TypeOrmNotificationRepository implements NotificationRepository {

  constructor(
    private repository: Repository<NotificationEntity>
  ) {}

  async create(dto: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {

    const entity = this.repository.create({
      ...dto,
      data: dto.data ?? null,
      status: 'pending',
      readAt: null,
      pushTicketId: null
    });

    const saved = await this.repository.save(entity);

    return { id: saved.id };
  }

  async updateStatus(
    id: string,
    status: string,
    ticketId?: string
  ): Promise<void> {

    await this.repository.update(
      { id },
      {
        status,
        pushTicketId: ticketId ?? null
      }
    );
  }

  async markAsRead(
    id: string,
    userId: string
  ): Promise<void> {

    await this.repository.update(
      {
        id,
        userId
      },
      {
        readAt: new Date()
      }
    );
  }
}