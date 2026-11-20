# Contributing

1. Take an issue from the board, or open one first.
2. Branch from `main` as `<github-name>/<topic>`, for example `alex/runs-page`.
3. Write commits as conventional commits: `type(scope): summary`, such as `feat(web): add the runs page`. The types are feat, fix, perf, refactor, style, test, docs, build, ci and chore.
4. Run `pnpm check` and `pnpm test`, then open a pull request whose title follows the same format.
5. A member of `pr-reviewers` approves it once the CI passes and every conversation is resolved. A new push needs a new approval.
6. Merge with **Squash**: the pull request's title becomes the commit. Use **Rebase** only when every commit is clean and worth keeping. The branch is deleted after the merge.

`main` only changes through pull requests.
