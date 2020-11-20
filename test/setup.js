const { deployRelayHub } = require('@openzeppelin/gsn-helpers');

before('deploy GSN RelayHub', async function () {
  const [defaultSender] = await web3.eth.getAccounts();
  await deployRelayHub(web3, { from: defaultSender });
});
