#!/usr/bin/env node
/**
 * After a semver release (vX.Y.Z), update rolling line aliases (vX, vX.Y) and
 * supported-lines.json (schema 2, dual-axis labels VALENTUS_SEMVER+antora.N).
 * Rolling releases are marked prerelease and never "latest".
 */
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = process.env.GITHUB_REPOSITORY || "antora-supplemental/valentus-theme";
const BASE = `https://github.com/${REPO}/releases/download`;
/** Antora framework major for this release line (override with ANTORA_MAJOR). */
const ANTORA_MAJOR = String(process.env.ANTORA_MAJOR || "3");

function sh(cmd, opts = {}) {
  const result = execSync(cmd, {
    encoding: "utf8",
    stdio: opts.silent ? "pipe" : "inherit",
    ...opts,
  });
  return typeof result === "string" ? result.trim() : "";
}

function shQuiet(cmd) {
  try {
    return sh(cmd, { silent: true });
  } catch {
    return "";
  }
}

function parseVersion(tag) {
  return tag.replace(/^v/, "").split("+")[0];
}

function compareSemver(a, b) {
  const pa = parseVersion(a).split(".").map(Number);
  const pb = parseVersion(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function isPureSemverTag(tag) {
  return /^v\d+\.\d+\.\d+$/.test(tag);
}

function allVersionTags() {
  const out = shQuiet('git tag -l "v[0-9]*.[0-9]*.[0-9]*"');
  return out ? out.split("\n").filter(isPureSemverTag) : [];
}

function highestInLine(tags, major, minor = null) {
  const filtered = tags.filter((t) => {
    const parts = parseVersion(t).split(".").map(Number);
    if (parts[0] !== major) return false;
    if (minor !== null && parts[1] !== minor) return false;
    return true;
  });
  return filtered.sort(compareSemver).at(-1) ?? "";
}

function minorLinesFromTags(tags, majorOnly = null) {
  const lines = new Set();
  for (const tag of tags) {
    const [ma, mi] = parseVersion(tag).split(".").map(Number);
    if (majorOnly !== null && ma !== majorOnly) continue;
    lines.add(`${ma}.${mi}`);
  }
  return [...lines].sort((a, b) => {
    const [ama, ami] = a.split(".").map(Number);
    const [bma, bmi] = b.split(".").map(Number);
    return ama - bma || ami - bmi;
  });
}

function publicLabel(version, antora = ANTORA_MAJOR) {
  return `${parseVersion(version)}+antora.${antora}`;
}

function lineEntry(tagName, version, antora = ANTORA_MAJOR) {
  const semver = parseVersion(version);
  const [valentus] = semver.split(".");
  return {
    tag: tagName,
    valentus: String(valentus),
    antora: String(antora),
    version: semver,
    label: publicLabel(semver, antora),
    current: semver,
    url: `${BASE}/${tagName}/ui-bundle.zip`,
  };
}

function updateRollingRelease(tagName, commitSha, assetPath, title, notes) {
  shQuiet(`gh release delete ${tagName} --yes --cleanup-tag -R ${REPO}`);
  const notesFile = join(tmpdir(), `adt-release-notes-${tagName}.md`);
  writeFileSync(notesFile, notes);
  try {
    sh(
      `gh release create ${tagName} "${assetPath}" --target ${commitSha} --title "${title}" --notes-file "${notesFile}" --prerelease --latest=false -R ${REPO}`,
    );
  } finally {
    unlinkSync(notesFile);
  }
}

function rollingNotes(major, minor, currentVersion) {
  const label = publicLabel(currentVersion);
  return [
    `Rolling release alias for the latest **v${major}.${minor}.x** patch (currently **${label}**, tag \`v${currentVersion}\`).`,
    "",
    "This Git tag and release move when a new patch ships within the line. They are marked prerelease so `releases/latest` still tracks normal semver releases.",
    "",
    `Pin in your playbook: \`${BASE}/v${major}.${minor}/ui-bundle.zip\``,
    "",
    "See `supported-lines.json` in the theme repository and the version pinning guide for consumer strategies.",
  ].join("\n");
}

function majorRollingNotes(major, currentVersion) {
  const label = publicLabel(currentVersion);
  return [
    `Rolling release alias for the latest **v${major}.x.x** release (currently **${label}**, tag \`v${currentVersion}\`).`,
    "",
    `This Git tag and release move when a new minor or patch ships within the Valentus v${major} major line. Marked prerelease so \`releases/latest\` still tracks normal semver releases.`,
    "",
    `Pin in your playbook: \`${BASE}/v${major}/ui-bundle.zip\``,
    "",
    `Prefer \`v${major}.{minor}\` when you want to stay on one minor line (for example \`v${major}.0\` for v${major}.0.x patches only).`,
  ].join("\n");
}

function readExistingSupported() {
  if (!existsSync("supported-lines.json")) return null;
  try {
    return JSON.parse(readFileSync("supported-lines.json", "utf8"));
  } catch {
    return null;
  }
}

const version = process.env.VERSION?.replace(/^v/, "").split("+")[0] || process.argv[2];
const sha =
  process.env.RELEASE_SHA ||
  shQuiet(`git rev-list -n 1 "v${version}"`) ||
  process.env.GITHUB_SHA ||
  shQuiet("git rev-parse HEAD");
const assetPath = process.argv[3] || "ui-bundle.zip";

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: post-release.mjs <X.Y.Z> [ui-bundle.zip]");
  process.exit(1);
}

const [major, minor] = version.split(".").map(Number);
const tags = allVersionTags();
const lineTag = `v${major}.${minor}`;
const lineHighest = highestInLine(tags, major, minor);
const lineHighestVersion = parseVersion(lineHighest);

console.log(
  `Post-release for v${version} label ${publicLabel(version)} (line ${major}.${minor} → ${lineHighestVersion})`,
);

updateRollingRelease(
  lineTag,
  sha,
  assetPath,
  `v${major}.${minor} line (rolling)`,
  rollingNotes(major, minor, lineHighestVersion),
);

const highestMajorTag = highestInLine(tags, major);
const highestMajorVersion = parseVersion(highestMajorTag);
if (highestMajorVersion === version) {
  updateRollingRelease(
    `v${major}`,
    sha,
    assetPath,
    `v${major} line (rolling)`,
    majorRollingNotes(major, highestMajorVersion),
  );
}

for (const line of minorLinesFromTags(tags, major)) {
  const [ma, mi] = line.split(".").map(Number);
  if (ma !== major || (ma === major && mi === minor)) continue;

  const highest = highestInLine(tags, ma, mi);
  if (!highest) continue;

  const highestVersion = parseVersion(highest);
  const highestSha = shQuiet(`git rev-list -n 1 ${highest}`);
  const tag = `v${ma}.${mi}`;
  const currentSha = shQuiet(`git rev-list -n 1 ${tag}`);

  if (currentSha === highestSha) {
    console.log(`Rolling tag ${tag} already at v${highestVersion}`);
    continue;
  }

  const tmp = mkdtempSync(join(tmpdir(), "adt-line-"));
  sh(`gh release download ${highest} -p ui-bundle.zip -D "${tmp}" -R ${REPO}`);
  updateRollingRelease(
    tag,
    highestSha,
    join(tmp, "ui-bundle.zip"),
    `v${ma}.${mi} line (rolling)`,
    rollingNotes(ma, mi, highestVersion),
  );
}

const prev = readExistingSupported();
const lines = { ...(prev?.lines || {}) };

for (const line of minorLinesFromTags(tags, major)) {
  const [ma, mi] = line.split(".").map(Number);
  const highest = highestInLine(tags, ma, mi);
  const current = parseVersion(highest);
  lines[line] = lineEntry(`v${ma}.${mi}`, current);
}

lines[String(major)] = lineEntry(`v${major}`, highestMajorVersion);

const historical = { ...(prev?.historical_labels || {}) };
for (const tag of tags) {
  const semver = parseVersion(tag);
  if (!(semver in historical)) {
    // Default: all known Valentus tags to date target Antora 3 unless already mapped.
    historical[semver] = publicLabel(semver, "3");
  }
}
historical[version] = publicLabel(version);

const latestAcross = tags.map(parseVersion).sort(compareSemver).at(-1) || highestMajorVersion;
const latestLabel =
  latestAcross === version
    ? publicLabel(version)
    : historical[latestAcross] || publicLabel(latestAcross, lines[String(latestAcross.split(".")[0])]?.antora || "3");

const supported = {
  schema: 2,
  updated: new Date().toISOString(),
  scheme: "VALENTUS_SEMVER+antora.N",
  latest: latestAcross,
  latest_label: latestLabel,
  latest_antora: String(latestAcross === version ? ANTORA_MAJOR : lines[String(latestAcross.split(".")[0])]?.antora || "3"),
  lines,
  historical_labels: historical,
  notes:
    "Git tags remain pure semver (vX.Y.Z). Public labels append +antora.N. Historical 1.x tags were not renamed; labels are documentary.",
};

writeFileSync("supported-lines.json", `${JSON.stringify(supported, null, 2)}\n`);
console.log("Wrote supported-lines.json");
