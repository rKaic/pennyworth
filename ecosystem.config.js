const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  apps: [{
    name: 'pennyworth',
    script: './dist/app.js',
    ignore_watch: ['node_modules', '.vscode', '.git', '.github', '*.log', '*.db'],
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}