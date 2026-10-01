// Spustenie z ikony môže na iOS použiť adresu, na ktorej bola ikona vytvorená.
// Úvod nastavíme pred hydratáciou. Reload a história zachovajú otvorenú sekciu;
// explicitné skratky z manifestu majú vlastný cieľ. Bežný prehliadač nemeníme.
export const appLaunchScript = `try{var appStandalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;var appNavigation=performance.getEntriesByType("navigation")[0];var appShortcut=new URLSearchParams(window.location.search).get("launch")==="shortcut";if(appStandalone&&(!appNavigation||appNavigation.type==="navigate")&&!appShortcut){window.history.replaceState(null,"",window.location.pathname)}}catch(e){}`;
