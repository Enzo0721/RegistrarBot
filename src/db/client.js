import { PrismaClient } from '@prisma/client';

// Singleton pattern to prevent multiple instances of PrismaClient
let prisma;

if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient();
} else {
	// In development, use a global variable to prevent multiple instances
	if (!global.prisma) {
		global.prisma = new PrismaClient();
	}
	prisma = global.prisma;
}

export default prisma;

