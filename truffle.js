require('babel-register');
require('babel-polyfill');
module.exports = {
  networks: {
    test: {
      network_id: "*",
      host: "127.0.0.1",
      port: 8545 // the port that Ganache-cli exposes
    }
  }
};
