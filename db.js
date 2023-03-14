import { createClient } from 'redis'

const redis = createClient({
    url: 'redis://@54.89.153.221:6379'
  });
redis.on('error', (err) => console.log('Redis Client Error', err));

async function connectToRedis(){
  
  await redis.connect();
}
connectToRedis()

//cmodule.exports = { redis: redis}
export default redis
