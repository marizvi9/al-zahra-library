// Runs in <head> before the page is shown (see layout.tsx). It hides the welcome
// intro if it was already shown in this browser tab, or if the visitor prefers
// reduced motion. If browser storage is unavailable, the intro is skipped.
// When the intro does play, it is held still ("intro-wait") until the emblem's font has
// downloaded, so the letters never appear in a stand-in font and then jump (seen on phones).
// It waits at most 1.5 seconds; if anything here fails, the intro simply plays straight away.
const KEY = "azl-intro-seen";
export const introScript = (brandFont: string) =>
  `try{var d=document.documentElement;if(sessionStorage.getItem("${KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro-done")}else{sessionStorage.setItem("${KEY}","1");` +
  `d.classList.add("intro-wait");var go=function(){d.classList.remove("intro-wait")};setTimeout(go,1500);` +
  `try{var f=${JSON.stringify(brandFont)};Promise.all([document.fonts.load("500 98px "+f),document.fonts.load("600 98px "+f)]).then(go,go)}catch(e){go()}}}catch(e){document.documentElement.classList.add("intro-done")}`;
