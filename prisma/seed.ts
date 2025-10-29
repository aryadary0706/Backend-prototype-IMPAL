// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.deleteMany();

  const hashed = await bcrypt.hash("password123", 10)

  await prisma.user.createMany({
    data: [
      {
        email: "user1@example.com",
        name: "User_1",
        password: hashed
      },
      {
        email: "user2@example.com",
        name: "User_2",
        password: hashed
      },
      {
        email: "user3@example.com",
        name: "User_3",
        password: hashed
      }
    ],
  })

  console.log(`Seeding selesai. user berhasil dibuat.`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
