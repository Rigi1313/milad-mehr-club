(() => {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  navigator.serviceWorker.register("./sw.js", { scope: "./" })
    .then(registration => {
      const showUpdate = () => {
        if (document.getElementById("pwa-update-box")) return;

        const box = document.createElement("div");
        box.id = "pwa-update-box";
        box.dir = "rtl";
        box.style.cssText = `
          position:fixed;
          left:16px;
          right:16px;
          bottom:20px;
          z-index:99999;
          background:#111936;
          color:#fff;
          padding:14px 16px;
          border-radius:16px;
          box-shadow:0 10px 30px rgba(0,0,0,.35);
          font-family:inherit;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
        `;

        box.innerHTML = `
          <span>نسخه جدید باشگاه آماده است.</span>
          <button id="pwa-update-btn"
            style="
              border:0;
              border-radius:10px;
              padding:9px 14px;
              background:#fff;
              color:#111936;
              font-weight:700;
              cursor:pointer;
            ">
            بروزرسانی
          </button>
        `;

        document.body.appendChild(box);

        document.getElementById("pwa-update-btn")
          .addEventListener("click", () => {
            if (registration.waiting) {
              registration.waiting.postMessage({
                type: "SKIP_WAITING"
              });
            }
          });
      };

      if (registration.waiting) showUpdate();

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdate();
          }
        });
      });

      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);
    })
    .catch(error => {
      console.warn("PWA service worker registration failed:", error);
    });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  const offlineBar = document.createElement("div");
  offlineBar.id = "pwa-offline-bar";
  offlineBar.dir = "rtl";
  offlineBar.textContent = "اتصال اینترنت برقرار نیست";

  offlineBar.style.cssText = `
    display:none;
    position:fixed;
    top:0;
    left:0;
    right:0;
    z-index:100000;
    background:#8b1e1e;
    color:#fff;
    text-align:center;
    padding:8px;
    font-family:inherit;
    font-size:13px;
  `;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(offlineBar);

    const updateOnlineStatus = () => {
      offlineBar.style.display =
        navigator.onLine ? "none" : "block";
    };

    updateOnlineStatus();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  });
})();
