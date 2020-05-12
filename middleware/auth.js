const db = require('../models');
const dotenv = require('dotenv');
const redis = require('redis');
const JWTR = require('jwt-redis').default;

const redisClient = redis.createClient(process.env.REDIS_URL);
const jwtr = new JWTR(redisClient);
dotenv.config();
exports.context = async ({event }) => {
  try {
    const accessToken = event.headers.Authorization.split(" ")[1] || '';
    if (accessToken) {
      const accessTokenVerifed = await jwtr.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await db.User.findOne({ where: { email: accessTokenVerifed.email } });
      if (!user) {
        throw new Error('You can use it after logging in.');
      }
      const AccessTokenVerifyJti = accessTokenVerifed.jti;
      return { user, AccessTokenVerifyJti };
    } else {
      return 'No auth token';
    }
  } catch (err) {
    return err;
  }
};
