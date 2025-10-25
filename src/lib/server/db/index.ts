import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
// const client = createClient({ url: env.DATABASE_URL });

// Switch to Turso database client
if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variable not set');
}

export const turso = createClient({
    url: env.TURSO_DATABASE_URL as string,
    authToken: env.TURSO_AUTH_TOKEN as string,
});

export const db = drizzle({ client: turso, schema });
