import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'], // เอาไว้อ่าน Log SQL เวลา Debug (ปิดได้)
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma