// Runs in <head> before the page is shown (see layout.tsx). It hides the welcome
// intro if it was already shown in this browser tab, or if the visitor prefers
// reduced motion. If browser storage is unavailable, the intro is skipped.
const KEY = "azl-intro-seen";
export const introScript = `try{var d=document.documentElement;if(sessionStorage.getItem("${KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro-done")}else{sessionStorage.setItem("${KEY}","1")}}catch(e){document.documentElement.classList.add("intro-done")}`;
