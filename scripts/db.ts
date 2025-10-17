import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/lib/server/db/schema.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL environment variable is not set');
	console.log('💡 Please create a .env file with DATABASE_URL or set it as an environment variable');
	process.exit(1);
}

const client = createClient({ url: DATABASE_URL });

export const db = drizzle({ client, schema });