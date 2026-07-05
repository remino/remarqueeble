module.exports = {
	git: {
		commitMessage: 'Bump version to ${version}',
		requireCleanWorkingDir: true,
		requireUpstream: true,
		tagAnnotation: 'Release ${version}',
		tagName: 'v${version}',
	},
	github: {
		assets: ['dist/*'],
		autoGenerate: true,
		release: true,
	},
	hooks: {
		'before:init': [
			'node -e "if (!process.env.GITHUB_TOKEN) { console.error(\'GITHUB_TOKEN is required for automated GitHub releases.\'); process.exit(1) }"',
			'npm test',
			'npm run typecheck',
			'npm run format:check',
		],
		'after:bump': [
			'node bin/release-changelog.mjs promote ${version}',
			'npm run build',
			'git add package.json package-lock.json CHANGELOG.md dist',
		],
		'before:release':
			'npm pack --dry-run --cache /private/tmp/remarqueeble-npm-cache',
		'after:github:release': 'npm run docs:publish',
	},
	npm: {
		publish: true,
		publishArgs: ['--access', 'public'],
	},
}
