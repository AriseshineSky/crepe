module.exports = {
	apps: [
		{
			name: "crepe",
			script: "./bin/www",
			instances: "max",
			exec_mode: "cluster",
			watch: false,
			env: {
				NODE_ENV: "production",
			},
		},
	],
};
