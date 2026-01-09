// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {CrosschainRemoteController} from "../../crosschain/CrosschainRemoteController.sol";
import {CrosschainLinked} from "../../crosschain/CrosschainLinked.sol";

contract CrosschainRemoteControllerMock is CrosschainRemoteController {
    constructor(CrosschainLinked.Link[] memory links) CrosschainRemoteController(links) {}
}
