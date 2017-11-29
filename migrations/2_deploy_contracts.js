//var Ownable = artifacts.require("ownership/Ownable.sol");
let SampleLibraryEternalStorage = artifacts.require("CounterLibrary");
let SampleContractWithEternalStorage = artifacts.require("SampleContractWithEternalStorage");

module.exports = function(deployer) {
  //deployer.deploy(Ownable);
  deployer.deploy(SampleLibraryEternalStorage);
  deployer.link(SampleLibraryEternalStorage, SampleContractWithEternalStorage);
  deployer.deploy(SampleContractWithEternalStorage);
};
