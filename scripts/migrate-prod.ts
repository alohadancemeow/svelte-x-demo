import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const databaseUrl = process.env.TURSO_DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ TURSO_DATABASE_URL environment variable is not set');
    console.error('Please set your production database URL in the environment variables');
    process.exit(1);
  }

  console.log('🔄 Starting production database migration...');
  console.log(`📍 Database URL: ${databaseUrl.substring(0, 20)}...`);

  try {
    // Create database client
    const client = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Initialize Drizzle
    const db = drizzle(client);

    // Run migrations
    console.log('🚀 Running migrations...');
    await migrate(db, { migrationsFolder: './.drizzle' });

    console.log('✅ Production database migration completed successfully!');

    // Close the connection
    client.close();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});