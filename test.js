import { InfluxDB, Point } from "@influxdata/influxdb-client";

const influxDB = new InfluxDB({
  url: "https://us-east-1-1.aws.cloud2.influxdata.com",
  token: process.env.INFLUXDB_TOKEN,
});

const queryApi = influxDB.getQueryApi("bfrisco");

const query = async (rangeStart) => {
  const query = `from(bucket: "minecount")
      |> range(start: ${rangeStart})`;

  const objects = [];
  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
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
};

const main = async () => {
  console.log(await query("-10m"));
};

main();
