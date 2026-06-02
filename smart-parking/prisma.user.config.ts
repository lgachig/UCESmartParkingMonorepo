import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/user/schema.prisma',

  migrations: {
    path: 'prisma/user/migrations',
  },

  datasource: {
    url: process.env.USER_DATABASE_URL,
  },
});