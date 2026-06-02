import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/vehicle/schema.prisma',

  migrations: {
    path: 'prisma/vehicle/migrations',
  },

  datasource: {
    url: process.env.VEHICLE_DATABASE_URL,
  },
});
