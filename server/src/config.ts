export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  vnpt: {
    tokenId: process.env.VNPT_TOKEN_ID,
    tokenKey: process.env.VNPT_TOKEN_KEY,
    accessToken: process.env.VNPT_ACCESS_TOKEN,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'  || 'http://localhost:5174'
  }
};
