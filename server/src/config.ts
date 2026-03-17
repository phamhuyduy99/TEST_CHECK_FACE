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
  },
  cors: {
    origin: process.env.CORS_ORIGIN || [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://localhost:5173',
      'https://localhost:5174',
      // Tự động chấp nhận mọi IP LAN 192.168.x.x — không cần sửa khi đổi mạng
      /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      // Chấp nhận cả dải 10.x.x.x (hotspot, VPN)
      /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
    ]
  }
};
