import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { DeliveryStatus } from '../../../domain/entities/DeliveryStatus';
// Descomenta si tienes las entidades:
// import { NotificationEntity } from './NotificationEntity';
// import { DeviceEntity } from './DeviceEntity';

@Entity('notification_deliveries')
@Index(['ticketId'], { unique: true, where: '"ticket_id" IS NOT NULL' }) // Solo único cuando existe
@Index(['status', 'nextReceiptCheckAt'])
@Index(['notificationId'])
@Index(['deviceId'])
@Index(['status', 'createdAt']) // Útil para dashboards / métricas
export class NotificationDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'notification_id', type: 'uuid' })
  notificationId!: string;

  // @ManyToOne(() => NotificationEntity, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'notification_id' })
  // notification!: NotificationEntity;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  // @ManyToOne(() => DeviceEntity, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'device_id' })
  // device!: DeviceEntity;

  /** Snapshot del token usado en el momento del envío */
  @Column({ name: 'expo_push_token', type: 'text' })
  expoPushToken!: string;

  @Column({
    name: 'ticket_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  ticketId!: string | null;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status!: DeliveryStatus;

  @Column({
    name: 'error_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  errorCode!: string | null;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
  })
  errorMessage!: string | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({
    name: 'next_receipt_check_at',
    type: 'timestamptz',
    nullable: true,
  })
  nextReceiptCheckAt!: Date | null;

  @Column({
    name: 'receipt_checked_at',
    type: 'timestamptz',
    nullable: true,
  })
  receiptCheckedAt!: Date | null;

  @Column({
    name: 'read_at',
    type: 'timestamptz',
    nullable: true,
  })
  readAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}