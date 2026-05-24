import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || '';

if (!REDIS_URL) {
  console.error('Error: REDIS_URL is missing in the .env file.');
  process.exit(1);
}

// Establish connection to Upstash Serverless Redis
// We use maxRetriesPerRequest: null as strictly required by BullMQ
const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Create our master assessment queue
export const assessmentQueue = new Queue('assessment-generation', {
  connection: redisConnection,
});

console.log('BullMQ Queue Initialized (Connected to Upstash Redis)');