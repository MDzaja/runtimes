# Daytona SDK Bun Tests

Comprehensive test suite for the Daytona TypeScript SDK running on Bun runtime.

## Prerequisites

1. **Bun Runtime**: Install Bun from [bun.sh](https://bun.sh/)

   ```bash
   # macOS/Linux
   curl -fsSL https://bun.sh/install | bash

   # Windows
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

2. **Daytona API Key**: You need a valid Daytona API key from [app.daytona.io](https://app.daytona.io)

## Setup

1. Clone or navigate to the Bun test directory:

   ```bash
   cd examples/typescript/bun-test
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set your Daytona API key as an environment variable:
   ```bash
   export DAYTONA_API_KEY="your-api-key-here"
   ```

## Running Tests

### Quick Start

```bash
bun run bun_test.ts
```

### Using Package Scripts

```bash
# Run tests
bun run test

# Run in development mode (with watch)
bun run dev

# Type check
bun run check

# Format code
bun run format
```

### Direct Execution

```bash
bun bun_test.ts
```

## Test Coverage

The test suite includes:

1. **Volumes Test**: Creating, mounting, and sharing volumes between sandboxes
2. **Lifecycle Test**: Sandbox creation, start/stop, labeling, and deletion
3. **File Operations Test**: File upload, download, search, and modification with Bun-specific features
4. **Exec Command Test**: Code execution and command sessions
5. **Declarative Image Test**: Custom image creation with Bun installation
6. **Bun Performance Test**: Testing Bun's performance features (file I/O, HTTP requests)

## Bun-Specific Features

- Uses Bun's optimized `Buffer` handling
- Leverages Bun's fast file I/O capabilities
- Tests Bun's built-in performance APIs
- Runtime detection and version reporting
- Demonstrates Bun's TypeScript support

## Expected Output

The tests will display colored output showing:

- Runtime information (Bun version, platform, architecture)
- Progress of each test with timestamps
- Success/error status for each test category
- Performance metrics for Bun-specific tests
- Summary report highlighting Bun's benefits

## Performance Benefits

This test suite demonstrates Bun's advantages:

- **Fast Startup**: Significantly faster than Node.js
- **Built-in TypeScript**: No transpilation needed
- **Optimized File I/O**: Native file operations
- **All-in-one**: Runtime, bundler, and package manager

## Troubleshooting

1. **Dependencies**: Run `bun install` to ensure SDK is installed
2. **API Key Issues**: Verify your API key is correctly set and valid
3. **Network Issues**: Ensure connectivity for API calls
4. **Bun Version**: Make sure you're using Bun 1.0.0 or later

## Environment Variables

- `DAYTONA_API_KEY` (required): Your Daytona API key
- `DAYTONA_API_URL` (optional): Custom API URL (defaults to https://app.daytona.io/api)
- `DAYTONA_TARGET` (optional): Target environment

## Files

- `bun_test.ts`: Main test file with all test scenarios including Bun-specific tests
- `package.json`: Project configuration with dependencies and scripts
- `tsconfig.json`: TypeScript configuration optimized for Bun runtime
- `README.md`: This documentation file

## Bun vs Other Runtimes

This test suite allows you to compare Bun's performance against Node.js and Deno:

- Faster startup times
- Better memory usage
- Native TypeScript support
- Integrated bundling capabilities
