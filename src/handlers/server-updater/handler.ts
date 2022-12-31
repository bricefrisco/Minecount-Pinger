import { status, JavaStatusResponse } from "minecraft-server-util";
import * as pg from "pg";
import {
  ScheduledEvent,
  Server,
  ServerIconUpdate,
  ServerInfoUpdate,
  UpdateType,
} from "./handler.types";

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

const updateServerIcon = async (
  id: number,
  ip: string
): Promise<ServerIconUpdate> => {
  try {
    const ping: JavaStatusResponse = await status(ip, undefined, {
      timeout: 10000,
    });

    await postgresClient.query(
      `UPDATE servers SET favicon = $1 WHERE id = $2`,
      [ping.favicon, id]
    );

    return { id, successful: true };
  } catch (error) {
    console.error(
      `server ${id} (${ip}) update server favicon unsuccessful - `,
      error
    );

    return { id, successful: false };
  }
};

const updateServerInfo = async (
  id: number,
  ip: string
): Promise<ServerInfoUpdate> => {
  try {
    const ping: JavaStatusResponse = await status(ip, undefined, {
      timeout: 10000,
    });

    await postgresClient.query(
      `UPDATE servers SET player_count = $1, max_players = $2, motd = $3, version_name = $4, version_protocol = $5 WHERE id = $6`,
      [
        ping.players.online,
        ping.players.max,
        ping.motd.html,
        ping.version.name,
        ping.version.protocol,
        id,
      ]
    );

    return {
      id,
      successful: true,
      playerCount: ping.players.online,
      maxPlayers: ping.players.max,
      versionName: ping.version.name,
      versionProtocol: ping.version.protocol,
    };
  } catch (error) {
    console.error(
      `server ${id} (${ip}) update server info unsuccessful - `,
      error
    );
    return { id, successful: false };
  }
};

export const main = async (
  event: ScheduledEvent
): Promise<{ id: number; successful: boolean }[]> => {
  const { rows } = await postgresClient.query(
    "SELECT id, ip FROM servers WHERE approved = true"
  );

  const promises = [];
  for (const server of rows as Server[]) {
    if (event.updateType === UpdateType.SERVER_INFO) {
      promises.push(updateServerInfo(server.id, server.ip));
    } else if (event.updateType === UpdateType.SERVER_IMAGE) {
      promises.push(updateServerIcon(server.id, server.ip));
    } else {
      throw new Error(`Unexpected update type: ${event.updateType}`);
    }
  }

  const results = await Promise.all(promises);
  console.log(JSON.stringify(results));
  return results;
};
