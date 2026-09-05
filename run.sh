#!/bin/sh
set -eu
umask 0002
cd "$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
action="${1:-dev}"
if [ "$#" -gt 0 ]; then shift; fi
case "$action" in
  install) npm ci "$@" ;;
  dev|build|check|test|preview) npm run "$action" -- "$@" ;;
  *) printf 'Usage: %s [install|dev|build|check|test|preview]\n' "$0" >&2; exit 2 ;;
esac
