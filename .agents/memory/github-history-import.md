---
name: GitHub history import
description: Constraint for reproducing local Git history through the GitHub connector API.
---

When importing Git history with GitHub's low-level blob, tree, and commit APIs, first bootstrap an otherwise empty repository with a standard contents API commit, then replace the target branch reference after the import.

**Why:** GitHub rejects low-level Git object creation while a repository has no initial commit, even though the repository itself has already been created.

**How to apply:** For a new empty repository, create one temporary file commit through the repository contents endpoint. Import the intended commits and force-update the desired branch to the imported final commit. The bootstrap commit becomes unreachable and does not appear in the imported branch history.