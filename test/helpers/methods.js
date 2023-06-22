const { soliditySha3 } = require('web3-utils');

module.exports = {
  selector: signature => soliditySha3(signature).substring(0, 10),
};
