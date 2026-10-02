/** Fit the complete 640 × 480 board inside the available map pane, without cropping. */
export function fittedMapWidth(width:number,height:number):number {
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return 1;
  return Math.max(1,Math.floor(Math.min(width,height*640/480)));
}
