// redisClient.js
const redis = require('redis');
const client = redis.createClient();

client.on('error', (err) => {
  console.error('Redis error:', err);
});

client.on('connect',()=>{
  console.log('connected to redis')
})
client.connect().catch(err => {
  console.error('Failed to connect to Redis:', err);
});

module.exports = client;
