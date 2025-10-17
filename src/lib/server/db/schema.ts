/**
 * Database Schema for Social Media Application
 * Built with Drizzle ORM for SQLite
 */

import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * Reusable timestamp fields for all tables
 * Automatically tracks creation and update times
 */
const timestampDefaults = {
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
};

// ============================================================================
// AUTHENTICATION TABLES
// ============================================================================

/**
 * User table - Core user information
 * Stores basic profile data and authentication status
 */
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	...timestampDefaults,
});

/**
 * Session table - User authentication sessions
 * Tracks active user sessions with expiration and device info
 */
export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	...timestampDefaults,
});

/**
 * Account table - OAuth provider accounts
 * Links users to external authentication providers (Google, GitHub, etc.)
 */
export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
	scope: text("scope"),
	password: text("password"),
	...timestampDefaults,
});

/**
 * Verification table - Email verification tokens
 * Stores temporary tokens for email verification process
 */
export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	...timestampDefaults,
});

// ============================================================================
// SOCIAL MEDIA CONTENT TABLES
// ============================================================================

/**
 * Post table - Main content posts
 * Stores user posts with content, images, privacy settings, and mood
 */
export const post = sqliteTable("post", {
	id: text("id").primaryKey(),
	image: text("image"),
	content: text("content"),
	privacy: text("privacy").default("public"),
	feeling: text("feeling"),
	authorId: text("author_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	...timestampDefaults,

});

/**
 * Like table - Post likes/reactions
 * Tracks which users liked which posts (many-to-many relationship)
 */
export const like = sqliteTable("like", {
	id: text("id").primaryKey(),
	postId: text("post_id")
		.notNull()
		.references(() => post.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	...timestampDefaults,
});

/**
 * Comment table - Threaded comments on posts
 * Supports nested replies through self-referencing parentId
 * Includes indexes for efficient querying by author, post, and parent
 */
export const comment = sqliteTable("comment", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	content: text("content").notNull(),
	authorId: text("author_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }), // Comment author
	postId: text("post_id")
		.notNull()
		.references(() => post.id, { onDelete: "cascade" }), // Post being commented on
	parentId: text("parent_id"), // Optional: parent comment for threaded replies
	...timestampDefaults,
}, (table) => ({
	// Database indexes for efficient querying
	authorIdIdx: index("comment_author_id_idx").on(table.authorId), // Find comments by author
	postIdIdx: index("comment_post_id_idx").on(table.postId), // Find comments on a post
	parentIdIdx: index("comment_parent_id_idx").on(table.parentId), // Find replies to a comment
}));

/**
 * CommentLike table - Likes on comments
 * Tracks which users liked which comments (many-to-many relationship)
 */
export const commentLike = sqliteTable("comment_like", {
	id: text("id").primaryKey(),
	commentId: text("comment_id")
		.notNull()
		.references(() => comment.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	...timestampDefaults,
});

// ============================================================================
// DRIZZLE RELATIONS - Define table relationships for type-safe queries
// ============================================================================

/**
 * User Relations - All entities connected to a user
 * Enables queries like: user.posts, user.comments, user.likes
 */
export const userRelations = relations(user, ({ many }) => ({
	posts: many(post), // User's posts
	comments: many(comment), // User's comments
	likes: many(like), // User's post likes
	commentLikes: many(commentLike), // User's comment likes
	sessions: many(session), // User's active sessions
	accounts: many(account), // User's OAuth accounts
}));

/**
 * Post Relations - Connections from a post's perspective
 * Enables queries like: post.author, post.comments, post.likes
 */
export const postRelations = relations(post, ({ one, many }) => ({
	author: one(user, { // Post author
		fields: [post.authorId],
		references: [user.id],
	}),
	likes: many(like), // Post likes
	comments: many(comment), // Post comments
}));

/**
 * Comment Relations - Complex threaded comment relationships
 * Supports self-referencing parent/child structure for nested replies
 * Enables queries like: comment.author, comment.post, comment.parent, comment.replies
 */
export const commentRelations = relations(comment, ({ one, many }) => ({
	post: one(post, { // Post this comment belongs to
		fields: [comment.postId],
		references: [post.id],
	}),
	author: one(user, { // Comment author
		fields: [comment.authorId],
		references: [user.id],
	}),
	parent: one(comment, { // Parent comment (for replies)
		fields: [comment.parentId],
		references: [comment.id],
		relationName: "replies", // Named relation to avoid conflicts
	}),
	replies: many(comment, { // Child comments (replies to this comment)
		relationName: "replies", // Must match parent relation name
	}),
	likes: many(commentLike), // Comment likes
}));

/**
 * Like Relations - Post like connections
 * Links likes to both the post and the user who liked it
 */
export const likeRelations = relations(like, ({ one }) => ({
	post: one(post, {
		fields: [like.postId],
		references: [post.id],
	}),
	user: one(user, {
		fields: [like.userId],
		references: [user.id],
	}),
}));

/**
 * CommentLike Relations - Comment like connections
 * Links comment likes to both the comment and the user who liked it
 */
export const commentLikeRelations = relations(commentLike, ({ one }) => ({
	comment: one(comment, {
		fields: [commentLike.commentId],
		references: [comment.id],
	}),
	user: one(user, {
		fields: [commentLike.userId],
		references: [user.id],
	}),
}));

/**
 * Session Relations - Authentication session connections
 * Links sessions to their associated user
 */
export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

/**
 * Account Relations - OAuth account connections
 * Links OAuth provider accounts to their associated user
 */
export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));
