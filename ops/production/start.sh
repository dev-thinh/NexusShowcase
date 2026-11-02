#!/bin/bash
set -euo pipefail
export PATH=/opt/nexusshowcase/node/bin:/usr/bin:/bin
export NODE_ENV=production
export NEXUS_RELEASE_SHA
NEXUS_RELEASE_SHA=$(cat .release-sha)
if [[ ! $NEXUS_RELEASE_SHA =~ ^[a-f0-9]{40}$ ]]; then
  echo 'Missing or invalid release marker.' >&2
  exit 1
fi
exec /opt/nexusshowcase/node/bin/node \
  node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100
