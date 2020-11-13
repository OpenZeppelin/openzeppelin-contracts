import { accounts } from '@openzeppelin/test-environment';

import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeBeaconUpgradeableProxy from './BeaconUpgradeableProxy.behaviour';
import shouldBehaveLikeAdminBeaconUpgradeableProxy from './AdminBeaconUpgradeableProxy.behaviour';

const AdminBeaconUpgradeableProxy = artifacts.require('AdminBeaconUpgradeableProxy');
const Beacon = artifacts.require('Beacon');

describe('AdminBeaconUpgradeableProxy', function () {
  const createBeacon = async function (logic, opts) {
    return Beacon.new(logic, opts);
  };

  const createProxy = async function (beacon, initData, opts) {
    return AdminBeaconUpgradeableProxy.new(beacon, accounts[0], initData, opts);
  };

  const createProxyWithAdmin = async function (beacon, admin, initData, opts) {
    return AdminBeaconUpgradeableProxy.new(beacon, admin, initData, opts);
  };

  shouldBehaveLikeBeaconUpgradeableProxy(createBeacon, createProxy, accounts);
  shouldBehaveLikeAdminBeaconUpgradeableProxy(createBeacon, createProxyWithAdmin, accounts);
});
