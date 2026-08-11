/* eslint-disable @typescript-eslint/no-require-imports */
const PG_BIN = "/usr/lib/postgresql/18/bin";
const PG_DATA = "/home/lutvi/eng-pgdata";
const PG_LOG = `${PG_DATA}/server.log`;
const fs = require("fs");
const path = require("path");

// Muat .env dari root repo (PM2 daemon tidak punya env shell saat start).
function loadDotEnv() {
  const file = path.join(__dirname, ".env");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const DOT_ENV = loadDotEnv();

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
        JWT_SECRET: DOT_ENV.JWT_SECRET ?? process.env.JWT_SECRET,
        NEXT_PUBLIC_API_URL: DOT_ENV.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
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
        DATABASE_URL: DOT_ENV.DATABASE_URL ?? process.env.DATABASE_URL,
        JWT_SECRET: DOT_ENV.JWT_SECRET ?? process.env.JWT_SECRET,
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

