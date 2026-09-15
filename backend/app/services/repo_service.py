import os
import shutil
import tempfile
from pathlib import Path

import git

IGNORE_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".cache",
    "venv",
    "__pycache__",
    "target",
    "vendor",
}

ALLOWED_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".java",
    ".go",
    ".rs",
}


def clone_and_get_files(repo_url: str):
    # We create a temporary directory for the repo
    temp_dir = tempfile.mkdtemp()
    print(f"Cloning {repo_url} into {temp_dir}")
    try:
        git.Repo.clone_from(repo_url, temp_dir, depth=1)
        source_files = discover_and_filter_files(temp_dir)
        return temp_dir, source_files
    except Exception as e:
        print(f"Failed to clone repo: {e}")
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise


def discover_and_filter_files(repo_path: str):
    source_files = []
    base_path = Path(repo_path)
    for root, dirs, files in os.walk(base_path):
        # Filter out ignored directories in-place
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in ALLOWED_EXTENSIONS:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_path)
                source_files.append(
                    {
                        "full_path": full_path,
                        "rel_path": rel_path,
                        "ext": ext,
                    }
                )
    return source_files


def cleanup_repo(repo_path: str):
    if os.path.exists(repo_path):
        shutil.rmtree(repo_path, ignore_errors=True)
