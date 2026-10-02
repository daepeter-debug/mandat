/** Fit the complete 640 × 480 board inside the available map pane, without cropping. */
export function fittedMapWidth(width:number,height:number):number {
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return 1;
  return Math.max(1,Math.floor(Math.min(width,height*640/480)));
}

/** Landscape camera uses the whole pane, preserving playable coordinates and aspect ratio.
 * Only the decorative terrain expands; the 36 plots and sprites never stretch. */
export function mapFrame(width:number,height:number,landscape:boolean,safeLeft=0) {
  if(!landscape||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
    return {x:-40,y:0,width:640,height:480,pixels:fittedMapWidth(width,height)};
  const inset=Number.isFinite(safeLeft)?Math.max(0,Math.min(safeLeft,width/3)):0;
  const scale=Math.min((width-inset)/640,height/400);
  const worldWidth=width/scale,worldHeight=height/scale;
  return {x:280-(width+inset)/2/scale,y:0,width:worldWidth,height:worldHeight,pixels:width};
}
