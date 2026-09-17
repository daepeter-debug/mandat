import data from './party-profiles.json';
// photo je prázdne, keď na Wikimedia Commons nie je voľne licencovaná fotografia; vtedy sa zobrazí monogram a imageNote vysvetlí prečo.
export type Personality = {id:string;name:string;role:string;bio:string;photo:string;source:string;imageSource:string;imageAuthor:string;imageLicense:string;imageLicenseUrl:string;imageYear:string;imageNote:string};
export type PartyProfile = {tags:string[];summary:string;source:string;verified:string;people:Personality[]};
export const partyProfiles:Record<string,PartyProfile> = data;
export const peopleImagesChecked = '2026-09-17';
export const peopleWithPhoto = () => Object.values(partyProfiles).flatMap(p => p.people).filter(p => p.photo);
export const peopleWithoutPhoto = () => Object.values(partyProfiles).flatMap(p => p.people).filter(p => !p.photo);
