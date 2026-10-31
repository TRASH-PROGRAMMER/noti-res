import { TypeORMError } from "typeorm"
import { Column, Entity, PrimaryGeneratedColumn,Index,CreateDateColumn,UpdateDateColumn } from "typeorm"

@Entity({ name: "devices" })// Define the devices table
@Index(["expoPushToken"], { unique: true }) // Create a unique index on the expoPushToken column

export class DeviceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name:'user_id', type: "uuid" })
    userId!: string;

    @Column({ name:'expo_push_token', type: "varchar", length: 255 })
    expoPushToken!: string;

    @Column({type: "boolean", default: true })
    active!: boolean;

    
    @Column({name : 'last_seen_at', type: "timestamp", nullable: true })
    lastSeenAt!: Date | null;

    @CreateDateColumn({ name:'created_at', type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;
    @UpdateDateColumn({ name:'updated_at', type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updatedAt!: Date;
}   




