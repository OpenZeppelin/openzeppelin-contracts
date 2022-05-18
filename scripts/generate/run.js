#!/usr/bin/env node

const fs = require('fs');

// SafeCast.sol
fs.writeFileSync('./contracts/utils/math/SafeCast.sol', require('./templates/SafeCast'));
fs.writeFileSync('./contracts/mocks/SafeCastMock.sol', require('./templates/SafeCastMock'));
