#!/usr/bin/env node

const fs = require('fs');

// SafeCast.sol
fs.writeFileSync('./contracts/utils/math/SafeCast.sol', require('./templates/SafeCast'));
