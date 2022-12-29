import { InfluxDB, Point } from "@influxdata/influxdb-client";

export class Influx {
  private bucket = "minecount";
  private org = "bfrisco";

  private writeApi;
  private queryApi;

  constructor() {
    const influxDB = new InfluxDB({
      url: "https://us-east-1-1.aws.cloud2.influxdata.com",
      token: process.env.INFLUXDB_TOKEN,
    });

    this.writeApi = influxDB.getWriteApi(this.org, this.bucket, "ms");
    this.queryApi = influxDB.getQueryApi(this.org);
  }

  public write(serverId: number, playerCount: number): void {
    this.writeApi.writePoint(
      new Point()
        .tag("server_id", serverId.toString())
        .intField("pc", playerCount)
    );
  }

  public async flush(): Promise<void> {
    await this.writeApi.flush();
  }

  public async query(serverName: string, period: Period): Promise<any[]> {
    const bucket = this.getBucketName(period);
    const rangeStart = this.getRangeStart(period);
    const query = `from(bucket: "${bucket}")
      |> range(start: ${rangeStart})
      |> filter(fn: (r) => r.server_id == "${serverName}")`;

    const objects: any[] = [];
    return new Promise((resolve, reject) => {
      this.queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          objects.push(tableMeta.toObject(row));
        },
        error: (error) => {
          reject(error);
        },
        complete: () => {
          resolve(objects);
        },
      });
    });
  }

  private getBucketName(period: Period): string {
    switch (period) {
      case Period.DAY:
        return "minecount_downsampled_10m";
      case Period.WEEK:
        return "minecount_downsampled_1h";
      case Period.MONTH:
        return "minecount_downsampled_4h";
      case Period.ALL:
        return "minecount_downswampled_1d";
      default:
        throw new Error(`No corresponding bucket name for period ${period}`);
    }
  }

  private getRangeStart(period: Period): string {
    switch (period) {
      case Period.DAY:
        return "-1d";
      case Period.WEEK:
        return "-1w";
      case Period.MONTH:
        return "-1m";
      case Period.ALL:
        return "0";
      default:
        throw new Error(`No corresponding range start for period ${period}`);
    }
  }
}

enum Period {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  ALL = "ALL",
}

if (!process.env.INFLUXDB_TOKEN) {
  throw new Error("INFLUXDB_TOKEN environment variable must be set!");
}

export default new Influx();
