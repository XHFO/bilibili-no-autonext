(() => {
  "use strict";
  const attribute = "data-bili-no-autonext";
  // Capture before the site's player receives completion events. Unlike pausing
  // near the end, this lets the current video play all the way to its last frame.
  window.addEventListener("ended", (event) => {
    if (document.documentElement?.getAttribute(attribute) === "off") return;
    if (!(event.target instanceof HTMLVideoElement)) return;
    // Drawer players can run on the homepage or in an embedded frame without
    // changing the top-level URL. Scope by the media element, not the URL.
    event.stopImmediatePropagation();
  }, true);
})();
