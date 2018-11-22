pragma solidity ^0.4.24;

contract EventEmitter {
    event Argumentless();
    event ShortUint(uint8 value);
    event ShortInt(int8 value);
    event LongUint(uint256 value);
    event LongInt(int256 value);
    event Address(address value);
    event Boolean(bool value);
    event String(string value);
    event LongUintBooleanString(uint256 uintValue, bool booleanValue, string stringValue);

    constructor (uint8 uintValue, bool booleanValue, string stringValue) public {
        emit ShortUint(uintValue);
        emit Boolean(booleanValue);
        emit String(stringValue);
    }

    function emitArgumentless() public {
        emit Argumentless();
    }

    function emitShortUint(uint8 value) public {
        emit ShortUint(value);
    }

    function emitShortInt(int8 value) public {
        emit ShortInt(value);
    }

    function emitLongUint(uint256 value) public {
        emit LongUint(value);
    }

    function emitLongInt(int256 value) public {
        emit LongInt(value);
    }

    function emitAddress(address value) public {
        emit Address(value);
    }

    function emitBoolean(bool value) public {
        emit Boolean(value);
    }

    function emitString(string value) public {
        emit String(value);
    }

    function emitLongUintBooleanString(uint256 uintValue, bool booleanValue, string stringValue) public {
        emit LongUintBooleanString(uintValue, booleanValue, stringValue);
    }

    function emitLongUintAndBoolean(uint256 uintValue, bool boolValue) public {
        emit LongUint(uintValue);
        emit Boolean(boolValue);
    }

    function emitStringAndEmitIndirectly(string value, IndirectEventEmitter emitter) public {
        emit String(value);
        emitter.emitStringIndirectly(value);
    }
}

contract IndirectEventEmitter {
    event IndirectString(string value);

    function emitStringIndirectly(string value) public {
        emit IndirectString(value);
    }
}
