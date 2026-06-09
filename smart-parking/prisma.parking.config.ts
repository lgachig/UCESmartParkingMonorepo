import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/parking/schema.prisma',

  migrations: {
    path: 'prisma/parking/migrations',
  },

  datasource: {
    url: process.env.PARKING_DATABASE_URL,
  },
});
