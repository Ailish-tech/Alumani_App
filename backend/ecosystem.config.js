module.exports = {
  apps: [
    {
      name: 'alumaniapp-backend',
      script: 'dist/src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
