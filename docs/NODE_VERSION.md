# Node version (recommended: 20 LTS)

Prisma and native bindings are best tested on **Node 20 LTS**. Node 25 is current (odd-numbered) and can have compatibility or SSL/network quirks on macOS arm64.

## Use Node 20 for this project

### Option A: nvm

```bash
# Install nvm (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Restart shell or: source ~/.nvm/nvm.sh

# Install and use Node 20
nvm install 20
nvm use 20

# Optional: default for this directory
echo 20 > .nvmrc
nvm use
```

### Option B: fnm

```bash
# Install fnm (e.g. Homebrew on macOS)
brew install fnm
eval "$(fnm env)"

# Install and use Node 20
fnm install 20
fnm use 20

# Optional: default for this directory
echo 20 > .nvmrc
fnm use
```

Then from project root:

```bash
cd ~/openclaw-core/executive-ai-platform
npm run test:db
npm run migrate
```
