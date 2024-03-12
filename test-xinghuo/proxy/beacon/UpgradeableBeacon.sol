pragma solidity ^0.8.20;

import {UpgradeableBeacon} from "../../../openzeppelin-contracts/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract TestContractA {
}

contract TestContractB {
}

contract MyUpgradeableBeacon is UpgradeableBeacon {
    //构造函数构建使用TestContractA合约地址；upgradeTo使用TestContractB合约地址
    //TestContractA.address
    constructor(address implementation_, address initialOwner) UpgradeableBeacon(implementation_, initialOwner) {

    }

    //implementation

    //TestContractB.address
    //upgradeTo
    
}