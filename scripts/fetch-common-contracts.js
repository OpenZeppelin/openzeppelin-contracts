#!/usr/bin/env node

// This script snapshots the bytecode and ABI for the `hardhat/common-contracts.js` script.
// - Bytecode is fetched directly from the blockchain by querying the provided client endpoint. If no endpoint is
//   provided, ethers default provider is used instead.
// - ABI is fetched from etherscan's API using the provided etherscan API key. If no API key is provided, ABI will not
//   be fetched and saved.
//
// The produced artifacts are stored in the `output` folder ('test/bin' by default). For each contract, two files are
// produced:
// - `<name>.bytecode` containing the contract bytecode (in binary encoding)
// - `<name>.abi` containing the ABI (in utf-8 encoding)

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { request } = require('undici');
const { hideBin } = require('yargs/helpers');
const { argv } = require('yargs/yargs')(hideBin(process.argv))
  .env('')
  .options({
    output: { type: 'string', default: 'test/bin/' },
    client: { type: 'string' },
    etherscan: { type: 'string' },
  });

// List of contract names and addresses to fetch
const config = {
  EntryPoint070: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  SenderCreator070: '0xEFC2c1444eBCC4Db75e7613d20C6a62fF67A167C',
  EntryPoint080: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
  SenderCreator080: '0x449ED7C3e6Fee6a97311d4b55475DF59C44AdD33',
};

Promise.all(
  Object.entries(config).flatMap(([name, addr]) =>
    Promise.all([
      argv.etherscan &&
        request(`https://api.etherscan.io/api?module=contract&action=getabi&address=${addr}&apikey=${argv.etherscan}`)
          .then(({ body }) => body.json())
          .then(({ result: abi }) => fs.writeFile(path.join(argv.output, `${name}.abi`), abi, 'utf-8', () => {})),
      ethers
        .getDefaultProvider(argv.client)
        .getCode(addr)
        .then(bytecode =>
          fs.writeFile(path.join(argv.output, `${name}.bytecode`), ethers.getBytes(bytecode), 'binary', () => {}),
        ),
    ]),
  ),
);
