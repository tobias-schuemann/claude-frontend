# Branch Protection Setup for Semantic Release

## Important: Allow GitHub Actions to Bypass Protection

For semantic-release to work with branch protection, you need to configure exceptions.

### Go to Repository Settings

1. Navigate to: https://github.com/tobias-schuemann/claude-frontend/settings/branches
2. Edit the protection rule for `main`

### Configure Protection Rules

#### ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from CODEOWNERS

#### ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Select status checks: Test, Lint, Security Check

#### ❌ Include administrators
- Leave unchecked so you can bypass if needed

#### ✅ Restrict who can push to matching branches
**This is crucial for semantic-release:**
- ✅ Enable this option
- Add these users/apps who can push directly:
  - `tobias-schuemann` (your username)
  - `github-actions[bot]` (for automated releases)

### Alternative: Use Personal Access Token

If you can't add github-actions[bot], create a Personal Access Token:

1. Go to: https://github.com/settings/tokens/new
2. Create a token with `repo` scope
3. Add it as `GH_TOKEN` secret in repository settings:
   - Go to: Settings → Secrets and variables → Actions
   - Add new secret named `GH_TOKEN` with your PAT

The workflow is already configured to use GH_TOKEN if available.