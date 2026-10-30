import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import { notiRouter } from './routes/notiRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/noti', notiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})