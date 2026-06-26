import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/payment/schema.prisma',

  migrations: {
    path: 'prisma/payment/migrations',
  },

  datasource: {
    url: process.env.PAYMENT_DATABASE_URL,
  },
});
