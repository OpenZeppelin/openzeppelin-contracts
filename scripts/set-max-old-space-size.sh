#!/usr/bin/env bash

# This script sets the node `--max-old-space-size` to 8192 if it is not set already.
# All existing `NODE_OPTIONS` are retained as is.

case "${NODE_OPTIONS:-}" in
*"--max-old-space-size"*) ;;
*)
  # `--max-old-space-size` is not set, so we set it to 8192.
  export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=8192"
  ;;
esac
