const fs = require('fs');
const { ethers } = require('ethers');
const { request } = require('undici');

const provider = ethers.getDefaultProvider(process.env.MAINNET_NODE);
const ETHERSCAN_API_KEY = process.env.ETHERSCAN;

const getBytecode = addr => provider.getCode(addr).then(ethers.getBytes);
const getABI = addr =>
  request(
    `https://api.etherscan.io/api?module=contract&action=getabi&address=${addr}&apikey=${ETHERSCAN_API_KEY}`,
  ).then(({ body }) => body.json().then(({ result }) => result));

Promise.all(
  Object.entries({
    EntryPoint070: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    SenderCreator070: '0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C',
    EntryPoint080: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
    SenderCreator080: '0x449ED7C3e6Fee6a97311d4b55475DF59C44AdD33',
  }).flatMap(([name, addr]) =>
    Promise.all([
      getABI(addr).then(abi => fs.writeFile(`test/bin/${name}.abi`, abi, 'utf-8', () => {})),
      getBytecode(addr).then(bytecode => fs.writeFile(`test/bin/${name}.bytecode`, bytecode, 'binary', () => {})),
    ]),
  ),
).catch(console.log);
