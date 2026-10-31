import 'dotenv/config';

import { DataSource } from 'typeorm';

import { DeviceEntity } from '../infrastructure/database/entities/DeviceEntity';
import { NotificationEntity } from '../infrastructure/database/entities/NotificationEntity';

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  port: process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT || 5432),
  username: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
  entities: [DeviceEntity, NotificationEntity],
  migrations: [
    `${__dirname}/../infrastructure/database/migrations/*{.ts,.js}`
  ],
  migrationsRun: isProduction,
  synchronize: !isProduction,
  logging: !isProduction
});

export async function connectToDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    console.log('La base de datos ya está conectada');
    return;
  }

  try {
    await AppDataSource.initialize();
    console.log('Base de datos conectada correctamente');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
}
