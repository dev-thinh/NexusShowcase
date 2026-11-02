#!/bin/bash
set -euo pipefail
umask 077

if [ "$(id -un)" != nexusdeploy ]; then
  echo 'Dedicated deployment user required.' >&2
  exit 1
fi
if [[ ! ${SSH_ORIGINAL_COMMAND-} =~ ^deploy\ ([a-f0-9]{40})\ ([1-9][0-9]{0,19})$ ]]; then
  echo 'Only deploy SHA RUN_ID is permitted.' >&2
  exit 1
fi
sha=${BASH_REMATCH[1]}
run_id=${BASH_REMATCH[2]}
uid=$(id -u)

exec /usr/bin/env -i \
  HOME=/srv/nexusshowcase/home \
  USER=nexusdeploy LOGNAME=nexusdeploy LANG=C.UTF-8 \
  PATH=/opt/nexusshowcase/node/bin:/usr/bin:/bin \
  XDG_RUNTIME_DIR="/run/user/$uid" \
  DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$uid/bus" \
  /usr/bin/flock -n -E 75 /srv/nexusshowcase/deploy.lock \
  /opt/nexusshowcase/node/bin/node \
  /usr/local/libexec/nexusshowcase/deploy.mjs "$sha" "$run_id"
