const { defaultSender, web3 } = require('@openzeppelin/test-environment');
const { deployRelayHub } = require('@openzeppelin/gsn-helpers');

before('deploy GSN RelayHub', async function () {
  await deployRelayHub(web3, { from: defaultSender });
});
