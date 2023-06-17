import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({log: ["query"]})

export const redis = createClient();
redis.on('error', err => console.log('Redis Client Error', err));
await redis.connect();

//redis://@54.89.153.221:6379



