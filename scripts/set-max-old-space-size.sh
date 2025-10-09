#!/usr/bin/env sh

# This script sets the node `--max-old-space-size` to 8192 if it is not set already.
# All existing `NODE_OPTIONS` are retained as is.

export NODE_OPTIONS="${NODE_OPTIONS:-}"

if [ "${NODE_OPTIONS##*--max-old-space-size*}" = "$NODE_OPTIONS" ]; then
  export NODE_OPTIONS="${NODE_OPTIONS} --max-old-space-size=8192"
fi
