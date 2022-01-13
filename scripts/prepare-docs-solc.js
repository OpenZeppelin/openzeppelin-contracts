const hre = require('hardhat');

const { getCompilersDir } = require('hardhat/internal/util/global-dir');
const { CompilerDownloader } = require('hardhat/internal/solidity/compiler/downloader');
const { Compiler } = require('hardhat/internal/solidity/compiler');

const [{ version }] = hre.config.solidity.compilers;

async function getSolc () {
  const downloader = new CompilerDownloader(await getCompilersDir(), { forceSolcJs: true });
  const { compilerPath } = await downloader.getDownloadedCompilerPath(version);
  const compiler = new Compiler(compilerPath);
  return compiler.getSolc();
}

module.exports = Object.assign(getSolc(), { __esModule: true });
