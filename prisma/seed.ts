import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: password,
      role: 'ADMIN',
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
