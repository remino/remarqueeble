import { addCopyButtons } from '@remino/functions'

addCopyButtons({
	blockSelector:
		'main:not(.playground-layout) pre.astro-code, main:not(.playground-layout) .code-block',
	copiedLabel: 'Copied',
})
