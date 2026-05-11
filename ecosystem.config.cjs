// PM2 配置文件 —— 用于生产环境守护 Node 进程
// 用法：pm2 start ecosystem.config.cjs --env production

const nodeInterpreter = process.env.PM2_NODE_INTERPRETER || 'node';

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'blog-by-ai',

      // 入口文件（Astro @astrojs/node standalone 模式构建产物）
      script: './dist/server/entry.mjs',
      interpreter: nodeInterpreter,

      // 运行实例数：max = CPU 核心数，适合多核服务器
      instances: 'max',

      // 执行模式：cluster 模式支持多实例负载均衡
      exec_mode: 'cluster',

      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 4321,
        HOST: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4321,
        HOST: '0.0.0.0',
      },

      // 自动重启：进程崩溃后自动重启
      autorestart: true,
      // 崩溃后重启延迟
      restart_delay: 3000,
      // 内存上限：超过 512MB 自动重启
      max_memory_restart: '512M',
      // 异常退出时重启次数限制（防止无限重启）
      max_restarts: 10,
      // 最小运行时间
      min_uptime: '10s',

      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 生产环境不监听文件变化
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
