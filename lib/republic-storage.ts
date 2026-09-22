import { createTown, readSave, slovakDay, type RepublicState } from "@/lib/republic";
const key="mandat:republic:v1:guest";
export function loadTown(){try{return readSave(JSON.parse(localStorage.getItem(key)??"null"),slovakDay())??createTown();}catch{return createTown();}}
export function saveTown(town:RepublicState){try{localStorage.setItem(key,JSON.stringify(town));return true;}catch{return false;}}
