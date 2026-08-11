const PG_BIN = "/usr/lib/postgresql/18/bin";
const PG_DATA = "/home/lutvi/eng-pgdata";
const PG_LOG = `${PG_DATA}/server.log`;

module.exports = {
  apps: [
    {
      name: "eng-postgres",
      cwd: __dirname,
      script: `${PG_BIN}/postgres`,
      args: `-D ${PG_DATA} -p 5433 -k /tmp`,
      interpreter: "none",
      autorestart: true,
      watch: false,
      time: true,
      log_file: "/tmp/opencode/eng-postgres.log",
      out_file: "/tmp/opencode/eng-postgres.out.log",
      error_file: "/tmp/opencode/eng-postgres.err.log",
    },
    {
      name: "eng-frontend",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3011",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "512M",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      log_file: "/tmp/opencode/eng-frontend.log",
      out_file: "/tmp/opencode/eng-frontend.out.log",
      error_file: "/tmp/opencode/eng-frontend.err.log",
    },
    {
      name: "eng-backend",
      cwd: __dirname,
      script: ".venv/bin/uvicorn",
      args: "backend.main:app --host 0.0.0.0 --port 8101 --workers 2",
      interpreter: "none",
      env: {
        DATABASE_URL:
          process.env.DATABASE_URL ??
          "postgresql://engineering:engineering123@localhost:5433/engineering",
        JWT_SECRET: process.env.JWT_SECRET ?? "eng-perf-dashboard-secret-2026",
      },
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      time: true,
      log_file: "/tmp/opencode/eng-backend.log",
      out_file: "/tmp/opencode/eng-backend.out.log",
      error_file: "/tmp/opencode/eng-backend.err.log",
    },
  ],
};

