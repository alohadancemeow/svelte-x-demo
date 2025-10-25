import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			// Configure for serverless functions
			runtime: 'nodejs20.x',
			regions: ['iad1'], // Use closest region to your users
			memory: 1024,
			maxDuration: 30
		}),

		// Disable server-side rendering for auth routes to prevent issues
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn'
		},

		// Configure CSP for Better Auth
		csp: {
			mode: 'auto',
			directives: {
				'connect-src': ['self', 'https:'],
				'img-src': ['self', 'data:', 'https:'],
				'script-src': ['self', 'unsafe-inline']
			}
		}
	}
};

export default config;
