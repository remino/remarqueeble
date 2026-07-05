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
		release: true,
		releaseName: 'v${version}',
		releaseNotes: 'node bin/release-changelog.mjs notes ${version}',
	},
	hooks: {
		'before:init': ['npm test', 'npm run typecheck', 'npm run format:check'],
		'after:bump': [
			'node bin/release-changelog.mjs promote ${version}',
			'npm run build',
			'git add package.json package-lock.json CHANGELOG.md dist',
		],
		'before:release':
			'npm pack --dry-run --cache /private/tmp/remarqueeble-npm-cache',
		'after:release': 'npm run docs:publish',
	},
	npm: {
		publish: true,
		publishArgs: ['--access', 'public'],
	},
}
