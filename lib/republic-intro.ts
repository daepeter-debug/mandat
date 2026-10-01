import { connected, currentStep, execute, type Command, type ItemId, type Point, type RepublicState } from "./republic.ts";

const cells:Point[]=Array.from({length:36},(_,i)=>({x:i%6,y:Math.floor(i/6)}));
export type IntroPlacement={kind:"build";id:ItemId}|{kind:"move";id:ItemId;instanceId:string};

/** Suggestions are verified with the same commands and goals as the saved game. */
export function introSites(town:RepublicState,intent:IntroPlacement,today:string):Point[] {
  const step=currentStep(town);
  if(!step||!['school-yard','books'].includes(step.id))return [];
  return cells.filter(target=>{
    const command:Command=intent.kind==="move"?{type:"move",instanceId:intent.instanceId,target}:{type:"build",id:intent.id,target};
    const result=execute(town,command,today);
    if(!result.ok)return false;
    if(step.done(result.state))return true;
    // In the second project, moving the first park can create a place for a library.
    return step.id==="books"&&intent.kind==="move"&&connected(result.state,target)&&introSites(result.state,{kind:"build",id:"library"},today).length>0;
  });
}
