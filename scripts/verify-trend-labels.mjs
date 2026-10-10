import assert from 'node:assert/strict';
import {trendLabelPositions} from '../lib/trend-labels.ts';
for(const height of[300,380,400]){
const rows=Array.from({length:12},(_,i)=>({id:String(i),value:i<2?20-i:8-i*.15}));
const original=structuredClone(rows),layout=trendLabelPositions(rows,0,25,height),ys=rows.map(r=>layout[r.id]);
assert.deepEqual(rows,original);assert.deepEqual(layout,trendLabelPositions([...rows].reverse(),0,25,height));
for(let i=0;i<ys.length;i++){assert.ok(ys[i]>=28&&ys[i]<=height-34);if(i)assert.ok(ys[i]-ys[i-1]>=Math.min(23,(height-62)/(rows.length-1))-.001);}
}
assert.deepEqual(trendLabelPositions([],0,25,300),{});
assert.ok(Number.isFinite(trendLabelPositions([{id:'zero',value:0}],0,0,300).zero));
console.log('PASS trend labels: dense endpoints never collide, bounds and order preserved, deterministic and data immutable.');
