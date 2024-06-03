import arcjet, { fixedWindow } from "@arcjet/node";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    fixedWindow({
      mode: "LIVE",
      match: "/api/currencies",
      characteristics: ["ip.src"],
      window: "60s",
      max: 5,
    }),
  ],
});

export default aj;
