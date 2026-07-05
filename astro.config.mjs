// @ts-check
import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import imageVariants from '@remino/astro-image-variants'
import compressor from 'astro-compressor'
import minifyHtml from 'astro-minify-html'
import rehypeCodeBlocks from './src/lib/rehype-code-blocks.mjs'

export default defineConfig({
	outDir: './deploy/public',
	srcDir: './src',
	site: 'https://remino.net/remarqueeble/',
	trailingSlash: 'always',
	markdown: {
		processor: unified({
			rehypePlugins: [rehypeCodeBlocks],
		}),
	},
	integrations: [
		imageVariants(),
		minifyHtml({
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true,
			minifyJS: true,
		}),
		compressor({
			fileExtensions: ['.css', '.js', '.html', '.xml', '.cjs', '.mjs', '.svg'],
		}),
	],
	build: {
		assets: 'remarqueeble',
	},
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
	},
})
