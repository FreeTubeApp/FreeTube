# FreeTube as a PWA (self-hosted)

This directory turns the FreeTube web build into an installable Progressive Web App and runs it with Docker, together with its own Invidious instance as the backend.

| Service | Image | Port | Contents |
| --- | --- | --- | --- |
| `freetube` | `ghcr.io/b263/freetube-pwa` | 8080 | The PWA, served by nginx |
| `invidious` | `ghcr.io/b263/invidious-aio` | 3000 | Invidious, Invidious companion and PostgreSQL in a single container |

Both images are built for amd64 and arm64 by [`.github/workflows/pwa-images.yml`](../.github/workflows/pwa-images.yml) and published to the GitHub Container Registry.

## Setup

The server only needs `compose.yaml` and a `.env` file next to it:

```sh
INVIDIOUS_PUBLIC_URL=https://invidious.example.com
```

That's the only required setting (see `.env.example` for the optional ones, e.g. other ports). The secret keys of Invidious are generated on the first start, and FreeTube uses this Invidious instance by default, so nothing has to be configured per device.

```sh
docker compose up -d
```

The `pwa/` directory of a checkout works as well, e.g. to deploy from another machine through a Docker context:

```sh
docker --context homeserver compose -f pwa/compose.yaml up -d
```

## Updates

Nothing to do. The workflow checks every night and after every upstream sync whether an image has to be rebuilt: when files it is built from changed, or when one of its base images (Invidious, Invidious companion, PostgreSQL, nginx) has a new version. Unchanged images are not republished.

[Watchtower](https://containrrr.dev/watchtower/) then pulls new images and restarts the containers (both services have the `com.centurylinklabs.watchtower.enable` label). Without Watchtower, run `docker compose pull && docker compose up -d`.

Installed FreeTube clients notice a new version the next time they start or come back to the foreground, and then reload once automatically.

## HTTPS is required

Browsers only allow service workers and installing the app over HTTPS. The only exception is `localhost`. Put both containers behind a reverse proxy with TLS, for example [Caddy](https://caddyserver.com/), which obtains the certificates automatically:

```caddyfile
freetube.example.com {
	reverse_proxy localhost:8080
}

invidious.example.com {
	reverse_proxy localhost:3000
}
```

If Caddy runs in a container itself, use `host.docker.internal:8080` (Docker Desktop) or put Caddy and these containers into a shared Docker network and use `freetube:8080` and `invidious:3000`.

FreeTube can also run under a subpath (e.g. `https://example.com/freetube/`) if the proxy strips the prefix before forwarding. Invidious needs its own hostname.

Once the reverse proxy works, consider binding the ports to `127.0.0.1` or removing them, so the containers are only reachable through the proxy.

## One-time setup on GitHub

- **Default branch `master`:** GitHub only runs scheduled workflows and `workflow_run` triggers from workflow files on the default branch. With `development` as the default branch, neither the upstream sync nor the nightly image builds run.
- **Public packages:** after the first run of the workflow, set the visibility of the `freetube-pwa` and `invidious-aio` packages to public (your GitHub profile → Packages → package settings), so servers can pull them without credentials. The images contain no secrets.

## The Invidious container

`invidious/` builds a single image from the official [Invidious](https://quay.io/repository/invidious/invidious) and [Invidious companion](https://quay.io/repository/invidious/invidious-companion) images on top of the official PostgreSQL 17 image. [supervisord](http://supervisord.org/) runs the three processes:

- **PostgreSQL** only listens on `127.0.0.1` inside the container. The database and tables are created automatically on the first start.
- **Invidious companion** fetches the video streams from YouTube. Invidious proxies it under `/companion`, so only port 3000 is needed.
- **Invidious** gets restarted every hour (`INVIDIOUS_RESTART_INTERVAL`), as recommended by the [Invidious documentation](https://docs.invidious.io/installation/#post-install-configuration).

The `invidious-data` volume holds the database (`pgdata/`) and the generated keys (`secrets.env`). Keys set in `.env` (`INVIDIOUS_HMAC_KEY`, `INVIDIOUS_COMPANION_KEY`) take precedence.

`INVIDIOUS_PUBLIC_URL` sets Invidious' `domain`, `https_only` and `external_port`. Every other top-level Invidious option can be set with an environment variable named `INVIDIOUS_<OPTION IN UPPER CASE>`, e.g. `INVIDIOUS_REGISTRATION_ENABLED=false`, in the `environment` of the `invidious` service. See all options in the [example configuration](https://github.com/iv-org/invidious/blob/master/config/config.example.yml).

The image uses Invidious' `master` tag, because the `latest` tag is updated rarely and fixes for YouTube changes land in `master` first. The tags are build arguments in `invidious/Dockerfile`.

PostgreSQL's data directory is tied to its major version (17). If the base image is ever changed to a newer major version, the database has to be migrated (e.g. with `pg_dump` and a restore) or recreated. It only holds Invidious accounts (with their subscriptions and playlists) and caches, FreeTube keeps its own data in the browser.

Invidious needs at least 2 GB of free RAM and 20 GB of disk space. Video streams are proxied through your server, so its bandwidth limits playback.

## Limitations

The PWA is based on the FreeTube web build, which upstream considers experimental:

- **Invidious is the only backend.** Browsers block direct requests to YouTube (CORS), so the local API is not available. At the time of writing, hardly any public Invidious instance allows API access from browsers, which is why this setup includes its own instance.
- No downloads, no external players and no other features that require Electron.
- Data such as subscriptions, history and settings is stored in the browser (IndexedDB) and is not synced between devices. Use the export and import functions in the settings to move it.
- YouTube may block or rate-limit the IP address of your server, especially in data centres. That affects Invidious, not FreeTube.

## Development

Build the images locally instead of pulling them, from the repository root:

```sh
docker compose -f pwa/compose.yaml -f pwa/compose.build.yaml up -d --build
```

Or build only the PWA without Docker:

```sh
pnpm install
pnpm exec webpack --mode=production --config-node-env=production --config pwa/webpack.pwa.config.js
```

The output ends up in `dist/web` and can be served by any static web server. `sw.js` and `index.html` must not be cached for long by the HTTP cache, see `nginx.conf`. Without the Docker image, the default Invidious instance is set in `pwa-config.js`.

## Structure

All PWA files live in this directory, plus the workflow in `.github/workflows/pwa-images.yml`. **No upstream files are modified** and there are no additional npm dependencies, so upstream changes can be merged without conflicts.

| File | Purpose |
| --- | --- |
| `webpack.pwa.config.js` | Loads the upstream configuration `_scripts/webpack.web.config.js` and adds the PWA parts. |
| `FreeTubePwaPlugin.js` | Webpack plugin: replaces the old, non-functional PWA leftovers from upstream (`static/manifest.json`, `static/pwabuilder-sw.js`, the registration in `src/index.ejs`) and generates `sw.js` with the list of files to precache. |
| `patches/` | Fixes and adjustments of upstream code, applied at build time without changing the upstream files (`index.js` lists them). |
| `sw.js` | Service worker template: makes the app shell available offline, requests to other servers (Invidious, videos, thumbnails) go to the network unchanged. |
| `register-sw.js` | Registers the service worker, checks for updates and reloads after an update. |
| `pwa-config.js` | Runtime configuration (default Invidious instance). The Docker image generates it from `FREETUBE_DEFAULT_INVIDIOUS_INSTANCE`. |
| `manifest.webmanifest` | Web app manifest (name, icons, colours). |
| `Dockerfile`, `Dockerfile.dockerignore`, `nginx.conf` | FreeTube image. |
| `invidious/` | All-in-one Invidious image (Dockerfile, configuration, supervisord, start scripts). |
| `compose.yaml`, `compose.build.yaml`, `.env.example` | Running the images, building them locally. |

Changes in upstream that affect this setup break loudly instead of silently:

- If the HTML template `src/index.ejs` changes in a way that the old PWA leftovers are no longer recognised, the build fails with an error from `FreeTubePwaPlugin`.
- If the code a patch targets changes, the build shows a warning. Check whether the patch is still needed and update or remove it in `patches/index.js`.

### Current patches

- `relative-invidious-baseurl`: Invidious companion returns relative video URLs in DASH manifests, which made FreeTube fall back to low-quality legacy formats (360p). Worth fixing upstream in `repairInvidiousManifest()` (`src/renderer/helpers/player/utils.js`), the patch can be removed afterwards.
- `default-invidious-instance`: uses the Invidious instance from `pwa-config.js` as the default instead of a random public instance.
