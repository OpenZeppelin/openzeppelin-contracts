// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

import {Ownable} from "../../../access/Ownable.sol";

contract MyContract is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    function normalThing() public {
        // anyone can call this normalThing()
    }

    function specialThing() public onlyOwner {
        // only the owner can call specialThing()!
    }
}
