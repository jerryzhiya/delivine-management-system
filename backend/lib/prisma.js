var _a;
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing.");
}
export const prisma = (_a = global.prisma) !== null && _a !== void 0 ? _a : new PrismaClient();
if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}
//# sourceMappingURL=prisma.js.map