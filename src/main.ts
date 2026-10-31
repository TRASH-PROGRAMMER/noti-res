import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import {connectToDatabase } from './config/database';
import notificationRoutes from './presentation/routes/notificationRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', notificationRoutes);

async function bootstrap() {
  await connectToDatabase();

  app.listen(process.env.PORT || 3000, () => {
    console.log('Server running');
  });
}

bootstrap().catch(console.error);