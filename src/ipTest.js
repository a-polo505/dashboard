import { checkIPRestrictions } from "./ipRestrictions.js";

const ip = "95.153.128.0"; // pidorasha ip

(async () => {
  const isAllowed = await checkIPRestrictions(ip);
  console.log("Is allowed:", isAllowed);
})();
