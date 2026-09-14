import data from './party-profiles.json';
export type Personality = {id:string;name:string;role:string;bio:string;photo:string;source:string;imageSource:string};
export type PartyProfile = {tags:string[];summary:string;source:string;verified:string;people:Personality[]};
export const partyProfiles:Record<string,PartyProfile> = data;
