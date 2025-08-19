import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@mail.com' },
    update: {},
    create: {
      email: 'test@mail.com',
      password: 'test',
    },
  })

  const existingNotes = await prisma.note.count({
    where: { userId: user.id },
  })

  if (existingNotes === 0) {
    await prisma.note.createMany({
      data: [
        { title: 'Hello World', content: 'Hello World content', userId: user.id },
        { title: 'My second note', content: 'Second note content', userId: user.id },
      ],
    })
  }

  console.log('Seed complete. User id:', user.id)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
