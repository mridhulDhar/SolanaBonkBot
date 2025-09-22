import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
        errorFormat: 'pretty',
    });
};

declare global {
  var prisma: any ;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

prisma.$connect()
  .then(() => {
    console.log('✅ Successfully connected to PostgreSQL database');
  })
  .catch((error: any) => {
    console.log('Failed to connect to database:', error);
    process.exit(1);
  });

  export default prisma;