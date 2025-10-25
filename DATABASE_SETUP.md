# Database Setup Guide

## After Setting Up Your Cloud Database

### 1. Update Environment Variables

Replace your `.env` file with the new database URL:

```env
# Replace with your actual database URL
DATABASE_URL=your-cloud-database-url-here

# or using Turso: https://docs.turso.tech/quickstart
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Update auth URL for production
BETTER_AUTH_URL=https://your-app.vercel.app
BETTER_AUTH_SECRET=your-production-secret

# Keep your existing OAuth credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

### 2. Generate and Run Migrations

```bash
# Generate migration files
npm run db:generate

# Run migrations on your cloud database
npm run db:migrate:prod
```

### 3. Migrate Your Local Data (Optional)

If you want to keep your existing local data:

```bash
# This will copy data from local.db to your cloud database
npm run db:migrate:data
```

### 4. Test Locally

```bash
# Test with the new database
npm run dev
```

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Set environment variables in Vercel dashboard
3. Deploy!

## Database Options Comparison

| Database | Pros | Cons |
|----------|------|------|
| **Turso** | SQLite compatible, fast, free tier | CLI setup issues |
| **Neon** | Easy setup, PostgreSQL, generous free tier | Different from SQLite |
| **Supabase** | Full backend, auth included, PostgreSQL | Might be overkill |

## Troubleshooting

- **Migration errors**: Make sure your DATABASE_URL is correct
- **Connection issues**: Check if your database allows external connections
- **Schema errors**: Run `npm run db:generate` after any schema changes