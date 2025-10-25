# Svelte X Demo

A modern full-stack web application built with SvelteKit, featuring authentication, database integration, and social media functionality.

## 🚀 Features

- **Authentication**: Secure user authentication with Better Auth
- **Social Login**: Google and GitHub OAuth integration
- **Database**: SQLite/Turso database with Drizzle ORM
- **Modern UI**: Responsive design with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Production Ready**: Optimized for Vercel deployment

## 🛠️ Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with SQLite/Turso
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Deployment**: [Vercel](https://vercel.com/)

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- Node.js (version 18 or higher)
- pnpm (recommended) or npm
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd svelte-x-demo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL=file:local.db
   BETTER_AUTH_URL=http://localhost:5173
   BETTER_AUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

4. **Initialize the database**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

## 🚀 Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:migrate:prod` - Run production migrations
- `pnpm db:migrate:data` - Migrate data to cloud database

## 🗄️ Database Management

### Local Development
The project uses SQLite for local development. The database file (`local.db`) is automatically created when you run migrations.

### Production Deployment
For production, we recommend using [Turso](https://turso.tech/) or another cloud database:

1. **Set up cloud database** (see [DATABASE_SETUP.md](./DATABASE_SETUP.md))
2. **Create production environment file**
   ```bash
   cp .env.production.example .env.production
   ```
3. **Update production environment variables**
4. **Run production migrations**
   ```bash
   pnpm db:migrate:prod
   ```

## 🔐 Authentication Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/api/auth/callback/google` (development)
   - `https://your-domain.vercel.app/api/auth/callback/google` (production)

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:5173/api/auth/callback/github` (development)
   - `https://your-domain.vercel.app/api/auth/callback/github` (production)

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Import your GitHub repository on [Vercel](https://vercel.com/)
   - Configure environment variables in Vercel dashboard

3. **Set Environment Variables**
   Add the following variables in Vercel dashboard:
   ```
   DATABASE_URL=your-cloud-database-url
   BETTER_AUTH_URL=https://your-app.vercel.app
   BETTER_AUTH_SECRET=your-production-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

4. **Deploy and run migrations**
   After successful deployment, run production migrations if needed.

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── server/         # Server-side utilities
│   │   └── db/         # Database schema and utilities
│   ├── stores/         # Svelte stores
│   ├── utils/          # Utility functions
│   ├── auth.ts         # Authentication configuration
│   └── auth-client.ts  # Client-side auth utilities
├── routes/             # SvelteKit routes
│   ├── api/            # API endpoints
│   ├── auth/           # Authentication routes
│   └── users/          # User-related pages
└── app.html            # HTML template
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database configuration
- Review the [SvelteKit documentation](https://kit.svelte.dev/docs)
- Open an issue for bug reports or feature requests
