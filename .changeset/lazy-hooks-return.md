---
'openzeppelin-solidity': patch
---

`AccountERC7579`: Revert the uninstallation of any module (validator, executor, fallback, or hook) if its `onUninstall` callback reverts, giving modules control over their own uninstallation. A forced uninstallation that bypasses the callback can still be performed through a delegate call via `execute`.
