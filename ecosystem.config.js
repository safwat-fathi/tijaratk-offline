module.exports = {
  apps: [
    {
      name: "tijaratk-backend",
      script: "dist/main.js", // PM2 cluster mode requires pointing directly to the compiled JS file
      cwd: "./backend",
      exec_mode: "cluster",
      instances: "max", // This will spawn 4 processes (one for each core)
      env: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      autorestart: true,
      watch: false,
    },
    {
      name: "tijaratk-frontend",
      script: ".next/standalone/server.js", // Next.js cluster mode requires the standalone server file!
      cwd: "./frontend",
      exec_mode: "cluster",
      instances: "max", 
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      watch: false,
    },
  ],
};
