const { range } = require('../../helpers');

const SIZES = range(1, 33).filter(size => size == 1 || size == 2 || size % 4 == 0);

module.exports = { SIZES };
