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

  @Column({name: 'Device_id', type: 'uuid'})
  devicedId!: string;
  
  @Column({ name: 'expo_push_token', type: 'varchar', length: 255 })
  expoPushToken!: string;

  @Column({ name: 'ticket_id', type: 'varchar', nullable: true })
  ticketId!: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: DeliveryStatus.PENDING
  })
  status!: DeliveryStatus;







}
  
