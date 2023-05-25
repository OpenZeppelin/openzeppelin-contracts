---
'openzeppelin-solidity': major
---

Remove library `Counter.sol` as its usage has been reduced across OpenZeppelin Contracts.

- WHAT the change is?

    - The Counters.sol contract initially served as an abstraction for a number that guarantees two main properties:
        - Provide a number that can only be incremented, decremented or reset
        - Abstract its behavior into a utility

Also, it allows to use unchecked arithmetic assuming no overflow. However, its usage has been reduced across OpenZeppelin Contracts. We're proposing removing it for Contracts 5.0, an alternative we're strongly considering is removing it for 5.0 but re-adding in the future some variation if people consider it useful and it makes sense.

- WHY the change was made?

    - These are some relevant reasons to remove it, such as:
    
        - New announced Solidity features might allow replicating the behavior without the Counters.sol contract (eg. User Defined Types)
        - It apparently doesn't add much value against using a regular variable
        - It increments the maintenance surface
        - Can be confusing for newcomers

- HOW a consumer should update their code?

    ```
    WITH Counters.sol

    import "/path/to/Counters.sol";

    contract MyContract {
        using Counters for Counters.Counter;
        mapping(address => Counters.Counter) private _nonces;

        function nonces(address owner) public view virtual override returns (uint256) {
            return nonces[owner].current();
        }

        function _useNonce(address owner) internal virtual returns (uint256 current) {
            Counters.Counter storage nonce = _nonces[owner];
            current = nonce.current();
            nonce.increment();
        }

    }

    WITHOUT Counters.sol
    contract MyContract {
        mapping(address => uint256) private nonces;

        function nonces(address owner) public view virtual override returns (uint256) {
            return nonces[owner];
        }

        function _useNonce(address owner) internal virtual returns (uint256 current) {
            current = _nonces[owner];
            _nonces[owner] += 1;
        }

    }
