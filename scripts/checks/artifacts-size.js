#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

// Constants from EIP-3860
const MAX_CODE_SIZE = 24576;
const MAX_INITCODE_SIZE = 2 * MAX_CODE_SIZE;

// Folder containing compilation artifacts
const BUILD_FOLDER = path.join(__dirname, "../../artifacts/build-info");

// Get all compiled contracts from compilation artifacts
const contracts = Object.fromEntries(
    fs.readdirSync(BUILD_FOLDER)
        .filter(buildFile => path.extname(buildFile) === '.json')
        .map(buildFile => require(path.join(BUILD_FOLDER, buildFile)))
        .flatMap(buildInfo => Object.entries(buildInfo.output.contracts)
            .flatMap(([ file, contracts ]) => Object.entries(contracts)
                .map(([ name, details ]) => [ `${file}:${name}`, Object.assign(details, { extra: { file, name, compilerSettings: buildInfo.input.settings }}) ])
            )
        )
);

for (const [ id, details ] of Object.entries(contracts)) {
    // Skip "exposed" contracts
    if (details.extra.name.startsWith('$')) {
        continue;
    }

    // Skip (with warning) contracts that were not compiled with optimizations
    if (!details.extra.compilerSettings.optimizer.enabled) {
        console.warn(`[Warning] ${id} was compiled without optimizations. Skipped.`);
        continue;
    }

    // Check bytecode length is within limits
    const { length: bytecodeLength } = Buffer.from(details.evm.bytecode.object, "hex");
    if (bytecodeLength > MAX_INITCODE_SIZE) {
        console.log("[bytecodeLength over limit]", id, bytecodeLength);
        process.exitCode = 1;
    }

    // Check deployed bytecode length is within limits
    const { length: deployedBytecodeLength } = Buffer.from(details.evm.deployedBytecode.object, "hex");
    if (deployedBytecodeLength > MAX_CODE_SIZE ) {
        console.log("[deployedBytecode over limit]", id, deployedBytecodeLength);
        process.exitCode = 1;
    }
}
