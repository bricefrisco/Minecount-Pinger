import handlerPath from "util/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 128,
  timeout: 15,
  events: [
    {
      schedule: {
        rate: ["cron(* * ? * * *)"], // Every minute
      },
    },
  ],
};
