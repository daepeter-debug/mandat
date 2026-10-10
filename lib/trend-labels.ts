/** Ordered label placement only; never changes a party's value or the plotted curve. */
export function trendLabelPositions(rows: {id:string;value:number}[], min:number, max:number, height:number): Record<string,number> {
  const top=28,bottom=height-34,span=bottom-top;
  const sorted=[...rows].sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));
  const gap=Math.min(23,span/Math.max(1,sorted.length-1));
  const ys=sorted.map(r=>Math.max(top,Math.min(bottom,top+(max-r.value)/Math.max(1,max-min)*span)));
  for(let i=1;i<ys.length;i++)ys[i]=Math.max(ys[i],ys[i-1]+gap);
  if(ys.length&&ys.at(-1)!>bottom){ys[ys.length-1]=bottom;for(let i=ys.length-2;i>=0;i--)ys[i]=Math.min(ys[i],ys[i+1]-gap);}
  return Object.fromEntries(sorted.map((r,i)=>[r.id,ys[i]]));
}
