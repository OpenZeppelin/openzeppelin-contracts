// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../proxy/utils/Initializable.sol";

// Sample contracts showing upgradeability with multiple inheritance.
// Child contract inherits from Father and Mother contracts, and Father extends from Gramps.
//
//         Human
//       /       \
//      |       Gramps
//      |         |
//    Mother    Father
//      |         |
//      -- Child --

/**
 * Sample base intializable contract that is a human
 */
contract SampleHuman is Initializable {
    bool public isHuman;

    function initialize() public initializer {
        __SampleHuman_init();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleHuman_init() internal onlyInitializing {
        __SampleHuman_init_unchained();
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleHuman_init_unchained() internal onlyInitializing {
        isHuman = true;
    }
}

/**
 * Sample base intializable contract that defines a field mother
 */
contract SampleMother is Initializable, SampleHuman {
    uint256 public mother;

    function initialize(uint256 value) public virtual initializer {
        __SampleMother_init(value);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleMother_init(uint256 value) internal onlyInitializing {
        __SampleHuman_init();
        __SampleMother_init_unchained(value);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleMother_init_unchained(uint256 value) internal onlyInitializing {
        mother = value;
    }
}

/**
 * Sample base intializable contract that defines a field gramps
 */
contract SampleGramps is Initializable, SampleHuman {
    string public gramps;

    function initialize(string memory value) public virtual initializer {
        __SampleGramps_init(value);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleGramps_init(string memory value) internal onlyInitializing {
        __SampleHuman_init();
        __SampleGramps_init_unchained(value);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleGramps_init_unchained(string memory value) internal onlyInitializing {
        gramps = value;
    }
}

/**
 * Sample base intializable contract that defines a field father and extends from gramps
 */
contract SampleFather is Initializable, SampleGramps {
    uint256 public father;

    function initialize(string memory _gramps, uint256 _father) public initializer {
        __SampleFather_init(_gramps, _father);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleFather_init(string memory _gramps, uint256 _father) internal onlyInitializing {
        __SampleGramps_init(_gramps);
        __SampleFather_init_unchained(_father);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleFather_init_unchained(uint256 _father) internal onlyInitializing {
        father = _father;
    }
}

/**
 * Child extends from mother, father (gramps)
 */
contract SampleChild is Initializable, SampleMother, SampleFather {
    uint256 public child;

    function initialize(
        uint256 _mother,
        string memory _gramps,
        uint256 _father,
        uint256 _child
    ) public initializer {
        __SampleChild_init(_mother, _gramps, _father, _child);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleChild_init(
        uint256 _mother,
        string memory _gramps,
        uint256 _father,
        uint256 _child
    ) internal onlyInitializing {
        __SampleMother_init(_mother);
        __SampleFather_init(_gramps, _father);
        __SampleChild_init_unchained(_child);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __SampleChild_init_unchained(uint256 _child) internal onlyInitializing {
        child = _child;
    }
}
