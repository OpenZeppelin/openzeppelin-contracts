const { task } = require('hardhat/config');
const { TASK_TEST_SETUP_TEST_ENVIRONMENT } = require('hardhat/builtin-tasks/task-names');
const { setCode } = require('@nomicfoundation/hardhat-network-helpers');

const fs = require('fs');
const path = require('path');

const INSTANCES = {
  // ERC-4337 Entrypoints
  entrypoint: {
    v07: {
      address: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      abi: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../test/bin/EntryPoint070.abi'), 'utf-8')),
      bytecode: fs.readFileSync(path.resolve(__dirname, '../test/bin/EntryPoint070.bytecode'), 'hex'),
    },
    v08: {
      address: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
      abi: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../test/bin/EntryPoint080.abi'), 'utf-8')),
      bytecode: fs.readFileSync(path.resolve(__dirname, '../test/bin/EntryPoint080.bytecode'), 'hex'),
    },
  },
  senderCreator: {
    v07: {
      address: '0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C',
      abi: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../test/bin/SenderCreator070.abi'), 'utf-8')),
      bytecode: fs.readFileSync(path.resolve(__dirname, '../test/bin/SenderCreator070.bytecode'), 'hex'),
    },
    v08: {
      address: '0x449ED7C3e6Fee6a97311d4b55475DF59C44AdD33',
      abi: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../test/bin/SenderCreator080.abi'), 'utf-8')),
      bytecode: fs.readFileSync(path.resolve(__dirname, '../test/bin/SenderCreator080.bytecode'), 'hex'),
    },
  },
  deployer: {
    // Arachnid's deterministic deployment proxy
    // See: https://github.com/Arachnid/deterministic-deployment-proxy/tree/master
    arachnid: {
      address: '0x4e59b44847b379578588920cA78FbF26c0B4956C',
      abi: [],
      bytecode:
        '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3',
    },
    // Micah's deployer
    micah: {
      address: '0x7A0D94F55792C434d74a40883C6ed8545E406D12',
      abi: [],
      bytecode: '0x60003681823780368234f58015156014578182fd5b80825250506014600cf3',
    },
  },
  eip2935: {
    address: '0x0000F90827F1C53a10cb7A02335B175320002935',
    abi: [],
    bytecode:
      '0x3373fffffffffffffffffffffffffffffffffffffffe14604657602036036042575f35600143038111604257611fff81430311604257611fff9006545f5260205ff35b5f5ffd5b5f35611fff60014303065500',
  },
};

const setup = (input, ethers) =>
  input.address && input.abi && input.bytecode
    ? setCode(input.address, '0x' + input.bytecode.replace(/0x/, '')).then(() =>
        ethers.getContractAt(input.abi, input.address),
      )
    : Promise.all(
        Object.entries(input).map(([name, entry]) => setup(entry, ethers).then(result => [name, result])),
      ).then(Object.fromEntries);

task(TASK_TEST_SETUP_TEST_ENVIRONMENT).setAction((_, env, runSuper) =>
  runSuper().then(() => setup(INSTANCES, env.ethers).then(result => Object.assign(env, result))),
);
