import { readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build } from 'vite'

const root = process.cwd()
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const currentYear = new Date().getFullYear()
const banner = `/*! ${pkg.name} v${pkg.version} | (c) 2026-${currentYear} ${pkg.author.name} <${pkg.author.url}> | ${pkg.license} Licence */`

const buildLibrary = async ({
	entry,
	fileName,
	formats,
	minify = false,
	name,
}) =>
	build({
		configFile: false,
		publicDir: false,
		build: {
			emptyOutDir: false,
			lib: {
				entry,
				fileName,
				formats,
				name,
			},
			minify,
			outDir: resolve(root, 'dist'),
			rollupOptions: {
				output: {
					banner,
				},
			},
			sourcemap: false,
		},
	})

await rm(resolve(root, 'dist'), { force: true, recursive: true })

await buildLibrary({
	entry: resolve(root, 'src/lib/remarqueeble.ts'),
	fileName: format =>
		format === 'es' ? 'remarqueeble.mjs' : 'remarqueeble.cjs',
	formats: ['es', 'cjs'],
})

await buildLibrary({
	entry: resolve(root, 'src/lib/auto.ts'),
	fileName: format =>
		format === 'es' ? 'remarqueeble-auto.mjs' : 'remarqueeble-auto.cjs',
	formats: ['es', 'cjs'],
})

await buildLibrary({
	entry: resolve(root, 'src/lib/auto.ts'),
	fileName: () => 'remarqueeble.umd.js',
	formats: ['umd'],
	minify: true,
	name: 'remarqueeble',
})
