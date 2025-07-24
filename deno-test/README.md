# Daytona SDK Deno Tests

Test suite for the Daytona TypeScript SDK running on Deno runtime.

## Setup

1. Install Deno:

   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. Set your API key:
   ```bash
   export DAYTONA_API_KEY="your-api-key-here"
   ```

## Run Tests

```bash
deno run --allow-all deno_test.ts
```

Or using the task:

```bash
deno task test
```
