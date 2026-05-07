#!/usr/bin/env node

/**
 * Release script — bumps version, generates CHANGELOG.md, updates README badge,
 * commits, tags, and pushes.
 *
 * Pushing a `v*` tag triggers the `Match Day` GitHub Actions workflow which
 * builds and deploys to Firebase Hosting. Direct pushes to `main` only run
 * `Pre-Match Checks`.
 *
 * Usage:
 *   npm run release              # auto-bump from conventional commits
 *   npm run release -- 1.2.0     # explicit version
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const run = (cmd) =>
	execSync(cmd, {
		stdio: "inherit",
		env: { ...process.env, BROWSER: "none", GH_BROWSER: " ", GITHUB_TOKEN: "" },
	});

const manualVersion = process.argv[2];
const versionFlag = manualVersion ? ` --release-as ${manualVersion}` : "";

try {
	run(`npx changelogen --release --push${versionFlag}`);
} catch {
	// Ignore GitHub Release API errors — tag + changelog are sufficient.
}

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const version = pkg.version;

const today = new Date().toISOString().split("T")[0];
const changelog = readFileSync("CHANGELOG.md", "utf-8");
const dated = changelog.replace(`## v${version}`, `## v${version} (${today})`);
if (dated !== changelog) writeFileSync("CHANGELOG.md", dated);

const readme = readFileSync("README.md", "utf-8");
const updatedReadme = readme.replace(
	/!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]*\)/,
	`![Version](https://img.shields.io/badge/version-v${version}-blue)`,
);
if (updatedReadme !== readme) writeFileSync("README.md", updatedReadme);

run("git add README.md CHANGELOG.md");
run(
	`git commit -m "chore: update version badge and changelog date for v${version}" --allow-empty`,
);
run("git push");

console.log(`\nRelease v${version} complete — Match Day workflow will deploy on tag push.`);
