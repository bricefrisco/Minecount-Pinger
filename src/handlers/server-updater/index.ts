import handlerPath from "util/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 128,
  timeout: 30,
  events: [
    {
      schedule: {
        rate: ["cron(0 * ? * * *)"], // Every hour
        input: {
          updateType: "SERVER_INFO", // Player count, motd, etc.
        },
      },
    },
    {
      schedule: {
        rate: ["cron(0 0 ? * * *)"], // Every day
        input: {
          updateType: "SERVER_IMAGE", // Server favicon
        },
      },
    },
  ],
};
