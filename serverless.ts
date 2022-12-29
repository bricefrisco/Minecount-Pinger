import type { AWS } from "@serverless/typescript";
import { serverPinger, serverUpdater } from "handlers";

const serverlessConfiguration: AWS = {
  service: "minecount",
  frameworkVersion: "3",
  configValidationMode: "error",
  plugins: ["serverless-esbuild"],
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk", "pg-native"],
      target: "node18",
      define: { "require.resolve": undefined },
      platform: "node",
    },
  },
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    environment: {
      INFLUXDB_TOKEN: "${ssm:/minecount-influx-db-token}",
      PGUSER: "${ssm:/minecount-pg-user}",
      PGPASSWORD: "${ssm:/minecount-pg-password}",
      PGHOST: "${ssm:/minecount-pg-host}",
      PGPORT: "${ssm:/minecount-pg-port}",
      PGDATABASE: "${ssm:/minecount-pg-database}",
    },
  },

  functions: {
    serverPinger,
    serverUpdater,
  },
};

module.exports = serverlessConfiguration;
