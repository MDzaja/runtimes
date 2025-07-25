# Daytona SDK Browser Tests

Test suite for the Daytona TypeScript SDK running in the browser with React.

## TLDR

```bash
cd browser
cp .env.example .env
npm install
npm run dev
```

Then edit `.env` with your API key and open `http://localhost:3003`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set your API key:
   
   ```bash
   cp .env.example .env
   # Then edit .env and replace 'your-api-key-here' with your actual API key
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Run Tests

Open your browser and navigate to `http://localhost:3003`

Click "START ALL TESTS" to run the comprehensive test suite.

Or using individual scripts:

```bash
npm run build    # Build for production
npm run lint     # Run ESLint
```
