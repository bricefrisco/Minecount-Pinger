import * as pg from "pg";
import { status, JavaStatusResponse } from "minecraft-server-util";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { Server } from "./handler.types";
import { ScheduledEvent } from "aws-lambda";

const postgresClient = new pg.Client({ ssl: true });
postgresClient.connect();

const influxClient = new InfluxDB({
  url: "https://us-east-1-1.aws.cloud2.influxdata.com",
  token: process.env.INFLUXDB_TOKEN,
});

const influxWriteApi = influxClient.getWriteApi("bfrisco", "minecount", "ms");

const validateEnv = (keys: string[]) => {
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`'${key}' environment variable must be set!`);
    }
  }
};

validateEnv([
  "INFLUXDB_TOKEN",
  "PGUSER",
  "PGPASSWORD",
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
]);

const pingAndWrite = async (
  id: number,
  ip: string
): Promise<{ id: number; ip: string; onlinePlayers: number }> => {
  try {
    const ping: JavaStatusResponse = await status(ip, undefined, {
      timeout: 10000,
    });
    const onlinePlayers = ping.players.online;

    influxWriteApi.writePoint(
      new Point("player_count")
        .tag("server_id", id.toString())
        .intField("count", onlinePlayers)
    );

    return { id, ip, onlinePlayers };
  } catch (error) {
    console.error(`server ${id} (${ip}) ping unsuccessful - `, error);
    return { id, ip, onlinePlayers: -1 };
  }
};

export const main = async (
  event: ScheduledEvent
): Promise<{ id: number; ip: string; onlinePlayers: number }[]> => {
  const { rows } = await postgresClient.query(
    "SELECT id, ip FROM servers WHERE approved = true"
  );

  const promises = [];
  for (const server of rows as Server[]) {
    promises.push(pingAndWrite(server.id, server.ip));
  }

  const results = await Promise.all(promises);
  await influxWriteApi.flush();

  console.log(JSON.stringify(results));
  return results;
};
