module.exports = {
  apps: [
    {
      name: 'footvault-backend',
      script: './dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Environment-specific settings
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
