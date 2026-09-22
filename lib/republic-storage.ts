import { accrue, createTown, execute, readSave, slovakDay, type Command, type RepublicState } from "./republic.ts";

export const republicKey = "mandat:republic:v1:guest";
export type Snapshot = { state: RepublicState | null; raw: string | null; problem: "corrupt" | "unavailable" | null };
export type WriteResult = { ok: true; snapshot: Snapshot; message: string } | { ok: false; kind: "conflict" | "storage" | "rule"; message: string };
type StoragePort = Pick<Storage,"getItem"|"setItem">;
type Lock = <T>(job:()=>T|Promise<T>)=>Promise<T>;

// Storage is injected so failure/concurrency tests use the same adapter as the browser.
export function createLocalStore(port:StoragePort, locked:Lock, seed:number, today=slovakDay) {
  const fresh=createTown(today(),seed);
  function load():Snapshot {
    try {
      const raw=port.getItem(republicKey);
      if(raw===null)return {raw,state:structuredClone(fresh),problem:null};
      const state=readSave(JSON.parse(raw));
      return {raw,state,problem:state?null:"corrupt"};
    } catch {
      // Invalid JSON is distinguishable from a blocked storage API.
      try {return {raw:port.getItem(republicKey),state:null,problem:"corrupt"};}
      catch {return {raw:null,state:null,problem:"unavailable"};}
    }
  }
  async function write(expected:Snapshot,command:Command|null,reset=false):Promise<WriteResult> {
    return locked(()=>{
      try {
        if(port.getItem(republicKey)!==expected.raw)return {ok:false,kind:"conflict",message:"Štvrť sa zmenila v inej karte. Načítaj novší postup a zopakuj svoj ťah."} as WriteResult;
        if(!reset&&(!expected.state||expected.problem))return {ok:false,kind:"storage",message:"Uloženie nie je čitateľné. Najprv si stiahni zálohu alebo obnov prístup k úložisku."};
        let state=reset?createTown(today(),seed):expected.state!;
        let message="Uložené v tomto zariadení.";
        if(command) {
          const result=execute(state,command,today());
          if(!result.ok)return {ok:false,kind:"rule",message:result.message};
          state=result.state;message=result.message;
        } else state=accrue(state,today());
        if(reset&&expected.raw!==null) {
          // Back up before the explicit new start. Failure leaves the original untouched.
          port.setItem(republicKey+":backup",expected.raw);
          state.revision=(expected.state?.revision??0)+1;
        }
        const raw=JSON.stringify(state);
        if(raw!==expected.raw)port.setItem(republicKey,raw);
        return {ok:true,snapshot:{state,raw,problem:null},message};
      } catch {return {ok:false,kind:"storage",message:"Uloženie sa nepodarilo. Ťah sa nepotvrdil a pôvodný postup zostal zachovaný. Skús znova."};}
    });
  }
  return {load,write};
}
export function browserStore() {
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];
  const port:StoragePort={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
  // Snapshot comparison detects stale tabs; Web Locks provide atomic cross-tab writes.
  const locked:Lock = async <T>(job:()=>T|Promise<T>):Promise<T> => navigator.locks ? navigator.locks.request(republicKey,()=>job()) : job();
  return createLocalStore(port,locked,seed);
}
