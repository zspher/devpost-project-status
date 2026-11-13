import shutil
from pathlib import Path

import pygit2
from pygit2.enums import SortMode


class GitUtils:
    def __init__(self, giturl: str, name: str):
        self.giturl = giturl
        self.name = name
        # anchored to backend/, regardless of CWD
        self.path = Path(__file__).resolve().parent.parent / "repos" / name

    def clone(self) -> pygit2.Repository:
        """Clone repo to repos/<name>, replacing any existing clone."""
        if self.path.exists():
            shutil.rmtree(self.path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        return pygit2.clone_repository(self.giturl, str(self.path))

    def get_boundary_commits(
        self,
    ) -> tuple[int, pygit2.Commit | None, pygit2.Commit | None, pygit2.Commit | None]:
        """Return (count, first, second, last) commits in chronological order."""
        repo = pygit2.Repository(str(self.path))
        count = 0
        first = second = last = None
        for commit in repo.walk(repo.head.target, SortMode.TOPOLOGICAL):
            if last is None:
                last = commit
            second = first
            first = commit
            count += 1
        return count, first, second, last

    def pull(self) -> None:
        """Pull changes from origin, hard-syncing to the remote state."""
        repo = pygit2.Repository(str(self.path))

        # Fetch from origin
        origin = repo.remotes["origin"]
        origin.fetch()

        # Get current branch and its upstream
        current_branch = repo.branches.get(repo.head.shorthand)
        if current_branch is None:
            raise pygit2.GitError("No current branch found")
        upstream = current_branch.upstream
        remote_target = upstream.target

        # If already up to date, nothing to do
        if repo.head.target == remote_target:
            return

        # Hard sync to remote (https://stackoverflow.com/a/27786533)
        repo.checkout_tree(repo.get(remote_target))
        upstream_branch_ref = repo.lookup_reference(upstream.name)
        upstream_branch_ref.set_target(remote_target)
        repo.head.set_target(remote_target)
