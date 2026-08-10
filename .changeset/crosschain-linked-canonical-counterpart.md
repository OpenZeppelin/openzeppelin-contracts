---
'openzeppelin-solidity': patch
---

`CrosschainLinked`: Reject counterparts that are not byte-canonical ERC-7930 encodings in `_setLink`. `InteroperableAddress.parseV1` tolerates trailing bytes, so a counterpart could previously be registered whose bytes would never satisfy the strict equality check in `_isAuthorizedGateway`, silently breaking every inbound message. `_setLink` now reverts with `NonCanonicalCounterpart` when the input is not byte-identical to its parse-and-reformat.
