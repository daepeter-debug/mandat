import type { festivalPostcardData } from "@/lib/republic-celebration";

type Card = NonNullable<ReturnType<typeof festivalPostcardData>>;
const FONT='"IBM Plex Sans Variable", "IBM Plex Sans", "Segoe UI", Arial, sans-serif';
function blobData(blob:Blob):Promise<string> {
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Obrázok sa nepodarilo načítať."));reader.readAsDataURL(blob);});
}
/** Freeze a clone: the interactive map and its live animation remain untouched. */
export async function clonePostcardMap(source:SVGSVGElement):Promise<string> {
  await document.fonts.ready;
  const clone=source.cloneNode(true) as SVGSVGElement;
  const originals=[source,...source.querySelectorAll<SVGElement>("*")],copies=[clone,...clone.querySelectorAll<SVGElement>("*")];
  const properties=["fill","fill-opacity","stroke","stroke-width","stroke-opacity","stroke-linecap","stroke-linejoin","stroke-dasharray","opacity","font-family","font-size","font-weight","text-anchor","transform","transform-origin","display","visibility"];
  originals.forEach((element,i)=>{
    const style=getComputedStyle(element);
    for(const property of properties) {
      const value=style.getPropertyValue(property).replace(/url\(["']?[^)]*#([^)'"\s]+)["']?\)/g,"url(#$1)");
      copies[i].style.setProperty(property,value);
    }
    copies[i].style.setProperty("animation","none");copies[i].style.setProperty("transition","none");
  });
  clone.querySelectorAll(".republic-input-layer,.republic-plot-grid,.republic-plot-selected,.republic-plot-suggested").forEach(el=>el.remove());
  clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("width","640");clone.setAttribute("height","480");
  clone.style.removeProperty("width");clone.style.removeProperty("min-width");
  const assets=new Map<string,Promise<string>>();
  await Promise.all(Array.from(clone.querySelectorAll("image")).map(async el=>{
    const href=el.getAttribute("href")??el.getAttributeNS("http://www.w3.org/1999/xlink","href");
    if(!href||href.startsWith("data:"))return;
    const url=new URL(href,location.href);
    if(url.origin!==location.origin)throw new Error("Pohľadnica obsahuje nedostupný obrázok.");
    if(!assets.has(url.href))assets.set(url.href,fetch(url.href).then(async r=>{
      if(!r.ok)throw new Error("Niektorý obrázok mapy sa nenačítal. Skús pohľadnicu znova.");
      return blobData(await r.blob());
    }));
    el.setAttribute("href",await assets.get(url.href)!);el.removeAttributeNS("http://www.w3.org/1999/xlink","href");
  }));
  return new XMLSerializer().serializeToString(clone);
}
function fit(ctx:CanvasRenderingContext2D,text:string,width:number) {
  const chars=Array.from(text);while(chars.length&&ctx.measureText(chars.join("")).width>width)chars.pop();
  return chars.length===Array.from(text).length?text:chars.slice(0,-1).join("")+"…";
}
function wrap(ctx:CanvasRenderingContext2D,text:string,width:number) {
  const lines:string[]=[];let line="";
  for(const word of text.split(" ")){const next=line?`${line} ${word}`:word;if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;}
  if(line)lines.push(line);return lines;
}
function star(ctx:CanvasRenderingContext2D,x:number,y:number,filled:boolean) {
  ctx.beginPath();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=i%2?8:18,px=x+Math.cos(angle)*r,py=y+Math.sin(angle)*r;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}
  ctx.closePath();ctx.strokeStyle="#91632d";ctx.lineWidth=2;if(filled){ctx.fillStyle="#c4934e";ctx.fill();}else ctx.stroke();
}
export async function festivalPostcardImage(source:SVGSVGElement,card:Card):Promise<Blob> {
  const serialized=await clonePostcardMap(source),image=new Image();
  image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;await image.decode();
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Tento prehliadač nevie vytvoriť pohľadnicu.");
  const font=(weight:number,size:number)=>{ctx.font=`${weight} ${size}px ${FONT}`;};
  ctx.fillStyle="#f5f4ee";ctx.fillRect(0,0,1080,1350);
  ctx.fillStyle="#20392f";font(600,56);ctx.fillText(fit(ctx,card.town,968),56,90);
  font(500,30);ctx.fillText(fit(ctx,card.title,744),56,138);
  [0,1,2].forEach(i=>star(ctx,922+i*39,126,i<card.stars));
  ctx.save();ctx.beginPath();ctx.roundRect(36,170,1008,756,16);ctx.clip();ctx.drawImage(image,36,170,1008,756);ctx.restore();
  font(500,26);ctx.fillStyle="#4c614a";ctx.fillText(`Pohľadnica zo slávnosti · ${card.day.split("-").reverse().join(". ")}`,56,970);
  card.reactions.forEach((r,i)=>{
    const y=1016+i*84;
    font(600,26);ctx.fillStyle="#20392f";ctx.fillText(r.name,56,y);
    font(500,22);ctx.fillStyle="#4c614a";ctx.textAlign="right";ctx.fillText(`${r.mood}/5`,1024,y);ctx.textAlign="left";
    font(400,24);ctx.fillStyle="#354b3d";wrap(ctx,r.text,968).slice(0,2).forEach((line,j)=>ctx.fillText(line,56,y+32+j*28));
  });
  ctx.fillStyle="#bdc8b5";ctx.fillRect(56,1278,968,1);
  font(600,26);ctx.fillStyle="#20392f";ctx.fillText("Malá republika · mandát.",56,1320);
  const local=["localhost","127.0.0.1","[::1]"].includes(location.hostname);
  font(400,22);ctx.textAlign="right";ctx.fillText(fit(ctx,local?"mandat-preview.mandat.workers.dev":location.host,500),1024,1320);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Pohľadnicu sa nepodarilo uložiť. Skús znova.")),"image/png"));
}
export function downloadPostcard(blob:Blob,filename:string) {
  const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
