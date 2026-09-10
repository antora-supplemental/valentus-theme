'use strict'

/**
 * @deprecated Antora hubs: use `@antora-supplemental/page-edit` (baked Edit + icons)
 * and the `adt-vcs-icon-id` Handlebars helper for header marks. This script is no
 * longer loaded by Valentus footer-scripts; kept only for optional Download-button
 * replacement on Default UI leftovers.
 */
(function () {
  "use strict";

  function vcsIconIdFromUrl(url, unknownId) {
    const fallback = unknownId || "code";
    if (!url) return fallback;
    let host;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return fallback;
    }
    if (host === "github.com" || host === "raw.githubusercontent.com" || host === "github.dev" || host.endsWith(".github.com")) {
      return "github";
    }
    if (host === "bitbucket.org" || host.includes("bitbucket.")) return "bitbucket";
    if (host.includes("gitlab")) return "gitlab";
    if (host === "codeberg.org" || host.endsWith(".codeberg.page") || host.endsWith(".codeberg.org")) {
      return "codeberg";
    }
    if (host.includes("gitea")) return "gitea";
    if (host.includes("forgejo")) return "forgejo";
    if (host.includes("sourcehut") || host.endsWith("sr.ht") || host === "git.sr.ht") {
      return "sourcehut";
    }
    return fallback;
  }

  function vcsIconUrl(base, id) {
    const root = (base || ".").replace(/\/?$/, "/");
    return `${root}img/vcs/${id}.svg`;
  }

  function setVcsImageSrc(img, base, iconId) {
    img.onerror = function adtVcsPathRetry() {
      img.onerror = null;
      if (img.getAttribute("data-adt-vcs-path-retry") === "1") return;
      const altBase = document.querySelector("#site-script")?.dataset?.uiRootPath;
      if (!altBase || altBase === base) return;
      img.setAttribute("data-adt-vcs-path-retry", "1");
      img.src = vcsIconUrl(altBase, iconId);
    };
    img.src = vcsIconUrl(base, iconId);
  }

  function getUiBase() {
    const fromData = document.querySelector("#site-script")?.dataset?.uiRootPath;
    if (fromData) return fromData;
    return ".";
  }

  function getRepoUrl() {
    const meta = document.querySelector('meta[name="antora-repo-url"]');
    if (meta && meta.content) return meta.content;
    return null;
  }

  function buildVcsLogoWidget(repoUrl, id, base) {
    const iconId = id || "code";
    const wrapper = document.createElement("div");
    wrapper.className = "navbar-item vcs-repo-logo";
    const a = document.createElement("a");
    a.href = repoUrl || "#";
    a.className = "vcs-repo-link";
    a.setAttribute("aria-label", repoUrl ? "View repository" : "Repository");
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const logo = document.createElement("div");
    logo.className = "vcs-logo";
    const img = document.createElement("img");
    img.alt = "";
    img.width = 24;
    img.height = 24;
    img.className = "vcs-logo-img";
    setVcsImageSrc(img, base, iconId);
    logo.appendChild(img);
    a.appendChild(logo);
    wrapper.appendChild(a);
    return wrapper;
  }

  function replaceDownloadWithVcsLogo() {
    const downloadLink = document.querySelector(
      '.navbar .navbar-end a.button[href="#"], .navbar .navbar-end a.button.is-primary'
    );
    if (!downloadLink) return;
    if (!/Download/i.test(downloadLink.textContent || "")) return;
    const repoUrl = getRepoUrl();
    const iconId = repoUrl ? vcsIconIdFromUrl(repoUrl, "repo") : "code";
    const navbarEnd = document.querySelector(".navbar .navbar-end");
    if (!navbarEnd) return;
    const widget = buildVcsLogoWidget(repoUrl, iconId, getUiBase());
    const toReplace = downloadLink.closest(".control") || downloadLink.closest(".navbar-item") || downloadLink;
    toReplace.parentNode.replaceChild(widget, toReplace);
  }

  function init() {
    replaceDownloadWithVcsLogo();
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
