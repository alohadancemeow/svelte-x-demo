#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/lib/server/db/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateData() {
	try {
		console.log('🔄 Starting data migration from local to cloud database...');

		// Local database connection
		const localClient = createClient({ url: 'file:local.db' });
		const localDb = drizzle({ client: localClient, schema });

		// Cloud database connection
		const cloudUrl = process.env.TURSO_DATABASE_URL;
		if (!cloudUrl) {
			throw new Error('TURSO_DATABASE_URL environment variable not set for cloud database');
		}

		const cloudClient = createClient({ url: cloudUrl, authToken: process.env.TURSO_AUTH_TOKEN });
		const cloudDb = drizzle({ client: cloudClient, schema });

		// Export data from local database
		console.log('📤 Exporting data from local database...');

		const users = await localDb.select().from(schema.user);
		const posts = await localDb.select().from(schema.post);
		const comments = await localDb.select().from(schema.comment);
		const likes = await localDb.select().from(schema.like);
		const commentLikes = await localDb.select().from(schema.commentLike);
		const followers = await localDb.select().from(schema.follower);
		const sessions = await localDb.select().from(schema.session);
		const accounts = await localDb.select().from(schema.account);

		console.log(`Found: ${users.length} users, ${posts.length} posts, ${comments.length} comments`);

		// Import data to cloud database
		console.log('📥 Importing data to cloud database...');

		if (users.length > 0) {
			await cloudDb.insert(schema.user).values(users);
			console.log(`✅ Imported ${users.length} users`);
		}

		if (accounts.length > 0) {
			await cloudDb.insert(schema.account).values(accounts);
			console.log(`✅ Imported ${accounts.length} accounts`);
		}

		if (sessions.length > 0) {
			await cloudDb.insert(schema.session).values(sessions);
			console.log(`✅ Imported ${sessions.length} sessions`);
		}

		if (posts.length > 0) {
			await cloudDb.insert(schema.post).values(posts);
			console.log(`✅ Imported ${posts.length} posts`);
		}

		if (comments.length > 0) {
			await cloudDb.insert(schema.comment).values(comments);
			console.log(`✅ Imported ${comments.length} comments`);
		}

		if (likes.length > 0) {
			await cloudDb.insert(schema.like).values(likes);
			console.log(`✅ Imported ${likes.length} likes`);
		}

		if (commentLikes.length > 0) {
			await cloudDb.insert(schema.commentLike).values(commentLikes);
			console.log(`✅ Imported ${commentLikes.length} comment likes`);
		}

		if (followers.length > 0) {
			await cloudDb.insert(schema.follower).values(followers);
			console.log(`✅ Imported ${followers.length} follower relationships`);
		}

		console.log('🎉 Data migration completed successfully!');
		console.log('💡 You can now update your .env file to use the cloud database URL');

	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

migrateData();