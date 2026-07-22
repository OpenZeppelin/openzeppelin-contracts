---
'openzeppelin-solidity': patch
---

`AccountERC7579`: Revert the module uninstallation if the module's `onUninstall` hook reverts, giving modules control over their own uninstallation. A forced uninstallation that bypasses the hook can still be performed through a delegate call via `execute`.
