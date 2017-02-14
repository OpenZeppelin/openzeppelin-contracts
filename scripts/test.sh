#! /bin/bash

testrpc &
trpc_pid=$!
node_modules/truffle/cli.js test
kill -9 $trpc_pid

