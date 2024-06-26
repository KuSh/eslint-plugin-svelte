import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
// @ts-expect-error -- Missing types
import svelteMd from 'vite-plugin-svelte-md';
import eslint4b, { requireESLintUseAtYourOwnRisk4b } from 'vite-plugin-eslint4b';
import svelteMdOption from './tools/vite-plugin-svelte-md-option.mjs';

import './build-system/build.ts';
import generateRoutes from './tools/generate-routes.mjs';
import type { UserConfig } from 'vite';
import { fileURLToPath } from 'url';

generateRoutes();

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('vite').UserConfig} */
const config: UserConfig = {
	plugins: [
		svelteMd(
			svelteMdOption({
				baseUrl: '/eslint-plugin-svelte',
				root: path.join(dirname, '../docs')
			})
		),
		sveltekit(),
		eslint4b(),
		requireESLintUseAtYourOwnRisk4b()
	],
	server: {
		fs: { strict: false }
	},
	resolve: {
		alias: {
			assert: path.join(dirname, './shim/assert.mjs'),
			'postcss-load-config': path.join(dirname, './shim/postcss-load-config.mjs'),
			'source-map-js': path.join(dirname, './shim/source-map-js.mjs'),
			module: path.join(dirname, './shim/module.mjs'),
			url: path.join(dirname, './shim/url.mjs'),
			os: path.join(dirname, './shim/os.mjs'),
			fs: path.join(dirname, './shim/fs.mjs'),
			globby: path.join(dirname, './shim/globby.mjs'),
			picocolors: path.join(dirname, './shim/picocolors.mjs'),
			tslib: path.join(dirname, './node_modules/tslib/tslib.es6.js'),

			// Alias to CJS
			'svelte/compiler': path.join(dirname, './node_modules/svelte/compiler/index.js'),
			'eslint-visitor-keys': path.join(
				dirname,
				'./node_modules/eslint-visitor-keys/dist/eslint-visitor-keys.cjs'
			),
			espree: path.join(dirname, './node_modules/espree/dist/espree.cjs'),
			'eslint-scope': path.join(dirname, './node_modules/eslint-scope/dist/eslint-scope.cjs'),
			acorn: path.join(dirname, './node_modules/acorn/dist/acorn.js')
		}
	},
	ssr: {
		// vite-plugin-svelte recognizes svelte-eslint-parser as a library that runs on svelte.
		// This confuses the SSR on the Dev server.
		// This is the workaround for that.
		// https://github.com/sveltejs/vite-plugin-svelte/blob/a1d141e890ac0d1572a46e2bec705aa090236560/packages/vite-plugin-svelte/src/utils/dependencies.ts#L114
		external: ['svelte-eslint-parser']
	},
	build: {
		commonjsOptions: {
			ignoreDynamicRequires: true
		}
	}
};

export default config;
