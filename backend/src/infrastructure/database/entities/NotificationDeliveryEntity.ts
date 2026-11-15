import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

import { DeliveryStatus } from './DeliveryStatus';

@Entity('notification_deliveries')
@Index(['ticketId'], { unique: true })
@Index(['status', 'nextReceiptCheckAt'])
@Index(['notificationId'])

export class Notificaciondeliveryentity{

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({name: 'notificacion_id', type: 'uuid'})
   notificationId!: string;
}
    