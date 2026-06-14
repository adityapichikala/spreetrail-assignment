# Deployment Guide

This document provides instructions for deploying the Shared Expense Management Application to production environments.

## Technology Stack

- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT
- **File Storage:** Local filesystem (cloud storage recommended for production)

## Deployment Options

### Option 1: Traditional Server/VPS

1. **Server Requirements:**
   - Ubuntu 20.04 LTS or similar
   - Node.js v18+
   - PostgreSQL v13+
   - Nginx (for reverse proxy, optional)
   - PM2 or similar process manager

2. **Deployment Steps:**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd shared-expense-management
   
   # Install dependencies
   npm install --production
   
   # Set up environment variables
   cp .env.example .env.production
   # Edit .env.production with production values
   
   # Set up database
   npx prisma migrate deploy
   
   # Build (if needed)
   npm run build
   
   # Start application
   npm start
   # Or use PM2:
   # pm2 start src/server.js --name expense-manager
   ```

3. **Process Management (using PM2):**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start application
   pm2 start src/server.js --name expense-manager
   
   # Save process list
   pm2 save
   
   # Set up startup script
   pm2 startup
   ```

### Option 2: Docker Container

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm install --production
   
   COPY . .
   
   # Create uploads directory
   RUN mkdir -p uploads
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       env_file:
         - .env.production
       volumes:
         - ./uploads:/app/uploads
         - ./prisma:/app/prisma
       depends_on:
         - db
       restart: unless-stopped
       
     db:
       image: postgres:13
       environment:
         POSTGRES_DB: expense_manager
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
       restart: unless-stopped
   
   volumes:
     postgres_data:
   ```

3. **Deploy with Docker Compose:**
   ```bash
   # Set up environment variables
   cp .env.example .env.production
   # Edit .env.production with production values
   
   # Start services
   docker-compose up -d
   
   # Run migrations
   docker-compose exec app npx prisma migrate deploy
   ```

### Option 3: Platform-as-a-Service (PaaS)

#### Railway.app (Recommended for this project)

1. **Prepare Repository:**
   - Ensure your repository has a `railway.json` or use automatic detection
   - The `start` command in package.json should work

2. **Deploy to Railway:**
   - Connect your GitHub repository to Railway
   - Railway will automatically detect Node.js project
   - Add PostgreSQL plugin
   - Set environment variables in Railway dashboard
   - Railway will run `npm install` and `npm start` automatically

#### Vercel (for Frontend - see frontend deployment)

Note: This backend is designed to work with a frontend deployed separately (e.g., on Vercel).

### Environment Variables

Required environment variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | production |
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret for JWT signing | a-very-secret-key-that-is-long |
| MAX_FILE_SIZE | Max upload size in bytes | 10485760 |
| UPLOAD_DIR | Directory for file uploads | ./uploads |

### Database Setup

1. **Create Database:**
   ```sql
   CREATE DATABASE expense_manager;
   CREATE USER expense_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE expense_manager TO expense_user;
   ```

2. **Run Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed Initial Data (if needed):**
   ```bash
   npx prisma db seed
   ```

### Monitoring and Logging

1. **Health Check Endpoint:**
   - GET `/health` returns application status

2. **Logging:**
   - Application logs to stdout/stderr
   - Consider using a logging service or file rotation in production

3. **Monitoring:**
   - Monitor CPU, memory, disk usage
   - Monitor database connections and query performance
   - Set up alerts for error rates and response times

### Security Considerations

1. **Environment Variables:**
   - Never commit `.env` file to version control
   - Use secrets management in production platforms

2. **HTTPS:**
   - Terminate SSL at reverse proxy (NGINX, Load Balancer) or PaaS layer
   - Force HTTPS redirects

3. **CORS:**
   - Restrict origins to your frontend domains in production

4. **Rate Limiting:**
   - Implement rate limiting at application or API gateway level

5. **Dependencies:**
   - Regularly update dependencies
   - Use tools like npm audit or Snyk to check for vulnerabilities

### Backup Strategy

1. **Database Backups:**
   - Set up automated PostgreSQL backups
   - Use point-in-time recovery if needed
   - Test restore procedures regularly

2. **File Uploads:**
   - Back up the uploads directory if storing files locally
   - Consider using cloud storage (S3, Google Cloud Storage) for better durability

### Troubleshooting

1. **Application Won't Start:**
   - Check logs: `pm2 logs expense-manager` or `docker-compose logs app`
   - Verify database connection in DATABASE_URL
   - Check port availability

2. **Database Connection Issues:**
   - Verify PostgreSQL service is running
   - Check network connectivity and firewall rules
   - Validate credentials in DATABASE_URL

3. **Performance Issues:**
   - Check database query performance with EXPLAIN ANALYZE
   - Monitor connection pool usage
   - Consider adding database indexes based on query patterns

### Version Updates

1. **Backup First:**
   - Backup database and file uploads
   - Backup current application code

2. **Update Process:**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Install dependencies
   npm install
   
   # Run migrations
   npx prisma migrate deploy
   
   # Restart application
   pm2 restart expense-manager
   # or
   docker-compose restart app
   ```

3. **Rollback Plan:**
   - Have previous version ready
   - Backup taken before update allows restore
   - Database migrations are forward-only; plan accordingly for breaking changes