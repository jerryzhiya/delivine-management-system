import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database cleanup and Admin setup...');

  // 1. Validate Environment Variables for Admin Credentials
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@school.com';
  const rawAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPass123!';

  if (!process.env.INITIAL_ADMIN_PASSWORD) {
    console.warn(
      '⚠️ INITIAL_ADMIN_PASSWORD is not set in environment variables. Using default fallback.'
    );
  }

  // 2. Clear all existing database records in strict relational order
  console.log('🧹 Cleaning up all existing records...');

  if ('attendance' in prisma) await (prisma as any).attendance.deleteMany();
  if ('submission' in prisma) await (prisma as any).submission.deleteMany();

  await prisma.activityLog.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.gradeRecord.deleteMany();

  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.users.deleteMany();

  // 3. Hash Password & Create Single Root Admin User
  console.log(`👤 Creating Super Admin account (${adminEmail})...`);
  const hashedPassword = await bcrypt.hash(rawAdminPassword, 10);

  const admin = await prisma.users.create({
    data: {
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Database wiped clean. Admin account created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Error resetting database:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });