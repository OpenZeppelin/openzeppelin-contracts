---
'openzeppelin-solidity': major
---

[BREAKING] `IERC20`, `IERC20Metadata`, `IERC721`, `IERC721Receiver`, `IERC721Enumerable`, `IERC721Metadata`, `IERC1155`, `IERC1155Receiver`, `IERC1155MetadataURI`, `IERC165`: Remove the module-local copies of these interfaces; the canonical definitions now live under `contracts/interfaces/`. Import them from `@openzeppelin/contracts/interfaces/<IName>.sol` instead of their former module paths.
