pragma solidity ^0.8.20;

import {ERC1967Utils} from "../../../openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {IBeacon} from "../../../openzeppelin-contracts/contracts/proxy/beacon/IBeacon.sol";

contract TestContractA {
    uint256 val;
    function test() public {
        val = 1;
    }
}

contract TestContractB {
    uint256 val;
    function test() public {
        val = 100;
    }
}

contract TestContractC {    
    uint256 val;
    function test() public {
        val = 1000;
    }
}

contract TestContractBeacon is IBeacon{
    address add;
    constructor(address ad) {
        add = ad;
    }
    function implementation() external view returns (address) {
        return add;
    }
}

contract MyERC1967Utils {
    TestContractA public addA;
    TestContractB public addB;
    TestContractC public addC;
    TestContractBeacon public addBeacon;
    constructor() {
        addA = new TestContractA();
        addB = new TestContractB();
        addC = new TestContractC();
        addBeacon = new TestContractBeacon(address(addC));
    }
    
    function getImplementation() public returns(address) {
        return ERC1967Utils.getImplementation();
    }

    function upgradeToAndCallA() public {
        bytes memory data = abi.encodeWithSelector(TestContractA.test.selector);
        ERC1967Utils.upgradeToAndCall(address(addA), data);
    }

    function upgradeToAndCallB() public {
        bytes memory data = abi.encodeWithSelector(TestContractB.test.selector);
        ERC1967Utils.upgradeToAndCall(address(addB), data);
    }

    function changeAdmin() public {
        address admin = did:bid:efJYtoZeKfqw81nC9mXevpGMxPcehsWC;
        ERC1967Utils.changeAdmin(admin);
    }

    function getAdmin() public returns(address) {
        return ERC1967Utils.getAdmin();
    }

    function upgradeBeaconToAndCall() public {
        bytes memory data = abi.encodeWithSelector(TestContractC.test.selector);
        ERC1967Utils.upgradeBeaconToAndCall(address(addBeacon), data);
    }

    function getBeacon() public returns(address) {
        return ERC1967Utils.getBeacon();
    }
}