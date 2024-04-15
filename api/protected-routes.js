import express from "express";
import { checkIPRestrictions } from "../src/ipRestrictions.js";

const router = express.Router();

router.get("/api/protected-routes", async (req, res) => {
  try {
    const userIPAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(userIPAddress);
    const isAllowed = await checkIPRestrictions(userIPAddress);

    const responseData = { isAllowed };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error checking IP restrictions:", error);
    res.status(500).send("Internal server error.");
  }
});

export default router;
