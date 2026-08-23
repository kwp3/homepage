# Hearth — agent guide

Read this before changing anything here. This repo is Ken's personal instance of
[homepage](https://gethomepage.dev), a self-hosted dashboard of tiles. "Add X to
my homepage" almost always means **add a tile to a YAML file in `config/`** — it
does not mean writing React, and it does not need a rebuild.

Upstream's README.md describes the open-source project, not this instance.

## Where it runs

| | |
|---|---|
| Local | <http://localhost:3131> (not 3000 — Grafana owns that) |
| Tailnet | <https://siesta.rainbow-antares.ts.net> |
| Process | launchd agent `dev.homepage`, running `next start` |
| Config | `config/` — gitignored, live, hand-edited |
| Logs | `~/Library/Logs/homepage.log`, `config/logs/homepage.log` |

## The important part: config is live

`services.yaml`, `bookmarks.yaml` and `widgets.yaml` are re-read on every API
request. Edit the file, refresh the browser, done. **Do not rebuild or restart
for a config change.**

`settings.yaml` is the exception — it is baked into the statically generated
page, so after editing it:

```bash
curl -s localhost:3131/api/revalidate
```

Always check YAML parses before you call the job done. Empty array means clean:

```bash
curl -s localhost:3131/api/validate
```

## Add a service tile

Services go in `config/services.yaml`, grouped by section. Append to an existing
group unless asked for a new one.

```yaml
- Homelab:
    - Syncthing:
        href: http://127.0.0.1:8384/
        description: File sync
        icon: syncthing
        siteMonitor: http://127.0.0.1:8384/
```

- A new `icon:` needs `./scripts/fetch-icons.sh` and a restart — see [Icons](#icons).
- `siteMonitor` gives the tile an up/down dot. Add it when the target is an HTTP
  service that is expected to be running; omit it for external sites and for
  apps that are only launched on demand.
- Widgets (Grafana stats, *arr queues, etc.) are optional and per-service — look
  the service up at <https://gethomepage.dev/widgets/> before inventing keys.

### Groups and tabs

A group only appears on a tab if `layout:` in `settings.yaml` says so. Adding a
brand-new group means adding it there too:

```yaml
layout:
  Homelab:
    tab: Lab
    style: row
    columns: 3
```

A group with no `tab:` renders on every tab (that is how the `Setup` bookmark
group works). Tabs are linkable: `http://localhost:3131/#lab`.

## Add a bookmark

`config/bookmarks.yaml`. Note the shape — each bookmark's value is a **list
containing one map**, unlike services. Getting this wrong is the most common
mistake:

```yaml
- Developer:
    - My Repos:
        - icon: fab-github
          href: https://github.com/kwp3?tab=repositories
          abbr: MR
```

`abbr` is the two-letter fallback shown when an icon fails to load.

## Icons

Every icon set is served from `public/icons/` — this instance makes no CDN calls
for icons. After adding or changing any `icon:` in `config/`, run:

```bash
./scripts/fetch-icons.sh
```

It downloads what the config references, skips what it already has, and prints
`MISSING` for a name that does not exist upstream (usually a typo). **There is no
CDN fallback: an icon that was never fetched renders as nothing.**

Newly downloaded files need a restart before `next start` serves them — it
indexes `public/` at startup. No rebuild, just:

```bash
launchctl kickstart -k gui/501/dev.homepage
```

| Form | Example | Downloaded to | Source catalog |
|---|---|---|---|
| Bare name | `icon: grafana` | `public/icons/dashboard/png/` | [dashboard-icons](https://github.com/homarr-labs/dashboard-icons) — most self-hosted apps, try this first. `grafana.svg` picks the svg |
| `sh-` | `icon: sh-plex` | `public/icons/selfhst/png/` | [selfh.st/icons](https://selfh.st/icons/) |
| `mdi-` | `icon: mdi-brain` | `public/icons/mdi/` | [Material Design Icons](https://pictogrammers.com/library/mdi/) |
| `si-` | `icon: si-vercel` | `public/icons/si/` | [Simple Icons](https://simpleicons.org/) |
| `fas-` `far-` `fab-` | `icon: fas-gauge-high` | `public/icons/fa/` (symlink) | Font Awesome Free |
| Path | `icon: /icons/thing.png` | — | anything you drop in `public/` yourself |

`mdi`, `si` and `fa` icons are drawn as CSS masks, so they take the theme color
and accept a hex override: `mdi-radar-#f0d453`. Bare-name and `sh-` icons are
plain images that keep their brand colors.

Font Awesome is the one set that is not downloaded — `public/icons/fa` is a
gitignored symlink to a full checkout, so every FA icon works without fetching:

```bash
ln -s /Users/ken/dev/Font-Awesome/svgs public/icons/fa
```

The downloaded icon directories are gitignored too. On a fresh clone, recreate
the symlink and run `./scripts/fetch-icons.sh`.

## Linking to a Mac app

Tiles can launch local apps, not just URLs.

- App registers its own URL scheme → use it: `href: lmstudio://`, `obsidian://open`.
- App has no scheme → go through the local handler:
  `href: openapp://Open%20WebUI` (URL-encode spaces). It maps
  `openapp://<App Name>` to `open -a <App Name>` via `~/Applications/OpenApp.app`.
- To find out which case an app is, run `config/list-app-schemes.sh` — it prints
  a paste-ready entry for every installed app that has a scheme. Anything absent
  from that output needs `openapp://`.
- `file://` links are blocked from an `http://` page. To open a local file, use
  an editor scheme: `vscode://file/Users/ken/dev/homepage/config/services.yaml`.

## Changing the source code

Rare, and only if the request genuinely cannot be done in config. Source changes
DO need a rebuild and a restart:

```bash
pnpm build && launchctl kickstart -k gui/501/dev.homepage
```

Run `pnpm test` (vitest) and `pnpm lint` first. `pnpm dev` gives hot reload on
:3000, independent of the running instance.

`origin` is gethomepage/homepage; `fork` is kwp3/homepage. Work happens on the
`kwp3` branch, which carries local fixes (proxy timeouts, log rotation, anchored
`allowedEndpoints` regexes, `bookmarksStyle` in layout sections, the Font Awesome
prefixes, every icon set served locally) rebased on top of `origin/dev`. Add a test next to any new fix.

## Don't

- Don't open PRs or issues against gethomepage/homepage. These fixes stay local.
- Don't commit `config/` — it is gitignored on purpose.
- Don't add a host to the dashboard's URL without adding it to
  `HOMEPAGE_ALLOWED_HOSTS` in `~/Library/LaunchAgents/dev.homepage.plist`;
  middleware will reject the request otherwise.
