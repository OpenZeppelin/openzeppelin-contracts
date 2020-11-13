'use strict';

require('../../setup');

import { accounts } from '@openzeppelin/test-environment';

import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeUpgradeabilityBeaconProxy from './UpgradeabilityBeaconProxy.behaviour';
import shouldBehaveLikeAdminUpgradeabilityBeaconProxy from './AdminUpgradeabilityBeaconProxy.behaviour';

const AdminUpgradeabilityBeaconProxy = Contracts.getFromLocal('AdminUpgradeabilityBeaconProxy');
const Beacon = Contracts.getFromLocal('Beacon');

describe('AdminUpgradeabilityBeaconProxy', function() {
  const createBeacon = async function(logic, opts) {
    return Beacon.new(logic, opts);
  };

  const createProxy = async function(beacon, initData, opts) {
    return AdminUpgradeabilityBeaconProxy.new(beacon, accounts[0], initData, opts);
  };

  const createProxyWithAdmin = async function(beacon, admin, initData, opts) {
    return AdminUpgradeabilityBeaconProxy.new(beacon, admin, initData, opts);
  };

  shouldBehaveLikeUpgradeabilityBeaconProxy(createBeacon, createProxy, accounts);
  shouldBehaveLikeAdminUpgradeabilityBeaconProxy(createBeacon, createProxyWithAdmin, accounts);
});
