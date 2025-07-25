# Daytona SDK Bun Tests

Test suite for the Daytona TypeScript SDK running on Bun runtime.

## TLDR

```bash
cd bun-test
curl -fsSL https://bun.sh/install | sh
# source ~/.bashrc or ~/.zshrc; or open new terminal
bun install
export DAYTONA_API_KEY="your-api-key-here"
bun run bun_test.ts
```

## Setup

1. Install Bun:

   ```bash
   curl -fsSL https://bun.sh/install | sh
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set your API key:
   ```bash
   export DAYTONA_API_KEY="your-api-key-here"
   ```

## Run Tests

```bash
bun run bun_test.ts
```

Or using the script:

```bash
bun run test
```
