import { checkIPRestrictions } from "./ipRestrictions.js";

// const ip = "95.153.128.0"; // pidorasha ip
const ip = "143.198.79.196";

(async () => {
  const isAllowed = await checkIPRestrictions(ip);
  console.log("Is allowed:", isAllowed);
})();
