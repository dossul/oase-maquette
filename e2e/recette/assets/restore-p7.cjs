// Filet de sécurité QA (recette P7) : réactive le compte admin p7 si un test l'a désactivé.
// Usage : node maquette/e2e/recette/assets/restore-p7.js
const path = 'C:/wamp64/www/oase/oase-api/node_modules/@prisma/client'
process.env.DOTENV_CONFIG_PATH = 'C:/wamp64/www/oase/oase-api/.env'
const { PrismaClient } = require(path)
const prisma = new PrismaClient({ datasources: undefined })
async function main() {
  const u = await prisma.utilisateur.update({
    where: { email: 'kossi.sewavi@dgtcp.tg' },
    data: { statutCode: 'actif' },
    select: { email: true, statutCode: true },
  })
  console.log('RESTORED:', JSON.stringify(u))
}
main().finally(() => prisma.$disconnect())
