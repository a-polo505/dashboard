import express from "express";
import { checkIPRestrictions } from "../src/ipRestrictions.js";

const router = express.Router();

router.get("/api/protected-routes", (req, res) => {
  const userIPAddress =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("from protected-routes:", userIPAddress);
  const isAllowed = checkIPRestrictions(userIPAddress);
  if (isAllowed) {
    res.send("Welcome! You have access to this route.");
  } else {
    res.status(403).send("Access denied.");
  }
});

export default router;
