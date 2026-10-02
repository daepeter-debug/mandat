import assert from "node:assert/strict";
import { fittedMapWidth } from "../lib/republic-display.ts";

for(const [w,h] of [[615,275],[360,720],[1000,700],[48,30],[600,320]]){
  const fit=fittedMapWidth(w,h);
  assert.ok(fit<=w&&fit*480/640<=h,"Whole board fits both dimensions");
  assert.ok(Math.min(w,h*640/480)-fit<1,"Largest whole-board view");
}
assert.equal(fittedMapWidth(0,0),1);
assert.equal(fittedMapWidth(NaN,100),1);
assert.equal(fittedMapWidth(615,275),366);
assert.equal(fittedMapWidth(615,275),fittedMapWidth(615,275));
console.log("PASS display: whole board fits portrait, landscape, collapsed rail and resize; hidden pane handled.");
