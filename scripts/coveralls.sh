#! /bin/bash

yarn run coverage && cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js

