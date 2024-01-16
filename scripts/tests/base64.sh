#!/usr/bin/env bash

set -euo pipefail

_encode() {
  # - Print the input to stdout
  # - Remove the first two characters
  # - Convert from hex to binary
  # - Convert from binary to base64
  # - Remove newlines from `base64` output
  echo -n "$1" | cut -c 3- | xxd -r -p | base64 | tr -d \\n
}

encode() {
  # - Convert from base64 to hex
  # - Remove newlines from `xxd` output
  _encode "$1" | xxd -p | tr -d \\n
}

encodeURL() {
  # - Remove padding from `base64` output
  # - Replace `+` with `-`
  # - Replace `/` with `_`
  # - Convert from base64 to hex
  # - Remove newlines from `xxd` output
  _encode "$1" | sed 's/=//g' | sed 's/+/-/g' | sed 's/\//_/g' | xxd -p | tr -d \\n
}

# $1: function name
# $2: input
$1 $2
