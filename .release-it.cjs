module.exports = {
	git: {
		commitMessage: 'Bump version to ${version}',
		requireCleanWorkingDir: true,
		requireUpstream: true,
		tagAnnotation: 'Release ${version}',
		tagName: 'v${version}',
	},
	github: false,
	hooks: {
		'before:init': ['npm test', 'npm run typecheck', 'npm run format:check'],
		'after:bump': [
			'node bin/release-changelog.mjs promote ${version}',
			'npm run build',
			'git add package.json package-lock.json CHANGELOG.md dist',
		],
		'before:release':
			'npm pack --dry-run --cache /private/tmp/remarqueeble-npm-cache',
		'after:release': [
			'gh release create v${version} dist/* --generate-notes --verify-tag --title v${version}',
			'npm publish --access public --registry https://registry.npmjs.org/',
			'npm run docs:publish',
		],
	},
	npm: {
		publish: false,
	},
}
