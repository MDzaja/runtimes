# Daytona SDK Deno Tests

Comprehensive test suite for the Daytona TypeScript SDK running on Deno runtime.

## Prerequisites

1. **Deno Runtime**: Install Deno from [deno.land](https://deno.land/)

   ```bash
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh

   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex

   # Using package managers
   # Homebrew (macOS)
   brew install deno

   # Scoop (Windows)
   scoop install deno
   ```

2. **Daytona API Key**: You need a valid Daytona API key from [app.daytona.io](https://app.daytona.io)

## Setup

1. Clone or navigate to the Deno test directory:

   ```bash
   cd examples/typescript/deno-test
   ```

2. No installation required! Deno will automatically download dependencies on first run.

3. Set your Daytona API key as an environment variable:
   ```bash
   export DAYTONA_API_KEY="your-api-key-here"
   ```

## Running Tests

### Quick Start

```bash
deno run --allow-all deno_test.ts
```

### Using Deno Tasks

```bash
# Run tests
deno task test

# Type check only
deno task test:check

# Format code
deno fmt

# Lint code
deno lint
```

### Direct Execution with Permissions

```bash
# Run with all permissions
deno run --allow-all deno_test.ts

# Run with specific permissions (more secure)
deno run --allow-net --allow-env --allow-read --allow-write deno_test.ts
```

## Test Coverage

The test suite includes:

1. **Volumes Test**: Creating, mounting, and sharing volumes between sandboxes
2. **Lifecycle Test**: Sandbox creation, start/stop, labeling, and deletion
3. **File Operations Test**: File upload, download, search, and modification with Deno-specific features
4. **Exec Command Test**: Code execution and command sessions
5. **Declarative Image Test**: Custom image creation with Deno installation
6. **Git LSP Test**: Language server protocol integration
7. **Auto Delete Test**: Automatic sandbox cleanup functionality
8. **Charts Test**: Chart and visualization capabilities
9. **Auto Archive Test**: Automatic archival functionality
10. **Deno Performance Test**: Testing Deno's performance features and security model

## Deno-Specific Features

- **Zero Configuration**: No package.json or node_modules required
- **Secure by Default**: Explicit permission system for network, file system, and environment access
- **Built-in TypeScript**: Native TypeScript support without transpilation
- **Web Standard APIs**: Uses modern web APIs like `fetch()` and `performance.now()`
- **ES Modules**: Native ES module support with URL imports
- **Runtime Detection**: Deno version and platform reporting

## Expected Output

The tests will display colored output showing:

- Runtime information (Deno version, platform, architecture)
- Progress of each test with timestamps
- Success/error status for each test category
- Performance metrics for Deno-specific tests
- Permission system demonstrations
- Summary report highlighting Deno's benefits

## Security & Performance Benefits

This test suite demonstrates Deno's advantages:

- **Secure by Default**: No file, network, or environment access without explicit permissions
- **Modern Runtime**: Built on V8 with modern JavaScript features
- **No node_modules**: Direct URL imports eliminate dependency hell
- **TypeScript Native**: First-class TypeScript support without configuration
- **Web Standards**: Uses standard web APIs for better compatibility

## Troubleshooting

1. **Permissions**: Ensure you're running with `--allow-all` or specific permissions
2. **API Key Issues**: Verify your API key is correctly set and valid
3. **Network Issues**: Ensure connectivity for API calls and dependency downloads
4. **Deno Version**: Make sure you're using Deno 1.0.0 or later

## Environment Variables

- `DAYTONA_API_KEY` (required): Your Daytona API key
- `DAYTONA_API_URL` (optional): Custom API URL (defaults to https://app.daytona.io/api)
- `DAYTONA_TARGET` (optional): Target environment

## Files

- `deno_test.ts`: Main test file with all test scenarios including Deno-specific tests
- `deno.json`: Deno configuration with tasks, formatting, and linting rules
- `deno.lock`: Lock file for dependency integrity
- `README.md`: This documentation file

## Deno vs Other Runtimes

This test suite allows you to compare Deno's capabilities against Node.js and Bun:

- **Security**: Explicit permission model vs. full system access
- **Dependencies**: URL imports vs. package.json + node_modules
- **TypeScript**: Native support vs. transpilation required
- **Standards**: Web APIs vs. Node.js-specific APIs
- **Simplicity**: Zero configuration vs. complex tooling setup

## Permission System

Deno's security model requires explicit permissions:

```bash
# Network access
--allow-net

# File system access
--allow-read --allow-write

# Environment variables
--allow-env

# All permissions (for testing)
--allow-all
```

## Dependency Management

Deno uses URL imports instead of package.json:

```typescript
// Direct import from npm
import { Daytona } from "npm:@daytonaio/sdk@0.24.4-alpha.4";

// Import from Deno registry
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
```

Dependencies are cached locally and integrity is ensured via `deno.lock`.
