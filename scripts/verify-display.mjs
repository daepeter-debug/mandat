import assert from "node:assert/strict";
import { fittedMapWidth, mapFrame } from "../lib/republic-display.ts";

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

for(const [w,h] of [[654,390],[796,390],[477,320],[582,375],[910,430]]) {
  const frame=mapFrame(w,h,true),scale=frame.pixels/frame.width;
  assert.ok(Math.abs(frame.height*scale-h)<.001,"Camera fills pane vertically");
  assert.equal(frame.pixels,w,"Camera fills pane horizontally, without letterbox");
  for(let x=0;x<6;x++)for(let y=0;y<6;y++) {
    const cx=280+(x-y)*43,cy=100+(x+y)*24;
    assert.ok(cx-43>=frame.x&&cx+43<=frame.x+frame.width,"Every diamond fits horizontally");
    assert.ok(cy-84>=frame.y&&cy+24<=frame.y+frame.height,"Roof and plot fit vertically");
  }
  assert.deepEqual(frame,mapFrame(w,h,true));
}
assert.deepEqual(mapFrame(1000,700,false),{x:-40,y:0,width:640,height:480,pixels:933});
assert.ok(Number.isFinite(mapFrame(0,0,true).pixels));
for(const inset of [0,44,59]) {
  const f=mapFrame(477,375,true,inset),s=f.pixels/f.width;
  const leftPlotCentre=(65-f.x)*s,rightPlotCentre=(495-f.x)*s;
  assert.ok(leftPlotCentre>inset+56,"Leftmost plot centre clears zoom controls and notch");
  assert.ok(rightPlotCentre<477-64,"Rightmost plot centre clears construction controls");
}
console.log("PASS landscape: edge-to-edge scenery, undistorted playable grid and full roof/plot bounds.");
