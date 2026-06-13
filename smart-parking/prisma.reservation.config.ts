import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/reservation/schema.prisma',
  migrations: {
    path: 'prisma/reservation/migrations',
  },
  datasource: {
    url: process.env.RESERVATION_DATABASE_URL,
  },
});