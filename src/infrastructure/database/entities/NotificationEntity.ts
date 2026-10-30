import { TypeORMError } from "typeorm"
import { Column, Entity, PrimaryGeneratedColumn,Index,CreateDateColumn,UpdateDateColumn } from "typeorm"

@Entity({ name: "notifications" })// Define the notifications table
@Index(["userId", "createdAt"]) // Create a unique index on the combination of userId, deviceId, and type
export class NotificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;
  
@Column({ name:'user_id', type: "uuid" })
    userId!: string;
@Column({type : 'varchar',length : 150})
   title!: string;

@Column({ type: 'text' })
 body!: string;

@Column({type: jsonb, nullable: true})
    data!: Record<string, any> | null;

@Column({name: 'read_at', type: "timestamp", nullable: true })
    readAt!: Date | null;

@Column({type: 'varchar',length: 50, default: 'info'})
status!: string;
    
  @Column({name: 'push_ticket_id',type: 'varchar',nullable: true
  })
  pushTicketId!: string | null;

  @CreateDateColumn({ name:'created_at', type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
