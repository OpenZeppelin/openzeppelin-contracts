const { ethers } = require('hardhat');

async function getFactory(name, opts = {}) {
    return ethers.getContractFactory(name).then(contract => contract.connect(opts.signer || contract.runner));
}

function attach(name, address, opts = {}) {
    return getFactory(name, opts).then(factory => factory.attach(address));
}

function deploy(name, args = [], opts = {}) {
    if (!Array.isArray(args)) { opts = args; args = []; }
    return getFactory(name, opts).then(factory => factory.deploy(...args)).then(contract => contract.waitForDeployment());
}

module.exports = {
    getFactory,
    attach,
    deploy,
};