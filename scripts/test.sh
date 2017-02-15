#! /bin/bash

testrpc &
trpc_pid=$!
truffle test
kill -9 $trpc_pid

