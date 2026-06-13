(function () {
  const MODE_KEY = "antora-theme-mode";
  const LEGACY_KEY = "antora-theme";
  const SYSTEM_SNAPSHOT_KEY = "antora-theme-system-snapshot";
  const html = document.documentElement;
  const darkThemeClass = "dark-theme";
  const systemMq = window.matchMedia("(prefers-color-scheme: dark)");

  function systemPreferenceLabel() {
    return systemMq.matches ? "dark" : "light";
  }

  function captureSystemSnapshot() {
    localStorage.setItem(SYSTEM_SNAPSHOT_KEY, systemPreferenceLabel());
  }

  function clearSystemSnapshot() {
    localStorage.removeItem(SYSTEM_SNAPSHOT_KEY);
  }

  function getMode() {
    const m = localStorage.getItem(MODE_KEY);
    if (m === "system" || m === "dark" || m === "light") return m;
    const leg = localStorage.getItem(LEGACY_KEY);
    if (leg === "dark" || leg === "light") {
      localStorage.setItem(MODE_KEY, leg);
      localStorage.removeItem(LEGACY_KEY);
      captureSystemSnapshot();
      return leg;
    }
    return "system";
  }

  function applyVisibleTheme() {
    const mode = getMode();
    let useDark;
    if (mode === "system") {
      useDark = systemMq.matches;
    } else {
      useDark = mode === "dark";
    }
    if (useDark) {
      html.classList.add(darkThemeClass);
    } else {
      html.classList.remove(darkThemeClass);
    }
    updateToggleLabel();
  }

  function setMode(next) {
    if (next === "system") {
      localStorage.setItem(MODE_KEY, "system");
      clearSystemSnapshot();
    } else {
      localStorage.setItem(MODE_KEY, next);
      captureSystemSnapshot();
    }
    applyVisibleTheme();
  }

  function expireOverrideIfSystemChanged() {
    const mode = getMode();
    if (mode === "system") return;
    const snapshot = localStorage.getItem(SYSTEM_SNAPSHOT_KEY);
    if (!snapshot) {
      captureSystemSnapshot();
      return;
    }
    if (snapshot !== systemPreferenceLabel()) {
      setMode("system");
    }
  }

  function onSystemThemeChange() {
    const mode = getMode();
    if (mode === "system") {
      applyVisibleTheme();
      return;
    }
    expireOverrideIfSystemChanged();
  }

  function applyInitialTheme() {
    expireOverrideIfSystemChanged();
    applyVisibleTheme();
    if (typeof systemMq.addEventListener === "function") {
      systemMq.addEventListener("change", onSystemThemeChange);
    } else {
      systemMq.addListener(onSystemThemeChange);
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        expireOverrideIfSystemChanged();
      }
    });
    window.addEventListener("focus", expireOverrideIfSystemChanged);
  }

  function isDark() {
    return html.classList.contains(darkThemeClass);
  }

  function updateToggleLabel() {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    if (isDark()) {
      toggle.innerHTML =
        '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      toggle.setAttribute("aria-label", "Switch to light mode");
    } else {
      toggle.innerHTML =
        '<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      toggle.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  function toggleTheme() {
    setMode(isDark() ? "light" : "dark");
    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.blur();
  }

  function ensureToggleButton() {
    const selector = document.getElementById("theme-selector");
    if (selector) {
      selector.remove();
    }

    const existingToggle = document.getElementById("theme-toggle");
    if (existingToggle) {
      if (existingToggle.dataset.adtThemeBound !== "1") {
        existingToggle.dataset.adtThemeBound = "1";
        existingToggle.addEventListener("click", toggleTheme);
      }
      updateToggleLabel();
      return;
    }

    const navbarEnd = document.querySelector(".navbar .navbar-end");
    if (!navbarEnd) return;

    const button = document.createElement("button");
    button.id = "theme-toggle";
    button.className = "navbar-item theme-toggle";
    button.type = "button";
    button.addEventListener("click", toggleTheme);

    navbarEnd.insertBefore(button, navbarEnd.firstChild);
    updateToggleLabel();
  }

  function init() {
    applyInitialTheme();
    ensureToggleButton();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
