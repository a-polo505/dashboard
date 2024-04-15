import express from "express";
import { checkIPRestrictions } from "../src/ipRestrictions.js";

const router = express.Router();

router.get("/api/protected-routes", (req, res) => {
  const userIPAddress =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(userIPAddress);
  const isAllowed = checkIPRestrictions(userIPAddress);
  if (isAllowed) {
    console.log("isAllowed");
    res.send("Welcome! You have access to this route.");
  } else {
    console.log("Access denied");
    res.status(403).send("Access denied.");
  }
});

export default router;
