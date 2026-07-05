import {
	copyFile,
	mkdir,
	readdir,
	readFile,
	rm,
	writeFile,
} from 'node:fs/promises'
import { resolve } from 'node:path'
import { browserslistToTargets, Features, transform } from 'lightningcss'
import { build } from 'vite'

const root = process.cwd()
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const currentYear = new Date().getFullYear()
const copyrightYears = (startYear, endYear = new Date().getFullYear()) =>
	startYear === endYear ? String(startYear) : `${startYear}-${endYear}`
const banner = `/*! ${pkg.name} v${pkg.version} | (c) ${copyrightYears(2026, currentYear)} ${pkg.author.name} <${pkg.author.url}> | ${pkg.license} Licence */`

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

const ensureBanner = async filePath => {
	const file = await readFile(filePath, 'utf8')
	if (file.startsWith(banner)) return

	await writeFile(filePath, `${banner}\n${file}`)
}

const cssTargets = browserslistToTargets([
	'chrome 95',
	'edge 95',
	'firefox 91',
	'ios_saf 15.4',
	'safari 15.4',
])

const minifyCss = css =>
	Buffer.from(
		transform({
			code: Buffer.from(css),
			filename: 'lite.css',
			// In Lightning CSS, include means "always run this transform".
			include: Features.Nesting,
			minify: true,
			targets: cssTargets,
		}).code
	).toString()

await rm(resolve(root, 'dist'), { force: true, recursive: true })
await mkdir(resolve(root, 'dist'), { recursive: true })

await copyFile(
	resolve(root, 'src/lib/lite.css'),
	resolve(root, 'dist/lite.css')
)
await writeFile(
	resolve(root, 'dist/lite.min.css'),
	minifyCss(await readFile(resolve(root, 'src/lib/lite.css'), 'utf8'))
)

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
	fileName: () => 'remarqueeble-auto.min.js',
	formats: ['iife'],
	minify: true,
	name: 'remarqueeble',
})

const distFiles = await readdir(resolve(root, 'dist'))
await Promise.all(
	distFiles
		.filter(fileName => /\.(?:cjs|css|mjs|js)$/.test(fileName))
		.map(fileName => ensureBanner(resolve(root, 'dist', fileName)))
)
