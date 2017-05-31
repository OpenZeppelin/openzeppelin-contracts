#! /bin/bash

npm run coverage && cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js

