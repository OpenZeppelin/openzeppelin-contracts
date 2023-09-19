const shouldBehaveLikeProxy = require('../Proxy.behaviour');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');

contract('ERC1967Proxy', function (accounts) {
  // `undefined`, `null` and other false-ish opts will not be forwarded.
  const createProxy = async function (implementation, initData, opts) {
    return ERC1967Proxy.new(implementation, initData, ...[opts].filter(Boolean));
  };

  shouldBehaveLikeProxy(createProxy, accounts);
});
