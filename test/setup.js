const { defaultSender, web3 } = require('@openzeppelin/test-env');
const { deployRelayHub } = require('@openzeppelin/gsn-helpers');
const { GSNDevProvider } = require('@openzeppelin/gsn-provider');

before('deploy GSN RelayHub', async function () {
  await deployRelayHub(web3, { from: defaultSender });
});
