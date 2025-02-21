const { task } = require('hardhat/config');
const { TASK_TEST_SETUP_TEST_ENVIRONMENT } = require('hardhat/builtin-tasks/task-names');
const { setCode } = require('@nomicfoundation/hardhat-network-helpers');

const fs = require('fs');
const path = require('path');

const INSTANCES = {
  // Entrypoint v0.7.0
  entrypoint: {
    address: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    abi: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../test/bin/EntryPoint070.abi'), 'utf-8')),
    bytecode: fs.readFileSync(path.resolve(__dirname, '../test/bin/EntryPoint070.bytecode'), 'hex'),
  },
  senderCreator: {
    address: '0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C',
    abi: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../test/bin/SenderCreator070.abi'), 'utf-8')),
    bytecode: fs.readFileSync(path.resolve(__dirname, '../test/bin/SenderCreator070.bytecode'), 'hex'),
  },
  // Arachnid's deterministic deployment proxy
  // See: https://github.com/Arachnid/deterministic-deployment-proxy/tree/master
  arachnidDeployer: {
    address: '0x4e59b44847b379578588920cA78FbF26c0B4956C',
    abi: [],
    bytecode:
      '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3',
  },
  // Micah's deployer
  micahDeployer: {
    address: '0x7A0D94F55792C434d74a40883C6ed8545E406D12',
    abi: [],
    bytecode: '0x60003681823780368234f58015156014578182fd5b80825250506014600cf3',
  },
};

task(TASK_TEST_SETUP_TEST_ENVIRONMENT).setAction((_, env, runSuper) =>
  runSuper().then(() =>
    Promise.all(
      Object.entries(INSTANCES).map(([name, { address, abi, bytecode }]) =>
        setCode(address, '0x' + bytecode.replace(/0x/, '')).then(() =>
          env.ethers.getContractAt(abi, address).then(instance => (env[name] = instance)),
        ),
      ),
    ),
  ),
);
