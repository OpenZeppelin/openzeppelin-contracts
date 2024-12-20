const { task } = require('hardhat/config');
const { TASK_TEST_SETUP_TEST_ENVIRONMENT } = require('hardhat/builtin-tasks/task-names');
const { setCode } = require('@nomicfoundation/hardhat-network-helpers');

const fs = require('fs');
const path = require('path');

const INSTANCES = {
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
