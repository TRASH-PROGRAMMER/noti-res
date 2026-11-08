import { TypeORMError } from "typeorm"
import { Column, Entity, PrimaryGeneratedColumn,Index,CreateDateColumn,UpdateDateColumn } from "typeorm"

@Entity({ name: "notifications" })// Define the notifications table
@Index(["userId", "createdAt"]) // Create a unique index on the combination of userId, deviceId, and type

// clase para crear notificaciones personalizadas
export class NotificationEntity {
  @PrimaryGeneratedColumn("uuid") //priry key de la tabla notificationsma
  id!: string
@Column({ name:'user_id', type: "uuid" }) // clase relacionar tabla user
    userId!: string;
@Column({type : 'varchar',length : 150 }) // columna titulo de la notificacion
   title!: string;
@Column({type: 'text'})//columna que almacemacena el cuarpo de la notificacion
 body!: string;

@Column({ type: "jsonb", nullable: true }) // columna que almacena datos adicionales de la notificacion
    data!: Record<string, any> | null;

@Column({name: 'read_at', type: "timestamp", nullable: true}) // // columna que almacena la fecha en que se leyo la notificacion true 
    readAt!: Date | null;

@Column({type: 'varchar',length: 50, default: 'info'}) // columna que almacena el estado de la notificaion  
status!: string;
    
  @Column({name: 'push_ticket_id',type: 'varchar',nullable: true})//columna que almacena el id de la notificacion push
  pushTicketId!: string | null;

  @CreateDateColumn({ name:'created_at', type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
