#!/bin/bash
set -euo pipefail
umask 077
export PATH=/opt/nexusshowcase/node/bin:/usr/bin:/bin
export HOME=/srv/nexusshowcase/home
export NPM_CONFIG_CACHE=/srv/nexusshowcase/npm-cache
export NEXT_TELEMETRY_DISABLED=1
if [ "$(id -un)" != nexusdeploy ] || [ "$#" != 1 ]; then exit 1; fi
candidate=$(realpath -e -- "$1")
case "$candidate" in
  /srv/nexusshowcase/releases/*) ;;
  *) echo 'Invalid release directory.' >&2; exit 1 ;;
esac
cd "$candidate"
npm ci --no-audit --no-fund
node node_modules/prisma/build/index.js generate
npm run build
