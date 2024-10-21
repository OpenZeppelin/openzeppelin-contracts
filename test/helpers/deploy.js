const { artifacts, ethers } = require('hardhat');
const { setCode } = require('@nomicfoundation/hardhat-network-helpers');
const { generators } = require('./random');

const forceDeployCode = (name, address = generators.address(), runner = ethers.provider) =>
  artifacts
    .readArtifact(name)
    .then(({ abi, deployedBytecode }) =>
      setCode(address, deployedBytecode).then(() => new ethers.Contract(address, abi, runner)),
    );

module.exports = {
  forceDeployCode,
};
