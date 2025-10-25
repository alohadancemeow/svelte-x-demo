import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./server/db";
import { getRequestEvent } from "$app/server";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { env } from "$env/dynamic/private";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite", // or "mysql", "sqlite"
    }),

    // Configure base URL for Vercel deployment
    baseURL: env.BETTER_AUTH_URL || "http://localhost:5173",
    
    // Add trusted origins for production
    trustedOrigins: [
        env.BETTER_AUTH_URL || "http://localhost:5173",
        "http://localhost:5173",
        "https://localhost:5173"
    ].filter(Boolean),

    // Configure secret for session security
    secret: env.BETTER_AUTH_SECRET,

    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        },

        github: {
            clientId: env.GITHUB_CLIENT_ID as string,
            clientSecret: env.GITHUB_CLIENT_SECRET as string,
        },
    },

    plugins: [sveltekitCookies(getRequestEvent)], // make sure this is the last plugin in the array
});