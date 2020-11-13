'use strict';

require('../../setup');

import { accounts } from '@openzeppelin/test-environment';

import Contracts from '../../../src/artifacts/Contracts';
import shouldBehaveLikeUpgradeabilityBeaconProxy from './UpgradeabilityBeaconProxy.behaviour';

const UpgradeabilityBeaconProxy = Contracts.getFromLocal('UpgradeabilityBeaconProxy');
const Beacon = Contracts.getFromLocal('Beacon');

describe('UpgradeabilityBeaconProxy', function() {
  const createBeacon = async function(logic, opts) {
    return Beacon.new(logic, opts);
  };

  const createProxy = async function(beacon, initData, opts) {
    return UpgradeabilityBeaconProxy.new(beacon, initData, opts);
  };

  shouldBehaveLikeUpgradeabilityBeaconProxy(createBeacon, createProxy, accounts);
});
