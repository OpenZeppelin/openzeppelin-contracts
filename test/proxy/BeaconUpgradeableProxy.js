const shouldBehaveLikeBeaconUpgradeableProxy = require('./BeaconUpgradeableProxy.behaviour');

const BeaconUpgradeableProxy = artifacts.require('BeaconUpgradeableProxy');
const Beacon = artifacts.require('Beacon');

contract('BeaconUpgradeableProxy', function (accounts) {
  const createBeacon = async function (logic, opts) {
    return Beacon.new(logic, opts);
  };

  const createProxy = async function (beacon, initData, opts) {
    return BeaconUpgradeableProxy.new(beacon, initData, opts);
  };

  shouldBehaveLikeBeaconUpgradeableProxy(createBeacon, createProxy, accounts);
});
