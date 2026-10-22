const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// DATABASE_URL: postgresql://usuario:clave@host:5432/base
// (en Render use la "Internal Database URL"; desde su PC, la "External" con ?sslmode=require)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
module.exports = new PrismaClient({ adapter });
