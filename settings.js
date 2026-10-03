(() => {
  "use strict";
  let enabled = true;
  let revision = 0;
  let queued = false;
  const clickedAt = new WeakMap();
  const playerSelector = "#bilibili-player, #bilibiliPlayer, .bpx-player-container, .bilibili-player";
  const observedRoots = new WeakSet();
  function roots() {
    const result = [document];
    for (let index = 0; index < result.length; index++) {
      const root = result[index];
      if (!observedRoots.has(root)) {
        observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "aria-checked", "style"] });
        observedRoots.add(root);
      }
      for (const element of root.querySelectorAll("*")) {
        if (element.shadowRoot) result.push(element.shadowRoot);
      }
    }
    return result;
  }
  function visible(element) {
    return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
  }
  function clickOnce(element) {
    if (!visible(element)) return;
    const now = Date.now();
    if (now - (clickedAt.get(element) ?? -Infinity) < 1500) return;
    clickedAt.set(element, now);
    element.click();
  }
  function cancelAutoplay() {
    queued = false;
    if (!enabled) return;
    for (const root of roots()) {
      // A drawer may put the end screen outside the original player container.
      // These exact cancellation labels are safe to recognize across the page.
      for (const element of root.querySelectorAll("button, a, span, div")) {
        if (!/^取消(?:自动)?连播$/.test(element.textContent.trim())) continue;
        if (element.querySelector("button, a, span, div")) continue;
        clickOnce(element);
      }
      for (const player of root.querySelectorAll(playerSelector)) {
        // The end-screen countdown may start through timeupdate or an internal
        // player event instead of the native ended event. Cancel it through UI.
        // Only click switches with explicit evidence that they are enabled.
        for (const element of player.querySelectorAll(
          ".bpx-player-ctrl-setting-autoplay, .bpx-player-ctrl-setting-autopart, " +
          ".bilibili-player-video-btn-autoplay, [role='switch'], input[type='checkbox']"
        )) {
          const description = [element.textContent, element.getAttribute("aria-label"), element.getAttribute("title"), element.parentElement?.textContent].join(" ");
          if (!/自动连播|自动播放下一|自动切[换集]|播完.*下一|连续播放/.test(description)) continue;
          const checked = element.matches("input") ? element.checked :
            element.getAttribute("aria-checked") === "true" ||
            element.classList.contains("on") || element.classList.contains("active") ||
            !!element.querySelector("input:checked, [aria-checked='true'], .bpx-player-ctrl-setting-switch-on");
          if (checked) clickOnce(element);
        }
      }
    }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(cancelAutoplay);
  }
  function apply() {
    document.documentElement?.setAttribute("data-bili-no-autonext", enabled ? "on" : "off");
    schedule();
  }
  const observer = new MutationObserver(() => {
    if (document.documentElement && !document.documentElement.hasAttribute("data-bili-no-autonext")) apply();
    schedule();
  });
  observer.observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "aria-checked", "style"] });
  if (document.documentElement) apply();
  // Covers reused countdown elements and client-side navigation as well.
  setInterval(schedule, 500);
  // Register first so a setting change during startup is not missed.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabled) {
      revision++;
      enabled = changes.enabled.newValue !== false;
      apply();
    }
  });
  chrome.storage.local.get({ enabled: true }, (settings) => {
    if (revision !== 0) return;
    enabled = settings.enabled !== false;
    apply();
  });
})();
