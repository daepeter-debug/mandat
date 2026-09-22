import type { Branch, ItemId } from "@/lib/republic";

const ink="#2d554a", cream="#faf1d9", shade="#d7c9a9", red="#ba674a", darkRed="#8f4539";
function Tree({x=0,y=0,small=false}:{x?:number;y?:number;small?:boolean}) {
  return <g transform={`translate(${x} ${y}) scale(${small?.65:1})`}><path d="M-1 3v-21" stroke="#83674b" strokeWidth="4"/><path d="M-16-20C-20-32-8-41 0-39 15-40 23-23 13-16 4-8-12-10-16-20Z" fill="#6d9365"/><path d="M-16-20C-19-28-12-37-5-38-12-27-9-19 1-13-7-10-15-13-16-20Z" fill="#50765a"/><path d="m0-24 0 11m0-5 7-7" stroke="#50765a" fill="none" strokeWidth="1.5"/></g>;
}
function Windows({y=-23,n=3,color="#547a7d"}:{y?:number;n?:number;color?:string}) {
  return <>{Array.from({length:n},(_,i)=><g key={i} transform={`translate(${-21+i*17} ${y})`}><rect width="8" height="11" rx="1" fill={color}/><path d="M4 0v11M0 5h8" stroke="#eee7d4" strokeWidth="1"/></g>)}</>;
}
function Building({roof=red,tall=false,wide=false,children}:{roof?:string;tall?:boolean;wide?:boolean;children?:React.ReactNode}) {
  return <g transform={wide?"scale(1.08 .95)":undefined}><path d={tall?"M-29-40 17-47 31-37v40L-15 10-29 1Z":"M-29-29 17-36 31-26v29L-15 10-29 1Z"} fill={cream}/>
    <path d={tall?"M17-47 31-37v40L17 7Z":"M17-36 31-26v29L17 7Z"} fill={shade}/>
    <path d={tall?"m-33-40 18-21 50 13-17 12Z":"m-33-29 18-21 50 13-17 12Z"} fill={roof}/>
    <path d={tall?"m-33-40 18-21v17L-15-24Z":"m-33-29 18-21v17L-15-13Z"} fill={darkRed}/>
    <path d="M-31 2-15 12 33 5" stroke="#b3ae90" strokeWidth="2" fill="none"/>
    {children}</g>;
}
export function TownPiece({id,branch=null,finished=false,variant=0}:{id:ItemId;branch?:Branch|null;finished?:boolean;variant?:number}) {
  if(id==="park"||id==="garden"||id==="linden")return <g>
    <path d="M-38 1-3-18 37 0 1 21Z" fill="#9eb880"/><path d="M-24 7 7-9M-6 16 23 0" stroke="#e3d7b5" strokeWidth="5"/>
    {id==="garden"?<><path d="m-25-3 13-7 12 6-14 7Zm15 11 13-7 12 6-14 7Z" fill="#826648"/>{[-18,-7,3,14].map((x,i)=><g key={x} transform={`translate(${x} ${i%2?4:-5})`}><path d="M0 0v-7" stroke="#537a4f" strokeWidth="2"/><circle cy="-8" r="3" fill={i%2?"#d69776":"#9ab864"}/></g>)}<Tree x={22} y={-7} small/></>:<><Tree x={-11} y={-5}/>{id==="park"&&<Tree x={18} y={6} small/>}</>}</g>;
  if(id==="plaza")return <g><path d="M-37 0 0-20 37 0 0 20Z" fill="#e8dcc2"/><path d="m-22 0 22-12 22 12-22 12Z" fill="#c9c4ac"/><ellipse cy="1" rx="14" ry="7" fill="#b6c9c0"/><ellipse cy="-2" rx="12" ry="6" fill="#82aba4"/><path d="M0-4v-12" stroke="#f0f5e9" strokeWidth="3"/><circle cy="-16" r="3" fill="#eef5e7"/></g>;
  if(id==="bench")return <g><path d="m-23-6 32-8 13 7-32 8Z" fill="#b38c53"/><path d="M-19-7v-12l31-8v12Z" fill="#c49e69"/><path d="M-18-1v9M15-8v9" stroke={ink} strokeWidth="3"/></g>;
  if(id==="flower-bed")return <g><path d="m-30 0 29-16 30 15L0 15Z" fill="#b09b7d"/><path d="m-25-2 24-12 24 12L0 10Z" fill="#708361"/>{[-16,-5,7,17].map((x,i)=><g key={x} transform={`translate(${x} ${i%2?-4:0})`}><path d="M0 4V-8" stroke="#416b47" strokeWidth="2"/><circle cy="-9" r="5" fill={i%2?"#eabf77":"#c67b79"}/><circle cy="-9" r="1.5" fill={cream}/></g>)}</g>;
  if(id==="fountain")return <g><ellipse rx="29" ry="14" fill="#c1c9b4"/><ellipse cy="-4" rx="25" ry="12" fill="#6eaba8"/><path d="M-5-5v-22H5v22" fill="#e1dfc8"/><ellipse cy="-25" rx="14" ry="6" fill="#dfdbc3"/><path d="M0-28v-12m0 0c-10 0-11 11-12 16m12-16c10 0 11 11 12 16" stroke="#90c2bf" strokeWidth="2" fill="none"/></g>;
  if(id==="book-kiosk")return <g><path d="M-13 4v-40l25-6v40Z" fill="#d5bc85"/><path d="m-17-37 15-14 19 10-4 6Z" fill="#5e7b78"/><path d="M-8-30 6-33v24L-8-6Z" fill="#50766a"/>{[-26,-17].map(y=><g key={y}><path d={`M-7 ${y} 6 ${y-3}`} stroke={cream}/><path d={`M-5 ${y}v-6m4 5v-6m4 5v-6`} stroke="#d7a178" strokeWidth="2"/></g>)}</g>;
  if(id==="pergola"||id==="ceremonial-gate")return <g><path d="M-24 4v-35M24 4v-35M-9 12v-35" stroke={id==="pergola"?"#b59971":"#d3c2a0"} strokeWidth="5"/><path d="m-30-34 24-13 36 16-23 13Z" fill={id==="pergola"?"#829768":"#bc915c"}/><path d="m-24-35 35 17m-23-23 35 17" stroke={cream} strokeWidth="2"/>{id==="ceremonial-gate"&&<><path d="M-24-32Q0-2 24-32" fill="none" stroke="#ba694d" strokeWidth="2"/><path d="m-14-23 4 9 4-5m8 1 5 6 3-10" fill="#b9664c"/></>}</g>;
  if(id==="clock")return <g><path d="M-13 6v-50l15-8 15 8v44L2 13Z" fill="#e5d5ae"/><path d="M2-52 17-44v44L2 13Z" fill="#bca983"/><path d="m-17-45 18-22 21 17-5 6-15-8Z" fill="#638574"/><circle cx="-5" cy="-31" r="8" fill={cream}/><path d="M-5-36v5l4 2" stroke={ink} strokeWidth="1.5"/></g>;
  if(id==="bandstand")return <g><ellipse cy="5" rx="31" ry="14" fill="#cebda0"/><path d="M-22 1v-29M22 1v-29M0 12v-29" stroke="#dbd2b5" strokeWidth="3"/><path d="m-33-26 32-25 34 25-34 13Z" fill="#6f9385"/><path d="M-1-51v-8" stroke="#aa854a" strokeWidth="2"/></g>;
  if(id==="sculpture")return <g><path d="m-17 4 17-9 18 9-18 10Z" fill="#c2b49b"/><path d="M-10 4v-15l12-6 10 6v15L2 9Z" fill="#e1d7bd"/><path d="M0-16c-31-19-10-41 5-41 24 8-8 16-7 28 0 7 9 9 13 10Z" fill="#628b7e"/></g>;
  if(id==="observatory")return <g><path d="M-28-5v-22h56v22L0 9Z" fill="#e6ddc3"/><path d="M0-27h28v22L0 9Z" fill="#c2b995"/><path d="M-29-27a29 28 0 0 1 58 0Z" fill="#709c9a"/><path d="M-5-55Q12-49 9-27" stroke="#cfdfca" strokeWidth="3" fill="none"/><path d="m8-42 18-12 5 7-18 12Z" fill="#d3b170"/><path d="M-8-8v-14H3v20" fill={ink}/><circle cx="-17" cy="-21" r="3" fill="#a9cabf"/></g>;
  if(id==="glasshouse")return <g><path d="M-30-5v-26L0-50 30-30v27L0 13Z" fill="#b9d3bd"/><path d="M0-50 30-30v27L0 13v-42Z" fill="#87b4ac"/><path d="M-30-31 0-12 30-30M0-50v63M-16-41v44M16-40v44M-30-17 0 2 30-16" fill="none" stroke="#e5e4c9" strokeWidth="2"/><path d="M-25 1c-3-20 11-30 13-3m18 10c-1-20 9-27 13-10" stroke="#5e8b66" strokeWidth="5" fill="none"/></g>;
  if(id==="school")return <Building wide><Windows/><path d="M-5 7v-16H6V5" fill="#976c48"/><path d="M-5-41v-18h14v20" fill="#e9dabe"/><path d="m-9-58 10-8 12 8Z" fill={red}/><circle cx="2" cy="-51" r="4" fill={cream}/><path d="M2-53v3l2 1" stroke={ink} strokeWidth="1"/><path d="M28-18v-17m0 0h11l-4 5h-7" stroke="#617e6a" fill="#b98b52" strokeWidth="1.5"/></Building>;
  if(id==="library"||id==="culture")return <Building roof="#64817e" tall><Windows y={-31}/><path d="M-12 8v-16H5V5" fill="#759082"/><path d="m-17-9 15-11 14 6-11 6Z" fill="#e4cb8b"/>{id==="library"?<path d="M-4-25v-9m0 2c-4-4-8-3-8-3v7c4 0 6 1 8 3 2-3 5-4 9-5v-7s-5 1-9 5" fill="#d3af61"/>:<path d="M-10-29c-2-9 2-11 6-8 5-4 11-3 11 4 0 13-16 16-17 4Z" fill="#c48a68"/>}</Building>;
  if(id==="clinic")return <g><Building roof="#7e9b8b" wide><Windows y={-23} n={2}/><path d="M10 5v-22h12V3" fill="#6b9290"/></Building><path d="M-22-37v-16h17v16Z" fill={cream}/><path d="M-14-50v10m-5-5h10" stroke="#bb6958" strokeWidth="3"/><path d="m-13 14 20-11 15 5-21 10Z" fill="#ddd3ba"/></g>;
  if(id==="market")return <g><path d="M-29 2v-28M28 2v-28" stroke="#94744e" strokeWidth="3"/><path d="m-35-25 20-18 49 17-19 12Z" fill="#eee0bc"/>{[-20,-4,12].map(x=><path key={x} d={`m${x}-36 12 4-14 18-12-4Z`} fill="#b57858"/>)}<path d="M-25-7 9-15 26-5 0 7Z" fill="#9c7549"/><path d="M-25-7v10L0 16V7Z" fill="#c49d68"/><path d="M0 7 26-5v9L0 16Z" fill="#ac8356"/><circle cx="-13" cy="-7" r="4" fill="#97ae68"/><circle cx="-3" cy="-7" r="4" fill="#ce9c58"/><circle cx="8" cy="-7" r="4" fill="#b3634a"/></g>;
  if(id==="workshop")return <Building roof="#737773"><Windows n={1}/><path d="M-6 7v-24l22-4V5Z" fill="#997747"/><path d="M-3-14h16M-3-7h16M5-18V7" stroke="#70573b" strokeWidth="1"/><path d="M16-39v-25h9v28" fill="#b78165"/><path d="m14-64 10-4 4 3-3 4Z" fill="#685d4d"/></Building>;
  if(id==="town-hall")return <Building roof="#5c7e70" tall><Windows y={-30}/><path d="M-9 8v-17H5V5" fill="#916e4b"/><path d="M-5-50v-23l12-6 10 6v24Z" fill="#e8dab6"/><path d="m-10-72 16-17 16 17-15 5Z" fill="#4d7467"/><circle cx="2" cy="-62" r="5" fill={cream}/><path d="M2-65v4l3 1" stroke={ink} strokeWidth="1"/><path d="M7-89v-9m0 0 13 3-13 3Z" fill="#c09258" stroke="#a77e48" strokeWidth="1"/></Building>;
  if(id==="station") {
    const tone=branch==="museum"?"#618387":branch==="market-hall"?"#b58a52":branch==="community-hall"?"#759565":"#8c8070";
    return <g><path d="m-39 4 46-19 34 17-43 23Z" fill="#c7b997"/><Building wide roof={tone}><Windows n={2} color={branch?"#63837d":"#827b69"}/><path d="M9 6v-26h16V3Z" fill={branch?"#526e65":"#94826b"}/>{!branch&&<path d="m10-15 14 12m-14 2 14-14" stroke="#bda582" strokeWidth="3"/>}</Building>
      {branch==="museum"&&<><path d="M-10-40v-20H8v19" fill="#e8dfc7"/><circle cy="-51" r="6" fill="#c4a165"/><path d="M0-54v4l3 1" stroke={ink}/></>}
      {branch==="market-hall"&&<><path d="m-28-13 29-9 14 9-32 10Z" fill="#e6c58f"/><path d="m-20-15 6-2 14 10-6 2m-1-15 6-2 14 10-6 2" fill="#b77a54"/></>}
      {branch==="community-hall"&&<><Tree x={-31} y={9} small/><path d="M-18-21Q3-8 29-24" fill="none" stroke="#a17c4f"/><path d="m-7-17 4 6 3-5m7-1 4 5 3-6" fill="#b78058"/></>}
      {finished&&<path d="M-35-35Q0-15 35-35m-60 6 4 9 4-7m10 2 4 9 4-9m10-2 4 7 4-9" fill="#c49b55" stroke="#c49b55" strokeWidth="1"/>}
    </g>;
  }
  return <Building roof={variant%3===1?"#9b7560":variant%3===2?"#b18553":red}><Windows n={2}/><path d="M11 5v-17h10V3" fill="#866b4a"/><path d="M11-39v-14h7v15" fill="#d6b18b"/><path d="M-26-5h13v4h-13Z" fill="#5d815d"/><circle cx="-22" cy="-6" r="2" fill="#d7ad75"/></Building>;
}
export default function RepublicArt({id,branch=null,finished=false}:{id:ItemId;branch?:Branch|null;finished?:boolean}) {
  return <svg viewBox="-48 -102 96 130" className="republic-art" aria-hidden="true"><ellipse cy="13" rx="35" ry="11" fill="#415b3a" opacity=".1"/><TownPiece id={id} branch={branch} finished={finished}/></svg>;
}

