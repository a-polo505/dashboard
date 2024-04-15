import { checkIPRestrictions } from "./ipRestrictions.js";

// const ip = "95.153.128.0"; // pidorasha ip
const ip = "79.127.218.208";

(async () => {
  const isAllowed = await checkIPRestrictions(ip);
  console.log("Is allowed:", isAllowed);
})();
