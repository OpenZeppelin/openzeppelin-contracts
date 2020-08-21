const { accounts, contract } = require('@openzeppelin/test-environment');

const shouldBehaveLikeUpgradeabilityProxy = require('./UpgradeabilityProxy.behaviour');
const shouldBehaveLikeAdminUpgradeabilityProxy = require('./AdminUpgradeabilityProxy.behaviour');

const AdminUpgradeabilityProxy = contract.fromArtifact('AdminUpgradeabilityProxy');

const ADMIN_LABEL = 'eip1967.proxy.admin';

describe('AdminUpgradeabilityProxy', function () {
  const [proxyAdminAddress, proxyAdminOwner] = accounts;

  const createProxy = async function (logic, admin, initData, opts) {
    return AdminUpgradeabilityProxy.new(logic, admin, initData, opts);
  };

  shouldBehaveLikeUpgradeabilityProxy(createProxy, proxyAdminAddress, proxyAdminOwner);
  shouldBehaveLikeAdminUpgradeabilityProxy(createProxy, accounts);
});
