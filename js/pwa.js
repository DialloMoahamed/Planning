/* Installation sur l'écran d'accueil + mode hors-ligne.
   Ne fonctionne qu'en https (ou localhost), pas en ouvrant le fichier directement. */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
let installEvent = null;
const installBtn = document.getElementById("install");
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvent = e; installBtn.hidden = false; });
window.addEventListener("appinstalled", () => { installBtn.hidden = true; installEvent = null; });
installBtn.addEventListener("click", async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null; installBtn.hidden = true;
});
