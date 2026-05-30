import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bug = await prisma.feedback.findUnique({
    where: { id: 4 }
  });

  console.log(JSON.stringify(bug, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
