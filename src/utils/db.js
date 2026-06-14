const { PrismaClient } = require('@prisma/client');

// Prisma client instance
const prisma = new PrismaClient();

// Test database connection
async function testConnection() {
  try {
    // Attempt a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
async function shutdown() {
  try {
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
  } catch (error) {
    console.error('Error disconnecting Prisma client:', error);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  await shutdown();
  process.exit(0);
});

module.exports = {
  prisma,
  testConnection,
  shutdown
};