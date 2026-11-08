import { TypeORMError } from "typeorm"
import { Column, Entity, PrimaryGeneratedColumn,Index,CreateDateColumn,UpdateDateColumn } from "typeorm"

@Entity({ name: "devices" })// Define the devices table
@Index(["expoPushToken"], { unique: true }) // Create a unique index on the expoPushToken columlass 

// DeviceEntity se utiliza para almacenar la información del dispositivo.
export class DeviceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name:'user_id', type: "uuid" }) // Columna que almacena el identificador único del usuario.
    userId!: string;

    @Column({ name:'expo_push_token', type: "varchar", length: 255 }) //Columna que almacena el token de notificación push. 
    expoPushToken!: string;

    @Column({type: "boolean", default: true })//Columna que almacena el estado del dispositivo.
    active!: boolean;

    
    @Column({name : 'last_seen_at', type: "timestamp", nullable: true }) // Columna que almacena la fecha y hora de la última vez que el dispositivo fue visto
    lastSeenAt!: Date | null;

    @CreateDateColumn({ name:'created_at', type: "timestamp", default: () => "CURRENT_TIMESTAMP" })//Columna que almacena la fecha y hora de creación del registro.
    createdAt!: Date;
    @UpdateDateColumn({ name:'updated_at', type: "timestamp", default: () => "CURRENT_TIMESTAMP" }) //Columna que almacena la fecha y hora de actualización del registro.
    updatedAt!: Date;
}   




