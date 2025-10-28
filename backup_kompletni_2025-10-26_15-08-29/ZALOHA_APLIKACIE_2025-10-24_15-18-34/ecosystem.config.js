/**
 * PM2 Ecosystem Configuration
 * 
 * Usage:
 * - Development:  pm2 start ecosystem.config.js --env development
 * - Production:   pm2 start ecosystem.config.js --env production
 */

export default {
  apps: [
    {
      name: 'urban-analytics',
      script: './server.js',
      
      // Instances & Process Management
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      
      // Environment Variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      
      // Restart Policy
      max_memory_restart: '500M',
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      output: '/var/log/pm2/urban-analytics.out.log',
      error: '/var/log/pm2/urban-analytics.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart on file changes (dev only)
      ignore_watch: ['node_modules', 'dist', 'logs'],
      
      // Additional Settings
      autorestart: true,
      cron_restart: '0 0 * * *', // Restart daily at midnight
      merge_logs: true,
      wait_ready: true,
      listen_timeout: 5000,
      kill_timeout: 5000,
      
      // Monitoring
      max_old_space_size: 1024,
      
      // Tags for monitoring/organization
      tags: ['urban', 'analytics', 'app']
    }
  ],
  
  // Deployment Configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/urban-analytics.git',
      path: '/var/www/urban-analytics',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production server"'
    },
    staging: {
      user: 'ubuntu',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/urban-analytics.git',
      path: '/var/www/urban-analytics-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env development',
      'pre-deploy-local': 'echo "Deploying to staging server"'
    }
  }
};

