module.exports = {
	extends: [
		'react-app',
		'plugin:jsx-a11y/recommended',
		'prettier',
		'prettier/react',
	],
	plugins: ['jsx-a11y', 'prettier', 'react-hooks'],
	rules: {
		'default-case': 'off',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',
	},
};
