// 1. FORCE NODE TO USE PUBLIC DNS (Fixes the Windows/ISP ECONNREFUSED bug)
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); 

// 2. IMPORTS
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import { startWorker } from './worker'; 
import assessmentRouter from './routes/assessmentRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 

// Test Health Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'VedaAI Backend Server is running smoothly!' });
});

// Mount API Routes
app.use('/api/assessments', assessmentRouter);

// Start Server and Connect Databases
const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  // Start the background worker queue listener to watch Upstash Redis
  startWorker(); 

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Health check ready at http://localhost:${PORT}/health`);
  });
};

startServer();