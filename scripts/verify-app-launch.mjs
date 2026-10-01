import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { appLaunchScript } from "../lib/app-launch.ts";

function launch({ standalone = false, ios = false, type = "navigate", search = "?v=finance", noTiming = false } = {}) {
  let replacement = null;
  vm.runInNewContext(appLaunchScript, {
    URLSearchParams,
    window: {
      matchMedia: () => ({ matches: standalone }),
      location: { pathname: "/", search },
      history: { replaceState: (_state, _title, url) => { replacement = url; } },
    },
    navigator: { standalone: ios },
    performance: { getEntriesByType: () => noTiming ? [] : [{ type }] },
  });
  return replacement;
}

assert.equal(launch({ standalone: true }), "/", "Installed icon with stale finance URL opens home");
assert.equal(launch({ ios: true }), "/", "iOS standalone flag opens home");
assert.equal(launch({ ios: true, noTiming: true }), "/", "Older Safari without navigation timing opens home");
assert.equal(launch({ standalone: true, search: "?v=game&g=republic", type: "reload" }), null, "Game reload preserves the URL");
assert.equal(launch({ standalone: true, type: "back_forward" }), null, "History navigation is preserved");
assert.equal(launch({ search: "?v=game&g=republic" }), null, "Ordinary browser deep links remain playable");
assert.equal(launch({}), null, "Ordinary browser finance links remain shareable");
const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
assert.equal(manifest.start_url, "/");
for (const shortcut of manifest.shortcuts) {
  assert.equal(launch({ standalone: true, search: new URL(shortcut.url, "https://mandat.test").search }), null, "Explicit installed-app shortcut retains its destination");
}
console.log("PASS: installed icon home, iOS, missing navigation timing, reload, history, browser deep links and all manifest shortcuts.");
