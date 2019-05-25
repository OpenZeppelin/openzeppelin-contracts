#!/usr/bin/env bash

OUTDIR=docs/api

rm -rf "$OUTDIR"
solidity-docgen -o "$OUTDIR" -i contracts/mocks -i contracts/examples
