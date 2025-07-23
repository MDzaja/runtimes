#!/usr/bin/env bun
/*
 * Copyright 2025 Daytona Platforms Inc.
 * SPDX-License-Identifier: AGPL-3.0
 */

import { Daytona, Sandbox, Image } from '@daytonaio/sdk'

interface LogEntry {
  type: 'info' | 'error' | 'success' | 'warning'
  message: string
  timestamp: string
  category: string
}

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  logs: LogEntry[]
}

class DaytonaBunTester {
  private logs: LogEntry[] = []
  private testResults: TestResult[] = []
  private currentTest = ''

  private addLog(message: string, type: LogEntry['type'] = 'info', category = 'general') {
    const logEntry = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      category,
    }
    this.logs.push(logEntry)

    // Also add to current test results
    this.testResults = this.testResults.map((test) =>
      test.name === category ? { ...test, logs: [...test.logs, logEntry] } : test,
    )

    // Print to console with colors
    const colors = {
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m', // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m',
    }

    console.log(`${colors[type]}[${logEntry.timestamp}] [${category}] ${message}${colors.reset}`)
  }

  private updateTestStatus(testName: string, status: TestResult['status']) {
    this.testResults = this.testResults.map((test) => (test.name === testName ? { ...test, status } : test))
  }

  private async runTestWithErrorHandling(testName: string, testFn: () => Promise<void>) {
    this.currentTest = testName
    this.updateTestStatus(testName, 'running')
    this.addLog(`🔄 Starting ${testName}...`, 'info', testName)

    try {
      await testFn()
      this.updateTestStatus(testName, 'success')
      this.addLog(`✅ ${testName} completed successfully!`, 'success', testName)
    } catch (error) {
      this.updateTestStatus(testName, 'error')
      this.addLog(`❌ Error in ${testName}: ${error}`, 'error', testName)
      console.error(`Error in ${testName}:`, error)
    }
  }

  // Example 1: Volumes Test
  private async runVolumesTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Volumes Test', async () => {
      // Create a new volume or get an existing one
      const volume = await daytona.volume.get('my-volume-bun', true)
      this.addLog('Created/Retrieved volume: my-volume-bun', 'info', 'Volumes Test')

      // Mount the volume to the sandbox
      const mountDir1 = '/home/daytona/volume'
      const sandbox1 = await daytona.create({
        language: 'typescript',
        volumes: [{ volumeId: volume.id, mountPath: mountDir1 }],
      })
      this.addLog(`Created sandbox1 with volume mounted at ${mountDir1}`, 'success', 'Volumes Test')

      // Create a new directory in the mount directory
      const newDir = `${mountDir1}/new-dir`
      await sandbox1.fs.createFolder(newDir, '755')
      this.addLog(`Created directory: ${newDir}`, 'info', 'Volumes Test')

      // Create a new file in the mount directory using Bun.file()
      const newFile = `${mountDir1}/new-file.txt`
      await sandbox1.fs.uploadFile(Buffer.from('Hello from Bun!'), newFile)
      this.addLog(`Created file: ${newFile}`, 'info', 'Volumes Test')

      // Create a new sandbox with the same volume
      const mountDir2 = '/home/daytona/my-files'
      const sandbox2 = await daytona.create({
        language: 'typescript',
        volumes: [{ volumeId: volume.id, mountPath: mountDir2 }],
      })
      this.addLog(`Created sandbox2 with volume mounted at ${mountDir2}`, 'success', 'Volumes Test')

      // List files in the mount directory
      const files = await sandbox2.fs.listFiles(mountDir2)
      this.addLog(`Files in ${mountDir2}: ${JSON.stringify(files)}`, 'info', 'Volumes Test')

      // Get the file from the first sandbox
      const file = await sandbox1.fs.downloadFile(newFile)
      this.addLog(`File content: ${file.toString()}`, 'success', 'Volumes Test')

      // Cleanup
      await daytona.delete(sandbox1)
      await daytona.delete(sandbox2)
      this.addLog('Cleaned up sandboxes', 'info', 'Volumes Test')
    })
  }

  // Example 2: Lifecycle Test
  private async runLifecycleTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Lifecycle Test', async () => {
      this.addLog('Creating sandbox', 'info', 'Lifecycle Test')
      const sandbox = await daytona.create()
      this.addLog('Sandbox created', 'success', 'Lifecycle Test')

      await sandbox.setLabels({
        'bun-test': 'true',
        runtime: 'bun',
      })
      this.addLog('Set labels on sandbox', 'info', 'Lifecycle Test')

      this.addLog('Stopping sandbox', 'info', 'Lifecycle Test')
      await sandbox.stop()
      this.addLog('Sandbox stopped', 'success', 'Lifecycle Test')

      this.addLog('Starting sandbox', 'info', 'Lifecycle Test')
      await sandbox.start()
      this.addLog('Sandbox started', 'success', 'Lifecycle Test')

      this.addLog('Getting existing sandbox', 'info', 'Lifecycle Test')
      const existingSandbox = await daytona.get(sandbox.id)
      this.addLog('Got existing sandbox', 'success', 'Lifecycle Test')

      const response = await existingSandbox.process.executeCommand(
        'echo "Hello World from Bun exec!"',
        undefined,
        undefined,
        10,
      )
      if (response.exitCode !== 0) {
        this.addLog(`Command error: ${response.exitCode} ${response.result}`, 'error', 'Lifecycle Test')
      } else {
        this.addLog(`Command result: ${response.result}`, 'success', 'Lifecycle Test')
      }

      const sandboxes = await daytona.list()
      this.addLog(`Total sandboxes count: ${sandboxes.length}`, 'info', 'Lifecycle Test')

      this.addLog(`Sandbox info -> id: ${sandboxes[0].id} state: ${sandboxes[0].state}`, 'info', 'Lifecycle Test')

      this.addLog('Deleting sandbox', 'info', 'Lifecycle Test')
      await sandbox.delete()
      this.addLog('Sandbox deleted', 'success', 'Lifecycle Test')
    })
  }

  // Example 3: File Operations Test
  private async runFileOperationsTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('File Operations Test', async () => {
      const sandbox = await daytona.create()
      this.addLog(`Created sandbox with ID: ${sandbox.id}`, 'success', 'File Operations Test')

      // List files in the sandbox
      const files = await sandbox.fs.listFiles('~')
      this.addLog(`Initial files: ${JSON.stringify(files)}`, 'info', 'File Operations Test')

      // Create a new directory in the sandbox
      const newDir = '~/project-files'
      await sandbox.fs.createFolder(newDir, '755')
      this.addLog(`Created directory: ${newDir}`, 'success', 'File Operations Test')

      // Create configuration data
      const configData = JSON.stringify(
        {
          name: 'bun-project-config',
          version: '1.0.0',
          runtime: 'bun',
          bunVersion: typeof Bun !== 'undefined' ? Bun.version : 'unknown',
          settings: {
            debug: true,
            maxConnections: 10,
            bunFeatures: ['fast-startup', 'built-in-bundler', 'typescript-support'],
          },
        },
        null,
        2,
      )

      // Create temporary files for upload (Bun-compatible approach)
      const tempFiles = [
        { content: 'This is a test file from Bun runtime', name: 'temp-example.txt', dest: `${newDir}/example.txt` },
        { content: configData, name: 'temp-config.json', dest: `${newDir}/config.json` },
        {
          content: '#!/bin/bash\necho "Hello from Bun script!"\necho "Bun version: $(bun --version)"\nexit 0',
          name: 'temp-script.sh',
          dest: `${newDir}/script.sh`,
        },
      ]

      // Write temporary files and upload them one by one
      const fs = await import('fs')
      for (const file of tempFiles) {
        const tempPath = `./${file.name}`
        await fs.promises.writeFile(tempPath, file.content)

        await sandbox.fs.uploadFiles([
          {
            source: tempPath,
            destination: file.dest,
          },
        ])

        // Clean up temp file
        try {
          await fs.promises.unlink(tempPath)
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      this.addLog('Uploaded multiple files', 'success', 'File Operations Test')

      // Execute commands on the sandbox to verify files and make them executable
      const lsResult = await sandbox.process.executeCommand(`ls -la ${newDir}`)
      this.addLog(`Files in directory: ${lsResult.result}`, 'info', 'File Operations Test')

      // Make the script executable
      await sandbox.process.executeCommand(`chmod +x ${newDir}/script.sh`)

      // Run the script
      const scriptResult = await sandbox.process.executeCommand(`${newDir}/script.sh`)
      this.addLog(`Script output: ${scriptResult.result}`, 'success', 'File Operations Test')

      // Search for files in the project
      const matches = await sandbox.fs.searchFiles(newDir, '*.json')
      this.addLog(`JSON files found: ${JSON.stringify(matches)}`, 'info', 'File Operations Test')

      // Replace content in config file
      await sandbox.fs.replaceInFiles([`${newDir}/config.json`], '"debug": true', '"debug": false')

      // Download the modified config file
      const configContent = await sandbox.fs.downloadFile(`${newDir}/config.json`)
      this.addLog(`Updated config: ${configContent.toString()}`, 'success', 'File Operations Test')

      // Create a report of all operations
      const reportData = `
Bun Project Files Report:
------------------------
Time: ${new Date().toISOString()}
Runtime: Bun ${typeof Bun !== 'undefined' ? Bun.version : 'unknown'}
Platform: ${process.platform}
Arch: ${process.arch}
Files: ${matches.files.length} JSON files found
Config: ${configContent.toString().includes('"debug": false') ? 'Production mode' : 'Debug mode'}
Script: ${scriptResult.exitCode === 0 ? 'Executed successfully' : 'Failed'}
      `.trim()

      // Save the report
      await sandbox.fs.uploadFile(Buffer.from(reportData), `${newDir}/report.txt`)
      this.addLog('Created and saved report', 'success', 'File Operations Test')

      // Cleanup
      await daytona.delete(sandbox)
      this.addLog('Sandbox cleaned up', 'info', 'File Operations Test')
    })
  }

  // Example 4: Exec Command Test
  private async runExecCommandTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Exec Command Test', async () => {
      const sandbox = await daytona.create({
        language: 'typescript',
      })

      // Basic Exec Test
      this.addLog('Running basic execution tests...', 'info', 'Exec Command Test')

      // Run some typescript code directly
      const codeResult = await sandbox.process.codeRun('console.log("Hello World from Bun code!")')
      if (codeResult.exitCode !== 0) {
        this.addLog(`Error running code: ${codeResult.exitCode}`, 'error', 'Exec Command Test')
      } else {
        this.addLog(`Code result: ${codeResult.result}`, 'success', 'Exec Command Test')
      }

      // Run OS command
      const cmdResult = await sandbox.process.executeCommand('echo "Hello World from Bun CMD!"')
      if (cmdResult.exitCode !== 0) {
        this.addLog(`Error running command: ${cmdResult.exitCode}`, 'error', 'Exec Command Test')
      } else {
        this.addLog(`Command result: ${cmdResult.result}`, 'success', 'Exec Command Test')
      }

      // Session Exec Test
      this.addLog('Running session execution tests...', 'info', 'Exec Command Test')

      // Create exec session
      await sandbox.process.createSession('bun-exec-session-1')
      this.addLog('Created session: bun-exec-session-1', 'success', 'Exec Command Test')

      // Execute a first command in the session
      const command = await sandbox.process.executeSessionCommand('bun-exec-session-1', {
        command: 'export BUN_ENV=testing',
      })

      // Execute a second command to check environment variable
      const response = await sandbox.process.executeSessionCommand('bun-exec-session-1', {
        command: 'echo $BUN_ENV',
      })
      this.addLog(`BUN_ENV=${response.output}`, 'success', 'Exec Command Test')

      // Test Bun-specific performance
      const bunPerfTest = await sandbox.process.executeSessionCommand('bun-exec-session-1', {
        command: 'time echo "Bun performance test"',
      })
      this.addLog(`Bun performance: ${bunPerfTest.output}`, 'info', 'Exec Command Test')

      // Delete the session
      await sandbox.process.deleteSession('bun-exec-session-1')
      this.addLog('Deleted session: bun-exec-session-1', 'success', 'Exec Command Test')

      // Cleanup
      await daytona.delete(sandbox)
      this.addLog('Sandbox cleaned up', 'info', 'Exec Command Test')
    })
  }

  // Example 5: Declarative Image Test
  private async runDeclarativeImageTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Declarative Image Test', async () => {
      // Generate unique name for the snapshot to avoid conflicts
      const snapshotName = `bun-example:${Date.now()}`
      this.addLog(`Creating snapshot with name: ${snapshotName}`, 'info', 'Declarative Image Test')

      // Create an image with Bun installation
      const image = Image.debianSlim('3.12')
        .runCommands(
          'apt-get update && apt-get install -y curl unzip',
          'curl -fsSL https://bun.sh/install | bash',
          'echo "export PATH=$HOME/.bun/bin:$PATH" >> ~/.bashrc',
        )
        .workdir('/home/daytona/workspace')
        .env({
          BUN_INSTALL: '/root/.bun',
          BUN_ENV: 'production',
        })

      // Create the snapshot
      this.addLog(`Creating Snapshot: ${snapshotName}`, 'info', 'Declarative Image Test')
      await daytona.snapshot.create(
        {
          name: snapshotName,
          image,
          resources: {
            cpu: 1,
            memory: 1,
            disk: 3,
          },
        },
        {
          onLogs: (log) => this.addLog(`Snapshot: ${log}`, 'info', 'Declarative Image Test'),
        },
      )

      // Create sandbox using the pre-built image
      this.addLog('Creating Sandbox from Pre-built Snapshot', 'info', 'Declarative Image Test')
      const sandbox = await daytona.create({
        snapshot: snapshotName,
      })

      // Verify the sandbox environment
      this.addLog('Verifying sandbox from pre-built image:', 'info', 'Declarative Image Test')
      const bunResponse = await sandbox.process.executeCommand('$HOME/.bun/bin/bun --version')
      this.addLog(`Bun environment: ${bunResponse.result}`, 'success', 'Declarative Image Test')

      // Test Bun's fast startup
      const startupTest = await sandbox.process.executeCommand('time $HOME/.bun/bin/bun --help')
      this.addLog(`Bun startup performance: ${startupTest.result}`, 'info', 'Declarative Image Test')

      // Clean up sandbox
      await daytona.delete(sandbox)
      this.addLog('Cleaned up sandbox', 'info', 'Declarative Image Test')
    })
  }

  // Example 6: Git LSP Test
  private async runGitLspTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Git LSP Test', async () => {
      const sandbox = await daytona.create()

      const projectDir = 'learn-typescript'

      // Clone the repository
      await sandbox.git.clone('https://github.com/panaverse/learn-typescript', projectDir, 'master')
      this.addLog('Repository cloned successfully', 'success', 'Git LSP Test')

      // Search for the file we want to work on
      const matches = await sandbox.fs.findFiles(projectDir, 'var obj1 = new Base();')
      this.addLog(`Matches found: ${JSON.stringify(matches)}`, 'info', 'Git LSP Test')

      if (matches.length > 0) {
        // Start the language server
        const lsp = await sandbox.createLspServer('typescript', projectDir)
        await lsp.start()
        this.addLog('Language server started', 'success', 'Git LSP Test')

        // Notify the language server of the document we want to work on
        await lsp.didOpen(matches[0].file!)
        this.addLog(`Opened file: ${matches[0].file}`, 'info', 'Git LSP Test')

        // Get symbols in the document
        const symbols = await lsp.documentSymbols(matches[0].file!)
        this.addLog(`Symbols: ${JSON.stringify(symbols)}`, 'info', 'Git LSP Test')

        // Fix the error in the document
        await sandbox.fs.replaceInFiles([matches[0].file!], 'var obj1 = new Base();', 'var obj1 = new E();')
        this.addLog('Fixed error in document', 'success', 'Git LSP Test')

        // Notify the language server of the document change
        await lsp.didClose(matches[0].file!)
        await lsp.didOpen(matches[0].file!)

        // Get completions at a specific position
        const completions = await lsp.completions(matches[0].file!, {
          line: 12,
          character: 18,
        })
        this.addLog(`Completions: ${JSON.stringify(completions)}`, 'info', 'Git LSP Test')
      }

      // Cleanup
      await daytona.delete(sandbox)
      this.addLog('Sandbox cleaned up', 'info', 'Git LSP Test')
    })
  }

  // Example 7: Auto Delete Test
  private async runAutoDeleteTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Auto Delete Test', async () => {
      // Auto-delete is disabled by default
      const sandbox1 = await daytona.create()
      this.addLog(`Default auto-delete interval: ${sandbox1.autoDeleteInterval}`, 'info', 'Auto Delete Test')

      // Auto-delete after the Sandbox has been stopped for 1 hour
      await sandbox1.setAutoDeleteInterval(60)
      this.addLog(`Auto-delete set to 1 hour: ${sandbox1.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Delete immediately upon stopping
      await sandbox1.setAutoDeleteInterval(0)
      this.addLog(`Auto-delete immediate: ${sandbox1.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Disable auto-delete
      await sandbox1.setAutoDeleteInterval(-1)
      this.addLog(`Auto-delete disabled: ${sandbox1.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Auto-delete after the Sandbox has been stopped for 1 day
      const sandbox2 = await daytona.create({
        autoDeleteInterval: 1440,
      })
      this.addLog(`Sandbox2 auto-delete (1 day): ${sandbox2.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Cleanup
      await sandbox1.delete()
      await sandbox2.delete()
      this.addLog('Cleaned up sandboxes', 'info', 'Auto Delete Test')
    })
  }

  // Example 8: Charts Test
  private async runChartsTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Charts Test', async () => {
      const sandbox = await daytona.create()

      const code = `
import matplotlib.pyplot as plt
import numpy as np

# Sample data
x = np.linspace(0, 10, 30)
y = np.sin(x)
categories = ['A', 'B', 'C', 'D', 'E']
values = [40, 63, 15, 25, 8]

# 1. Line Chart
plt.figure(figsize=(8, 5))
plt.plot(x, y, 'b-', linewidth=2)
plt.title('Line Chart')
plt.xlabel('X-axis (seconds)')
plt.ylabel('Y-axis (amplitude)')
plt.grid(True)
plt.show()

# 2. Bar Chart
plt.figure(figsize=(10, 6))
plt.bar(categories, values, color='skyblue', edgecolor='navy')
plt.title('Bar Chart')
plt.xlabel('Categories')
plt.ylabel('Values (count)')
plt.show()

# 3. Pie Chart
plt.figure(figsize=(8, 8))
plt.pie(values, labels=categories, autopct='%1.1f%%', shadow=True, startangle=90)
plt.title('Pie Chart (Distribution in %)')
plt.axis('equal')
plt.legend()
plt.show()
`

      const response = await sandbox.process.codeRun(code)
      if (response.exitCode !== 0) {
        this.addLog(`Execution failed with exit code ${response.exitCode}`, 'error', 'Charts Test')
        this.addLog(`Output: ${response.artifacts?.stdout}`, 'error', 'Charts Test')
      } else {
        this.addLog('Chart execution successful', 'success', 'Charts Test')
        for (const chart of response.artifacts?.charts || []) {
          this.addLog(`Generated chart: ${chart.title} (${chart.type})`, 'success', 'Charts Test')
          if (chart.png) {
            this.addLog(`Chart has image data (${chart.png.length} chars)`, 'info', 'Charts Test')
          }
        }
      }

      // Cleanup
      await daytona.delete(sandbox)
      this.addLog('Sandbox cleaned up', 'info', 'Charts Test')
    })
  }

  // Example 9: Auto Archive Test
  private async runAutoArchiveTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Auto Archive Test', async () => {
      // Default interval
      const sandbox1 = await daytona.create()
      this.addLog(`Default auto-archive interval: ${sandbox1.autoArchiveInterval}`, 'info', 'Auto Archive Test')

      // Set interval to 1 hour
      await sandbox1.setAutoArchiveInterval(60)
      this.addLog(`Auto-archive set to 1 hour: ${sandbox1.autoArchiveInterval}`, 'success', 'Auto Archive Test')

      // Max interval
      const sandbox2 = await daytona.create({
        autoArchiveInterval: 0,
      })
      this.addLog(`Sandbox2 auto-archive (max): ${sandbox2.autoArchiveInterval}`, 'success', 'Auto Archive Test')

      // 1 day interval
      const sandbox3 = await daytona.create({
        autoArchiveInterval: 1440,
      })
      this.addLog(`Sandbox3 auto-archive (1 day): ${sandbox3.autoArchiveInterval}`, 'success', 'Auto Archive Test')

      // Cleanup
      await sandbox1.delete()
      await sandbox2.delete()
      await sandbox3.delete()
      this.addLog('Cleaned up all sandboxes', 'info', 'Auto Archive Test')
    })
  }

  // Example 10: Bun-specific Performance Test
  private async runBunPerformanceTest(daytona: Daytona) {
    await this.runTestWithErrorHandling('Bun Performance Test', async () => {
      const sandbox = await daytona.create({
        language: 'typescript',
      })

      // Test Bun's built-in performance features
      this.addLog('Testing Bun performance features...', 'info', 'Bun Performance Test')

      // Test file I/O performance
      const fileIOTest = `
        const start = performance.now();
        const data = 'test data '.repeat(10000);
        await Bun.write('test-file.txt', data);
        const content = await Bun.file('test-file.txt').text();
        const end = performance.now();
        console.log(\`File I/O took \${end - start} milliseconds\`);
      `

      const ioResult = await sandbox.process.codeRun(fileIOTest)
      this.addLog(`File I/O performance: ${ioResult.result}`, 'success', 'Bun Performance Test')

      // Test HTTP request performance
      const httpTest = `
        const start = performance.now();
        const response = await fetch('https://httpbin.org/json');
        const data = await response.json();
        const end = performance.now();
        console.log(\`HTTP request took \${end - start} milliseconds\`);
        console.log('Response received:', Object.keys(data).length, 'keys');
      `

      const httpResult = await sandbox.process.codeRun(httpTest)
      this.addLog(`HTTP performance: ${httpResult.result}`, 'success', 'Bun Performance Test')

      // Cleanup
      await daytona.delete(sandbox)
      this.addLog('Sandbox cleaned up', 'info', 'Bun Performance Test')
    })
  }

  public async runAllTests() {
    console.log('\x1b[36m🚀 Starting comprehensive Daytona SDK tests for Bun...\x1b[0m')
    console.log(`\x1b[33mBun version: ${typeof Bun !== 'undefined' ? Bun.version : 'unknown'}\x1b[0m`)
    console.log(`\x1b[33mPlatform: ${process.platform}\x1b[0m`)
    console.log(`\x1b[33mArchitecture: ${process.arch}\x1b[0m`)

    // Initialize test results
    const tests = [
      'Volumes Test',
      'Lifecycle Test',
      'File Operations Test',
      'Exec Command Test',
      'Declarative Image Test',
      'Git LSP Test',
      'Auto Delete Test',
      'Charts Test',
      'Auto Archive Test',
      'Bun Performance Test',
    ]

    this.testResults = tests.map((name) => ({
      name,
      status: 'pending' as const,
      logs: [],
    }))

    this.addLog('🚀 Starting comprehensive Daytona SDK tests for Bun...', 'info', 'general')

    try {
      // Get API key from environment variable
      const apiKey = process.env.DAYTONA_API_KEY
      if (!apiKey) {
        throw new Error('DAYTONA_API_KEY environment variable is required')
      }

      const daytona = new Daytona({
        apiKey: apiKey,
      })
      this.addLog('Created Daytona instance', 'success', 'general')

      // Run all tests
      await this.runVolumesTest(daytona)
      await this.runLifecycleTest(daytona)
      await this.runFileOperationsTest(daytona)
      await this.runExecCommandTest(daytona)
      await this.runDeclarativeImageTest(daytona)
      await this.runGitLspTest(daytona)
      await this.runAutoDeleteTest(daytona)
      await this.runChartsTest(daytona)
      await this.runAutoArchiveTest(daytona)
      await this.runBunPerformanceTest(daytona)
    } catch (error) {
      this.addLog(`❌ Error in main execution: ${error}`, 'error', 'general')
      console.error(error)
    } finally {
      this.addLog('🏁 All Daytona SDK tests for Bun completed!', 'info', 'general')
      this.printSummary()
    }
  }

  private printSummary() {
    console.log('\n\x1b[36m📊 Test Summary:\x1b[0m')
    const successful = this.testResults.filter((t) => t.status === 'success').length
    const failed = this.testResults.filter((t) => t.status === 'error').length
    const total = this.testResults.length

    console.log(`\x1b[32m✅ Successful: ${successful}/${total}\x1b[0m`)
    if (failed > 0) {
      console.log(`\x1b[31m❌ Failed: ${failed}/${total}\x1b[0m`)
    }

    this.testResults.forEach((test) => {
      const icon = test.status === 'success' ? '✅' : test.status === 'error' ? '❌' : '⏳'
      const color = test.status === 'success' ? '\x1b[32m' : test.status === 'error' ? '\x1b[31m' : '\x1b[33m'
      console.log(`${color}${icon} ${test.name}\x1b[0m`)
    })

    // Bun-specific performance summary
    console.log('\n\x1b[35m⚡ Bun Runtime Benefits:\x1b[0m')
    console.log('\x1b[35m• Fast startup times\x1b[0m')
    console.log('\x1b[35m• Built-in TypeScript support\x1b[0m')
    console.log('\x1b[35m• Optimized file I/O\x1b[0m')
    console.log('\x1b[35m• All-in-one runtime, bundler, and package manager\x1b[0m')
  }
}

// Main execution
async function main() {
  const tester = new DaytonaBunTester()
  await tester.runAllTests()
}

// Run if this is the main module (Bun compatible)
if (typeof Bun !== 'undefined' || process.argv[1] === __filename) {
  main().catch(console.error)
}
