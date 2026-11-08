import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from 'typeorm';


@Entity({ name: "User" })// Define the notifications table
@Index(["userId", "createdAt"]) // Create a unique index on the combination of userId, deviceId, and type

// class que representa ula entidad usuario
export class userEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name:'user_id', type: "uuid" })
    userId!: string;

    @Column({type : 'varchar',length : 150})
    name!: string;

    @Column({ type: 'text' })
    email!: string;
}
