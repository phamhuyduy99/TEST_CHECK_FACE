# Deployment Guide

## 🚀 Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel)
```bash
cd client
npm run build

# Deploy
vercel --prod
```

**Environment Variables:**
- Không cần (API URL hardcoded)

#### Backend (Railway)
```bash
# Push to GitHub
git push origin main

# Railway auto-deploy from GitHub
```

**Environment Variables:**
```
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
PORT=3000
NODE_ENV=production
```

### Option 2: VPS (Ubuntu)

#### 1. Setup Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

#### 2. Deploy Backend
```bash
# Clone repo
git clone https://github.com/phamhuyduy99/TEST_CHECK_FACE.git
cd TEST_CHECK_FACE/server

# Install dependencies
npm install --production

# Setup .env
nano .env
# Paste credentials

# Start with PM2
pm2 start server.js --name liveness-api
pm2 save
pm2 startup
```

#### 3. Deploy Frontend
```bash
cd ../client
npm install
npm run build

# Serve with nginx
sudo apt install nginx
sudo nano /etc/nginx/sites-available/liveness
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/client/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/liveness /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker

**Dockerfile (Backend):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**Dockerfile (Frontend):**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "3000:3000"
    env_file:
      - ./server/.env
    restart: unless-stopped
  
  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

```bash
docker-compose up -d
```

## 🔐 Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured
- [ ] CORS origins updated
- [ ] Rate limiting enabled
- [ ] File upload validation
- [ ] Error messages sanitized
- [ ] Cloudinary credentials rotated
- [ ] Firewall configured
- [ ] PM2 monitoring enabled
- [ ] Backup strategy defined

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs liveness-api
pm2 restart liveness-api
```

### Cloudinary Usage
- Dashboard: https://console.cloudinary.com/
- Check storage quota
- Monitor bandwidth
- Review upload logs

### Server Health
```bash
# CPU & Memory
htop

# Disk space
df -h

# Network
netstat -tuln
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install & Build
        run: |
          cd client
          npm install
          npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 Troubleshooting

### Upload fails in production
- Check Cloudinary credentials
- Verify CORS settings
- Check file size limits
- Review server logs

### Camera not working
- Ensure HTTPS (required for camera)
- Check browser permissions
- Verify SSL certificate

### High latency
- Enable Cloudinary CDN
- Optimize chunk size
- Use nearest server region

## 📈 Scaling

### Horizontal Scaling
```bash
# PM2 cluster mode
pm2 start server.js -i max --name liveness-api
```

### Load Balancer (Nginx)
```nginx
upstream backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

### Database (Future)
- Add MongoDB/PostgreSQL
- Store upload metadata
- User sessions
- Analytics data

## 🔄 Rollback Strategy

```bash
# PM2 rollback
pm2 reload liveness-api

# Git rollback
git revert HEAD
git push origin main

# Docker rollback
docker-compose down
git checkout previous-tag
docker-compose up -d
```

## 📞 Support

- GitHub Issues: https://github.com/phamhuyduy99/TEST_CHECK_FACE/issues
- Email: support@example.com
- Docs: https://github.com/phamhuyduy99/TEST_CHECK_FACE/tree/main/docs
