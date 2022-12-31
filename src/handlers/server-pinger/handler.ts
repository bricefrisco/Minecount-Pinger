import * as pg from "pg";
import { status, JavaStatusResponse } from "minecraft-server-util";
import { Server } from "./handler.types";
import { ScheduledEvent } from "aws-lambda";

const postgresClient = new pg.Client();
postgresClient.connect();

const validateEnv = (keys: string[]) => {
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`'${key}' environment variable must be set!`);
    }
  }
};

validateEnv(["PGUSER", "PGPASSWORD", "PGHOST", "PGPORT", "PGDATABASE"]);

const pingAndWrite = async (
  id: number,
  ip: string
): Promise<{ id: number; ip: string; onlinePlayers: number }> => {
  try {
    const ping: JavaStatusResponse = await status(ip, undefined, {
      timeout: 10000,
    });

    const onlinePlayers = ping.players.online;

    await postgresClient.query(
      `INSERT INTO server_pings (time, server_id, player_count) VALUES ($1, $2, $3)`,
      [new Date(), id, onlinePlayers]
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

  console.log(JSON.stringify(results));
  return results;
};
