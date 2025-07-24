# Daytona SDK Test App

A standalone React application for testing the Daytona SDK functionality.

## Features

This app provides a comprehensive test suite for the Daytona SDK including:

- **Volumes Test** - Testing volume creation and mounting
- **Lifecycle Test** - Testing sandbox lifecycle management
- **Git LSP Test** - Testing Git operations and Language Server Protocol
- **File Operations Test** - Testing file system operations
- **Exec Command Test** - Testing command execution and sessions
- **Declarative Image Test** - Testing custom image creation
- **Auto Delete Test** - Testing auto-delete functionality
- **Charts Test** - Testing chart generation capabilities
- **Auto Archive Test** - Testing auto-archive functionality

## Prerequisites

- Node.js (version 18 or higher)
- npm
- A valid Daytona API key

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure API Key:**
   Update the API key in `src/SdkTest.tsx` (line ~613):

   ```typescript
   const daytona = new Daytona({
     apiKey: 'your-api-key-here',
   })
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3001` (or the port shown in the terminal)

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Usage

1. Open the app in your browser
2. Click "START ALL TESTS" to run the comprehensive test suite
3. Monitor the test progress in the status overview
4. View detailed logs in the execution logs section
5. Use "CLEAR LOGS" to reset the interface

## Tech Stack

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (configured but minimal usage)
- **Daytona SDK** - Cloud development environment management

## Project Structure

```
sdk-test-app/
├── src/
│   ├── App.tsx           # Main app component
│   ├── SdkTest.tsx       # SDK test suite component
│   ├── main.tsx          # React entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── eslint.config.js      # ESLint configuration
```
