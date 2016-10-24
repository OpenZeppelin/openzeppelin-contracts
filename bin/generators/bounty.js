#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var Mustache = require('mustache');

if (process.argv.length != 3) {
  throw("Usage: pass contract name as an argument (eg: token/SimpleToken.sol)")
}

// extract contract name from arguments
var file_name = process.argv[2]
var contract_name = path.basename(file_name).split('.')[0]

var view = {
  name: contract_name,
  file_name: file_name
};

console.log(view)

// Generate content from templates
var contents = fs.readFileSync(__dirname + '/templates/Bounty.sol.mustache', 'utf8');
var output = Mustache.render(contents, view);

// Write template to contracts
fs.writeFileSync('./contracts/Bounty.sol', output, 'utf8');
