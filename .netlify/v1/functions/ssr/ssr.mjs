
			import { createHandler } from './entry.mjs';

			export default createHandler({});

			// The config must be inlined here instead of imported because Netlify
			// parses this file statically to read the config.
			export const config = {
				includedFiles: ['**/*'],
				name: 'Astro SSR',
				nodeBundler: 'none',
				generator: '@astrojs/netlify@8.2.5',
				path: '/*',
				preferStatic: true,
			};
		