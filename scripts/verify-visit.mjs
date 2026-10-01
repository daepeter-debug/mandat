import assert from "node:assert/strict";
import { branches, catalog, createTown, fixed, readSave, steps } from "../lib/republic.ts";
import { decodeVisit, encodeVisit, houseVariant, visitUrl } from "../lib/republic-visit.ts";

const fresh = createTown("2026-10-01", 71);
const roundTrip = town => {
  const before = JSON.stringify(town), code = encodeVisit(town), decoded = decodeVisit(code);
  assert(decoded && readSave(decoded));
  assert.equal(decoded.name, town.name); assert.equal(decoded.branch, town.branch);
  assert.deepEqual(decoded.completed, town.completed);
  assert.deepEqual([...decoded.roads].sort((a,b)=>a.y*6+a.x-b.y*6-b.x), [...town.roads].sort((a,b)=>a.y*6+a.x-b.y*6-b.x));
  const grid = s => s.placed.map(p => [p.x, p.y, p.id, p.id === "house" ? houseVariant(p.instanceId) : null]).sort((a,b) => a[1]*6+a[0]-b[1]*6-b[0]);
  assert.deepEqual(grid(decoded), grid(town));
  assert(visitUrl(town).length < 300);
  assert.equal(JSON.stringify(town), before, "Sharing must not mutate the player's save");
  return code;
};
roundTrip(fresh);
for (const branch of branches) {
  const town = structuredClone(fresh); town.branch = branch; town.completed = steps.map(s => s.id);
  town.name = "Štvrť Žofie – Ľúbime záhrady";
  town.roads = [];
  const available = Array.from({length:36}, (_,i)=>({x:i%6,y:Math.floor(i/6)})).filter(p=>!fixed.some(f=>f.x===p.x&&f.y===p.y));
  town.placed = [...structuredClone(fixed), ...Object.keys(catalog).filter(id=>!fixed.some(f=>f.id===id)).map((id,i)=>({id,instanceId:`round-${i}`,...available[i]}))];
  town.unlocked = Object.keys(catalog).filter(id=>catalog[id].kind === "decoration");
  roundTrip(town);
}
for (const name of ["界".repeat(40), "🌳".repeat(20), "Žilina Čičmany Ľúbica"]) roundTrip({...fresh,name});
const code = roundTrip(fresh);
for (const malformed of ["", "a".repeat(219), code+"=", code+"!", code.slice(1), `${code.slice(0,5)}${code[5]==="A"?"B":"A"}${code.slice(6)}`]) assert.equal(decodeVisit(malformed), null);
// Forge structurally incorrect payloads with a valid checksum: checksum alone cannot authorize a town.
function forge(change) {
  const bytes = Uint8Array.from(Buffer.from(code,"base64url")); change(bytes);
  const body=bytes.subarray(0,-4), digest=body.reduce((h,b)=>Math.imul(h^b,16777619)>>>0,2166136261);
  new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).setUint32(body.length,digest,true);
  return Buffer.from(bytes).toString("base64url");
}
for (const alter of [b=>b[0]=2,b=>b[1]=32,b=>b[3+2*6+2]=0,b=>b[3]=255,b=>b[3]=12,b=>b[39]=255,b=>b[1]=1]) assert.equal(decodeVisit(forge(alter)),null,"Reject unknown version/cells, missing anchor, locked culture, invalid UTF8 and inconsistent branch");
assert.throws(()=>encodeVisit({...fresh,name:"x".repeat(41)}));
console.log("verify-visit: round-trips, all objects/branches/house variants, Unicode and <300 chars; malformed/forged/locked snapshots rejected; player save unchanged.");
