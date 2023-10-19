#!/usr/bin/env node

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const format = require('./format-lines');

const prettierPath = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'prettier');

function getVersion(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8').match(/\/\/ OpenZeppelin Contracts \(last updated v[^)]+\)/)[0];
    } catch (err) {
        console.error(`Error reading version from file ${filePath}:`, err);
        return null;
    }
}

function generateFromTemplate(file, template, outputPrefix = '') {
    const script = path.relative(path.join(__dirname, '../..'), __filename);
    const input = path.join(path.dirname(script), template);
    const output = path.join(outputPrefix, file);
    const version = getVersion(output);
    
    const content = format(
        '// SPDX-License-Identifier: MIT',
        ...(version ? [version + ` (${file})`] : []),
        `// This file was procedurally generated from ${input}.`,
        '',
        require(template)
    );

    fs.writeFileSync(output, content);
    try {
        cp.execFileSync(prettierPath, ['--write', output]);
    } catch (err) {
        console.error(`Error running prettier on ${output}:`, err);
    }
}

// Contracts
const contracts = {
    'utils/math/SafeCast.sol': './templates/SafeCast.js',
    'utils/structs/EnumerableSet.sol': './templates/EnumerableSet.js',
    'utils/structs/EnumerableMap.sol': './templates/EnumerableMap.js',
    'utils/structs/Checkpoints.sol': './templates/Checkpoints.js',
    'utils/StorageSlot.sol': './templates/StorageSlot.js',
};

for (const [file, template] of Object.entries(contracts)) {
    generateFromTemplate(file, template, './contracts/');
}

// Tests
const tests = {
    'utils/structs/Checkpoints.t.sol': './templates/Checkpoints.t.js',
};

for (const [file, template] of Object.entries(tests)) {
    generateFromTemplate(file, template, './test/');
}
