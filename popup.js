"use strict";
const checkbox = document.getElementById("enabled");
const status = document.getElementById("status");
function show(enabled) {
  status.textContent = enabled ? "已开启：播完后停在当前视频" : "已关闭：使用网站原有连播设置";
}
chrome.storage.local.get({ enabled: true }, (settings) => {
  if (chrome.runtime.lastError) {
    status.textContent = "无法读取设置，请重新打开插件。";
    return;
  }
  checkbox.checked = settings.enabled !== false;
  checkbox.disabled = false;
  show(checkbox.checked);
});
checkbox.addEventListener("change", () => {
  const enabled = checkbox.checked;
  checkbox.disabled = true;
  chrome.storage.local.set({ enabled }, () => {
    checkbox.disabled = false;
    if (chrome.runtime.lastError) {
      checkbox.checked = !enabled;
      status.textContent = "保存失败，请重试。";
      return;
    }
    show(enabled);
  });
});
