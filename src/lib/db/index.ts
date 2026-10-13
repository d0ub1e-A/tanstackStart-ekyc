import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  prepare: false,
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const db = drizzle(process.env.DATABASE_URL);

export async function closeDb(): Promise<void> {
  await client.end();
}
