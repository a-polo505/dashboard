import geoip from "fast-geoip";

export async function checkIPRestrictions(ip) {
  const location = await geoip.lookup(ip);
  console.log(location);

  if (location && location.country === "RU") {
    return true;
  } else {
    return false;
  }
}
