#!/usr/bin/env tsx

import { db } from './db.js';
import { post, comment, like, commentLike, user } from '../src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Database seeding script
 * 
 * This script generates sample data for development and testing purposes.
 * It creates posts, comments, likes, and comment likes for existing users.
 */

async function seedDatabase() {
	try {
		console.log('🌱 Starting database seeding...');

		// Get all existing users
		const existingUsers = await db.select().from(user);
		
		if (existingUsers.length === 0) {
			console.log('❌ No users found in database. Please create at least one user first.');
			console.log('💡 You can sign up through the web interface to create a user.');
			process.exit(1);
		}

		console.log(`👥 Found ${existingUsers.length} user(s) in database`);

		// Use the first user for seeding (or you could seed for all users)
		const seedUser = existingUsers[0];
		console.log(`🎯 Seeding data for user: ${seedUser.name || seedUser.email || 'Unknown'}`);

		// Sample posts data
		const samplePosts = [
			{
				id: crypto.randomUUID(),
				content: '<p>Just finished implementing database seeding! 🎉</p><p>Now I can easily generate test data for development. This is going to make testing so much easier!</p>',
				privacy: 'public',
				feeling: 'Accomplished',
				image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80&auto=format&fit=crop',
				authorId: seedUser.id,
				createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
				updatedAt: new Date(Date.now() - 1000 * 60 * 30),
			},
			{
				id: crypto.randomUUID(),
				content: '<p>Beautiful sunset from my balcony tonight 🌅</p><p>Sometimes you need to step away from the code and appreciate the simple things in life.</p>',
				privacy: 'public',
				feeling: 'Peaceful',
				image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop',
				authorId: seedUser.id,
				createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
				updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
			},
			{
				id: crypto.randomUUID(),
				content: '<p>Quick tip for fellow developers: Always comment your complex logic! 📝</p><p>Your future self (and your teammates) will thank you. Trust me on this one! 😅</p>',
				privacy: 'public',
				feeling: null,
				image: null,
				authorId: seedUser.id,
				createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
				updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
			},
			{
				id: crypto.randomUUID(),
				content: '<p>Coffee shop coding session ☕️💻</p><p>There\'s something magical about the ambient noise and energy of a good coffee shop. Perfect for getting into the flow state!</p>',
				privacy: 'followers',
				feeling: 'Focused',
				image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&q=80&auto=format&fit=crop',
				authorId: seedUser.id,
				createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
				updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
			},
			{
				id: crypto.randomUUID(),
				content: '<p>Working on a new feature for the app 🚀</p><p>The database seeding functionality is coming along nicely. Soon we\'ll be able to generate test data with a simple command!</p>',
				privacy: 'public',
				feeling: 'Excited',
				image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop',
				authorId: seedUser.id,
				createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
				updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
			}
		];

		// Insert posts
		console.log('📝 Creating sample posts...');
		const insertedPosts = await db.insert(post).values(samplePosts).returning();
		console.log(`✅ Created ${insertedPosts.length} posts`);

		// Generate sample comments for each post
		const sampleComments = [];
		const sampleLikes = [];
		const sampleCommentLikes = [];

		for (const insertedPost of insertedPosts) {
			// Generate 1-3 comments per post
			const commentCount = Math.floor(Math.random() * 3) + 1;
			
			for (let i = 0; i < commentCount; i++) {
				const commentId = crypto.randomUUID();
				const commentTexts = [
					'Great post! Thanks for sharing this.',
					'I totally agree with this perspective.',
					'This is really helpful, appreciate it!',
					'Love this! Keep up the great work.',
					'Interesting point of view, thanks!',
					'This made my day, thank you!',
					'So true! I\'ve experienced this too.',
					'Excellent insight, very well said.',
				];
				
				const commentContent = commentTexts[Math.floor(Math.random() * commentTexts.length)];
				
				sampleComments.push({
					id: commentId,
					content: commentContent,
					postId: insertedPost.id,
					authorId: seedUser.id,
					parentId: null,
					createdAt: new Date(insertedPost.createdAt.getTime() + Math.random() * 1000 * 60 * 60), // Random time after post
					updatedAt: new Date(insertedPost.createdAt.getTime() + Math.random() * 1000 * 60 * 60),
				});

				// 30% chance to add a reply to this comment
				if (Math.random() < 0.3) {
					const replyTexts = [
						'Thanks for the kind words!',
						'Glad you found it useful!',
						'Appreciate the feedback!',
						'You\'re very welcome!',
						'Happy to help!',
					];
					
					sampleComments.push({
						id: crypto.randomUUID(),
						content: replyTexts[Math.floor(Math.random() * replyTexts.length)],
						postId: insertedPost.id,
						authorId: seedUser.id,
						parentId: commentId,
						createdAt: new Date(insertedPost.createdAt.getTime() + Math.random() * 1000 * 60 * 60 * 2),
						updatedAt: new Date(insertedPost.createdAt.getTime() + Math.random() * 1000 * 60 * 60 * 2),
					});
				}
			}

			// 70% chance to like each post
			if (Math.random() < 0.7) {
				sampleLikes.push({
					id: crypto.randomUUID(),
					postId: insertedPost.id,
					userId: seedUser.id,
					createdAt: new Date(insertedPost.createdAt.getTime() + Math.random() * 1000 * 60 * 30),
					updatedAt: new Date(insertedPost.createdAt.getTime() + Math.random() * 1000 * 60 * 30),
				});
			}
		}

		// Insert comments
		if (sampleComments.length > 0) {
			console.log('💬 Creating sample comments...');
			const insertedComments = await db.insert(comment).values(sampleComments).returning();
			console.log(`✅ Created ${insertedComments.length} comments`);

			// Generate likes for comments (30% chance per comment)
			for (const insertedComment of insertedComments) {
				if (Math.random() < 0.3) {
					sampleCommentLikes.push({
						id: crypto.randomUUID(),
						commentId: insertedComment.id,
						userId: seedUser.id,
						createdAt: new Date(insertedComment.createdAt.getTime() + Math.random() * 1000 * 60 * 15),
						updatedAt: new Date(insertedComment.createdAt.getTime() + Math.random() * 1000 * 60 * 15),
					});
				}
			}
		}

		// Insert likes
		if (sampleLikes.length > 0) {
			console.log('❤️ Creating sample post likes...');
			await db.insert(like).values(sampleLikes);
			console.log(`✅ Created ${sampleLikes.length} post likes`);
		}

		// Insert comment likes
		if (sampleCommentLikes.length > 0) {
			console.log('👍 Creating sample comment likes...');
			await db.insert(commentLike).values(sampleCommentLikes);
			console.log(`✅ Created ${sampleCommentLikes.length} comment likes`);
		}

		console.log('\n🎉 Database seeding completed successfully!');
		console.log('\n📊 Summary:');
		console.log(`   Posts: ${insertedPosts.length}`);
		console.log(`   Comments: ${sampleComments.length}`);
		console.log(`   Post Likes: ${sampleLikes.length}`);
		console.log(`   Comment Likes: ${sampleCommentLikes.length}`);
		console.log('\n💡 You can now view the seeded data in your application!');

	} catch (error) {
		console.error('❌ Error seeding database:', error);
		process.exit(1);
	}
}

// Run the seeding function
seedDatabase();