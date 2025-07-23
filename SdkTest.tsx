/*
 * Copyright 2025 Daytona Platforms Inc.
 * SPDX-License-Identifier: AGPL-3.0
 */

import { useState, useEffect } from 'react'
import { Buffer } from 'buffer'

// Import Daytona SDK
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

function SdkTest() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [currentTest, setCurrentTest] = useState<string>('')

  const addLog = (message: string, type: LogEntry['type'] = 'info', category = 'general') => {
    const logEntry = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      category,
    }
    setLogs((prev) => [...prev, logEntry])

    // Also add to current test results
    setTestResults((prev) =>
      prev.map((test) => (test.name === category ? { ...test, logs: [...test.logs, logEntry] } : test)),
    )
  }

  const updateTestStatus = (testName: string, status: TestResult['status']) => {
    setTestResults((prev) => prev.map((test) => (test.name === testName ? { ...test, status } : test)))
  }

  const runTestWithErrorHandling = async (testName: string, testFn: () => Promise<void>) => {
    setCurrentTest(testName)
    updateTestStatus(testName, 'running')
    addLog(`🔄 Starting ${testName}...`, 'info', testName)

    try {
      await testFn()
      updateTestStatus(testName, 'success')
      addLog(`✅ ${testName} completed successfully!`, 'success', testName)
    } catch (error) {
      updateTestStatus(testName, 'error')
      addLog(`❌ Error in ${testName}: ${error}`, 'error', testName)
      console.error(`Error in ${testName}:`, error)
    }
  }

  // Example 1: Volumes Test
  const runVolumesTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Volumes Test', async () => {
      // Create a new volume or get an existing one
      const volume = await daytona.volume.get('my-volume', true)
      addLog('Created/Retrieved volume: my-volume', 'info', 'Volumes Test')

      // Mount the volume to the sandbox
      const mountDir1 = '/home/daytona/volume'
      const sandbox1 = await daytona.create({
        language: 'typescript',
        volumes: [{ volumeId: volume.id, mountPath: mountDir1 }],
      })
      addLog(`Created sandbox1 with volume mounted at ${mountDir1}`, 'success', 'Volumes Test')

      // Create a new directory in the mount directory
      const newDir = `${mountDir1}/new-dir`
      await sandbox1.fs.createFolder(newDir, '755')
      addLog(`Created directory: ${newDir}`, 'info', 'Volumes Test')

      // Create a new file in the mount directory
      const newFile = `${mountDir1}/new-file.txt`
      await sandbox1.fs.uploadFile(Buffer.from('Hello, World!'), newFile)
      addLog(`Created file: ${newFile}`, 'info', 'Volumes Test')

      // Create a new sandbox with the same volume
      const mountDir2 = '/home/daytona/my-files'
      const sandbox2 = await daytona.create({
        language: 'typescript',
        volumes: [{ volumeId: volume.id, mountPath: mountDir2 }],
      })
      addLog(`Created sandbox2 with volume mounted at ${mountDir2}`, 'success', 'Volumes Test')

      // List files in the mount directory
      const files = await sandbox2.fs.listFiles(mountDir2)
      addLog(`Files in ${mountDir2}: ${JSON.stringify(files)}`, 'info', 'Volumes Test')

      // Get the file from the first sandbox
      const file = await sandbox1.fs.downloadFile(newFile)
      addLog(`File content: ${file.toString()}`, 'success', 'Volumes Test')

      // Cleanup
      await daytona.delete(sandbox1)
      await daytona.delete(sandbox2)
      addLog('Cleaned up sandboxes', 'info', 'Volumes Test')
    })
  }

  // Example 2: Lifecycle Test
  const runLifecycleTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Lifecycle Test', async () => {
      addLog('Creating sandbox', 'info', 'Lifecycle Test')
      const sandbox = await daytona.create()
      addLog('Sandbox created', 'success', 'Lifecycle Test')

      await sandbox.setLabels({
        public: 'true',
      })
      addLog('Set labels on sandbox', 'info', 'Lifecycle Test')

      addLog('Stopping sandbox', 'info', 'Lifecycle Test')
      await sandbox.stop()
      addLog('Sandbox stopped', 'success', 'Lifecycle Test')

      addLog('Starting sandbox', 'info', 'Lifecycle Test')
      await sandbox.start()
      addLog('Sandbox started', 'success', 'Lifecycle Test')

      addLog('Getting existing sandbox', 'info', 'Lifecycle Test')
      const existingSandbox = await daytona.get(sandbox.id)
      addLog('Got existing sandbox', 'success', 'Lifecycle Test')

      const response = await existingSandbox.process.executeCommand(
        'echo "Hello World from exec!"',
        undefined,
        undefined,
        10,
      )
      if (response.exitCode !== 0) {
        addLog(`Command error: ${response.exitCode} ${response.result}`, 'error', 'Lifecycle Test')
      } else {
        addLog(`Command result: ${response.result}`, 'success', 'Lifecycle Test')
      }

      const sandboxes = await daytona.list()
      addLog(`Total sandboxes count: ${sandboxes.length}`, 'info', 'Lifecycle Test')

      addLog(`Sandbox info -> id: ${sandboxes[0].id} state: ${sandboxes[0].state}`, 'info', 'Lifecycle Test')

      addLog('Deleting sandbox', 'info', 'Lifecycle Test')
      await sandbox.delete()
      addLog('Sandbox deleted', 'success', 'Lifecycle Test')
    })
  }

  // Example 3: Git LSP Test
  const runGitLspTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Git LSP Test', async () => {
      const sandbox = await daytona.create()

      const projectDir = 'learn-typescript'

      // Clone the repository
      await sandbox.git.clone('https://github.com/panaverse/learn-typescript', projectDir, 'master')
      addLog('Repository cloned successfully', 'success', 'Git LSP Test')

      // Search for the file we want to work on
      const matches = await sandbox.fs.findFiles(projectDir, 'var obj1 = new Base();')
      addLog(`Matches found: ${JSON.stringify(matches)}`, 'info', 'Git LSP Test')

      if (matches.length > 0) {
        // Start the language server
        const lsp = await sandbox.createLspServer('typescript', projectDir)
        await lsp.start()
        addLog('Language server started', 'success', 'Git LSP Test')

        // Notify the language server of the document we want to work on
        await lsp.didOpen(matches[0].file!)
        addLog(`Opened file: ${matches[0].file}`, 'info', 'Git LSP Test')

        // Get symbols in the document
        const symbols = await lsp.documentSymbols(matches[0].file!)
        addLog(`Symbols: ${JSON.stringify(symbols)}`, 'info', 'Git LSP Test')

        // Fix the error in the document
        await sandbox.fs.replaceInFiles([matches[0].file!], 'var obj1 = new Base();', 'var obj1 = new E();')
        addLog('Fixed error in document', 'success', 'Git LSP Test')

        // Notify the language server of the document change
        await lsp.didClose(matches[0].file!)
        await lsp.didOpen(matches[0].file!)

        // Get completions at a specific position
        const completions = await lsp.completions(matches[0].file!, {
          line: 12,
          character: 18,
        })
        addLog(`Completions: ${JSON.stringify(completions)}`, 'info', 'Git LSP Test')
      }

      // Cleanup
      await daytona.delete(sandbox)
      addLog('Sandbox cleaned up', 'info', 'Git LSP Test')
    })
  }

  // Example 4: File Operations Test
  const runFileOperationsTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('File Operations Test', async () => {
      const sandbox = await daytona.create()
      addLog(`Created sandbox with ID: ${sandbox.id}`, 'success', 'File Operations Test')

      // List files in the sandbox
      const files = await sandbox.fs.listFiles('~')
      addLog(`Initial files: ${JSON.stringify(files)}`, 'info', 'File Operations Test')

      // Create a new directory in the sandbox
      const newDir = '~/project-files'
      await sandbox.fs.createFolder(newDir, '755')
      addLog(`Created directory: ${newDir}`, 'success', 'File Operations Test')

      // Create configuration data
      const configData = JSON.stringify(
        {
          name: 'project-config',
          version: '1.0.0',
          settings: {
            debug: true,
            maxConnections: 10,
          },
        },
        null,
        2,
      )

      // Upload multiple files at once
      await sandbox.fs.uploadFiles([
        {
          source: '/my-file',
          destination: `${newDir}/example.txt`,
        },
        {
          source: Buffer.from(configData),
          destination: `${newDir}/config.json`,
        },
        {
          source: Buffer.from('#!/bin/bash\necho "Hello from script!"\nexit 0'),
          destination: `${newDir}/script.sh`,
        },
      ])
      addLog('Uploaded multiple files', 'success', 'File Operations Test')

      // Execute commands on the sandbox to verify files and make them executable
      const lsResult = await sandbox.process.executeCommand(`ls -la ${newDir}`)
      addLog(`Files in directory: ${lsResult.result}`, 'info', 'File Operations Test')

      // Make the script executable
      await sandbox.process.executeCommand(`chmod +x ${newDir}/script.sh`)

      // Run the script
      const scriptResult = await sandbox.process.executeCommand(`${newDir}/script.sh`)
      addLog(`Script output: ${scriptResult.result}`, 'success', 'File Operations Test')

      // Search for files in the project
      const matches = await sandbox.fs.searchFiles(newDir, '*.json')
      addLog(`JSON files found: ${JSON.stringify(matches)}`, 'info', 'File Operations Test')

      // Replace content in config file
      await sandbox.fs.replaceInFiles([`${newDir}/config.json`], '"debug": true', '"debug": false')

      // Download the modified config file
      const configContent = await sandbox.fs.downloadFile(`${newDir}/config.json`)
      addLog(`Updated config: ${configContent.toString()}`, 'success', 'File Operations Test')

      // Create a report of all operations
      const reportData = `
Project Files Report:
---------------------
Time: ${new Date().toISOString()}
Files: ${matches.files.length} JSON files found
Config: ${configContent.includes('"debug": false') ? 'Production mode' : 'Debug mode'}
Script: ${scriptResult.exitCode === 0 ? 'Executed successfully' : 'Failed'}
      `.trim()

      // Save the report
      await sandbox.fs.uploadFile(Buffer.from(reportData), `${newDir}/report.txt`)
      addLog('Created and saved report', 'success', 'File Operations Test')

      // Cleanup
      await daytona.delete(sandbox)
      addLog('Sandbox cleaned up', 'info', 'File Operations Test')
    })
  }

  // Example 5: Exec Command Test
  const runExecCommandTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Exec Command Test', async () => {
      const sandbox = await daytona.create({
        language: 'typescript',
      })

      // Basic Exec Test
      addLog('Running basic execution tests...', 'info', 'Exec Command Test')

      // Run some typescript code directly
      const codeResult = await sandbox.process.codeRun('console.log("Hello World from code!")')
      if (codeResult.exitCode !== 0) {
        addLog(`Error running code: ${codeResult.exitCode}`, 'error', 'Exec Command Test')
      } else {
        addLog(`Code result: ${codeResult.result}`, 'success', 'Exec Command Test')
      }

      // Run OS command
      const cmdResult = await sandbox.process.executeCommand('echo "Hello World from CMD!"')
      if (cmdResult.exitCode !== 0) {
        addLog(`Error running command: ${cmdResult.exitCode}`, 'error', 'Exec Command Test')
      } else {
        addLog(`Command result: ${cmdResult.result}`, 'success', 'Exec Command Test')
      }

      // Session Exec Test
      addLog('Running session execution tests...', 'info', 'Exec Command Test')

      // Create exec session
      await sandbox.process.createSession('exec-session-1')
      addLog('Created session: exec-session-1', 'success', 'Exec Command Test')

      // Get the session details
      const session = await sandbox.process.getSession('exec-session-1')
      addLog(`Session details: ${JSON.stringify(session, null, 2)}`, 'info', 'Exec Command Test')

      // Execute a first command in the session
      const command = await sandbox.process.executeSessionCommand('exec-session-1', {
        command: 'export FOO=BAR',
      })

      // Get the session details again
      const sessionUpdated = await sandbox.process.getSession('exec-session-1')
      addLog(`Session updated: ${JSON.stringify(sessionUpdated, null, 2)}`, 'info', 'Exec Command Test')

      // Get the command details
      const sessionCommand = await sandbox.process.getSessionCommand('exec-session-1', command.cmdId!)
      addLog(`Session command: ${JSON.stringify(sessionCommand, null, 2)}`, 'info', 'Exec Command Test')

      // Execute a second command to check environment variable
      const response = await sandbox.process.executeSessionCommand('exec-session-1', {
        command: 'echo $FOO',
      })
      addLog(`FOO=${response.output}`, 'success', 'Exec Command Test')

      // Get logs for the command
      const logsResult = await sandbox.process.getSessionCommandLogs('exec-session-1', response.cmdId!)
      addLog(`Command logs: ${JSON.stringify(logsResult, null, 2)}`, 'info', 'Exec Command Test')

      // Delete the session
      await sandbox.process.deleteSession('exec-session-1')
      addLog('Deleted session: exec-session-1', 'success', 'Exec Command Test')

      // Async Logs Test
      addLog('Testing async command execution...', 'info', 'Exec Command Test')

      const sessionId = 'exec-session-async-logs'
      await sandbox.process.createSession(sessionId)
      addLog(`Created async session: ${sessionId}`, 'success', 'Exec Command Test')

      const asyncCommand = await sandbox.process.executeSessionCommand(sessionId, {
        command: 'counter=1; while (( counter <= 3 )); do echo "Count: $counter"; ((counter++)); sleep 1; done',
        runAsync: true,
      })

      addLog('Started long-running command, streaming logs...', 'info', 'Exec Command Test')

      await sandbox.process.getSessionCommandLogs(sessionId, asyncCommand.cmdId!, (chunk) => {
        addLog(`Log chunk: ${chunk}`, 'success', 'Exec Command Test')
      })

      addLog('Finished streaming logs', 'success', 'Exec Command Test')

      // Cleanup
      await daytona.delete(sandbox)
      addLog('Sandbox cleaned up', 'info', 'Exec Command Test')
    })
  }

  // Example 6: Declarative Image Test
  const runDeclarativeImageTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Declarative Image Test', async () => {
      // Generate unique name for the snapshot to avoid conflicts
      const snapshotName = `node-example:${Date.now()}`
      addLog(`Creating snapshot with name: ${snapshotName}`, 'info', 'Declarative Image Test')

      // Create a Python image with common data science packages
      const image = Image.debianSlim('3.12')
        .pipInstall(['numpy', 'pandas', 'matplotlib', 'scipy', 'scikit-learn'])
        .runCommands('apt-get update && apt-get install -y git', 'mkdir -p /home/daytona/workspace')
        .workdir('/home/daytona/workspace')
        .env({
          MY_ENV_VAR: 'My Environment Variable',
        })

      // Create the snapshot
      addLog(`Creating Snapshot: ${snapshotName}`, 'info', 'Declarative Image Test')
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
          onLogs: (log) => addLog(`Snapshot: ${log}`, 'info', 'Declarative Image Test'),
        },
      )

      // Create first sandbox using the pre-built image
      addLog('Creating Sandbox from Pre-built Snapshot', 'info', 'Declarative Image Test')
      const sandbox1 = await daytona.create({
        snapshot: snapshotName,
      })

      // Verify the first sandbox environment
      addLog('Verifying sandbox from pre-built image:', 'info', 'Declarative Image Test')
      const pythonResponse = await sandbox1.process.executeCommand('python --version && pip list')
      addLog(`Python environment: ${pythonResponse.result}`, 'success', 'Declarative Image Test')

      // Clean up first sandbox
      await daytona.delete(sandbox1)

      // Create second sandbox with a new dynamic image
      addLog('Creating Sandbox with Dynamic Image', 'info', 'Declarative Image Test')

      // Define a new dynamic image for the second sandbox
      const dynamicImage = Image.debianSlim('3.13')
        .pipInstall(['pytest', 'pytest-cov', 'black', 'isort', 'mypy', 'ruff'])
        .runCommands('apt-get update && apt-get install -y git', 'mkdir -p /home/daytona/project')
        .workdir('/home/daytona/project')
        .env({
          NODE_ENV: 'development',
        })

      // Create sandbox with the dynamic image
      const sandbox2 = await daytona.create(
        {
          image: dynamicImage,
        },
        {
          timeout: 0,
          onSnapshotCreateLogs: (log) => addLog(`Snapshot: ${log}`, 'info', 'Declarative Image Test'),
        },
      )

      // Verify the second sandbox environment
      addLog('Verifying sandbox with dynamic image:', 'info', 'Declarative Image Test')
      const toolsResponse = await sandbox2.process.executeCommand('pip list | grep -E "pytest|black|isort|mypy|ruff"')
      addLog(`Development tools: ${toolsResponse.result}`, 'success', 'Declarative Image Test')

      // Clean up second sandbox
      await daytona.delete(sandbox2)
      addLog('Cleaned up sandboxes', 'info', 'Declarative Image Test')
    })
  }

  // Example 7: Auto Delete Test
  const runAutoDeleteTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Auto Delete Test', async () => {
      // Auto-delete is disabled by default
      const sandbox1 = await daytona.create()
      addLog(`Default auto-delete interval: ${sandbox1.autoDeleteInterval}`, 'info', 'Auto Delete Test')

      // Auto-delete after the Sandbox has been stopped for 1 hour
      await sandbox1.setAutoDeleteInterval(60)
      addLog(`Auto-delete set to 1 hour: ${sandbox1.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Delete immediately upon stopping
      await sandbox1.setAutoDeleteInterval(0)
      addLog(`Auto-delete immediate: ${sandbox1.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Disable auto-delete
      await sandbox1.setAutoDeleteInterval(-1)
      addLog(`Auto-delete disabled: ${sandbox1.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Auto-delete after the Sandbox has been stopped for 1 day
      const sandbox2 = await daytona.create({
        autoDeleteInterval: 1440,
      })
      addLog(`Sandbox2 auto-delete (1 day): ${sandbox2.autoDeleteInterval}`, 'success', 'Auto Delete Test')

      // Cleanup
      await sandbox1.delete()
      await sandbox2.delete()
      addLog('Cleaned up sandboxes', 'info', 'Auto Delete Test')
    })
  }

  // Example 8: Charts Test
  const runChartsTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Charts Test', async () => {
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
        addLog(`Execution failed with exit code ${response.exitCode}`, 'error', 'Charts Test')
        addLog(`Output: ${response.artifacts?.stdout}`, 'error', 'Charts Test')
      } else {
        addLog('Chart execution successful', 'success', 'Charts Test')
        for (const chart of response.artifacts?.charts || []) {
          addLog(`Generated chart: ${chart.title} (${chart.type})`, 'success', 'Charts Test')
          if (chart.png) {
            addLog(`Chart has image data (${chart.png.length} chars)`, 'info', 'Charts Test')
          }
        }
      }

      // Cleanup
      await daytona.delete(sandbox)
      addLog('Sandbox cleaned up', 'info', 'Charts Test')
    })
  }

  // Example 9: Auto Archive Test
  const runAutoArchiveTest = async (daytona: Daytona) => {
    await runTestWithErrorHandling('Auto Archive Test', async () => {
      // Default interval
      const sandbox1 = await daytona.create()
      addLog(`Default auto-archive interval: ${sandbox1.autoArchiveInterval}`, 'info', 'Auto Archive Test')

      // Set interval to 1 hour
      await sandbox1.setAutoArchiveInterval(60)
      addLog(`Auto-archive set to 1 hour: ${sandbox1.autoArchiveInterval}`, 'success', 'Auto Archive Test')

      // Max interval
      const sandbox2 = await daytona.create({
        autoArchiveInterval: 0,
      })
      addLog(`Sandbox2 auto-archive (max): ${sandbox2.autoArchiveInterval}`, 'success', 'Auto Archive Test')

      // 1 day interval
      const sandbox3 = await daytona.create({
        autoArchiveInterval: 1440,
      })
      addLog(`Sandbox3 auto-archive (1 day): ${sandbox3.autoArchiveInterval}`, 'success', 'Auto Archive Test')

      // Cleanup
      await sandbox1.delete()
      await sandbox2.delete()
      await sandbox3.delete()
      addLog('Cleaned up all sandboxes', 'info', 'Auto Archive Test')
    })
  }

  const runAllDaytonaTests = async () => {
    if (isRunning) return

    setIsRunning(true)
    setLogs([])

    // Initialize test results
    const tests = [
      'Volumes Test',
      'Lifecycle Test',
      'Git LSP Test',
      'File Operations Test',
      'Exec Command Test',
      'Declarative Image Test',
      'Auto Delete Test',
      'Charts Test',
      'Auto Archive Test',
    ]

    setTestResults(
      tests.map((name) => ({
        name,
        status: 'pending' as const,
        logs: [],
      })),
    )

    addLog('🚀 Starting comprehensive Daytona SDK tests...', 'info', 'general')

    try {
      const daytona = new Daytona({
        apiKey: 'dtn_e3c4797ad2310b5de5a4f4c4dbd2899b6e5c2a442fef1cba4280416f098e04ca',
      })
      addLog('Created Daytona instance', 'success', 'general')

      // Run all tests
      await runVolumesTest(daytona)
      await runLifecycleTest(daytona)
      await runGitLspTest(daytona)
      await runFileOperationsTest(daytona)
      await runExecCommandTest(daytona)
      await runDeclarativeImageTest(daytona)
      await runAutoDeleteTest(daytona)
      await runChartsTest(daytona)
      await runAutoArchiveTest(daytona)
    } catch (error) {
      addLog(`❌ Error in main execution: ${error}`, 'error', 'general')
      console.error(error)
    } finally {
      setIsRunning(false)
      addLog('🏁 All Daytona SDK tests completed!', 'info', 'general')
    }
  }

  const clearLogs = () => {
    setLogs([])
    setTestResults([])
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return '#ef4444'
      case 'success':
        return '#10b981'
      case 'warning':
        return '#f59e0b'
      default:
        return '#c9d1d9'
    }
  }

  const getTestStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '#10b981'
      case 'error':
        return '#ef4444'
      case 'running':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  const getTestStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'running':
        return '🔄'
      default:
        return '⏳'
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'monospace',
        backgroundColor: '#0d1117',
        color: '#c9d1d9',
        minHeight: '100vh',
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .running-icon {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
      <h1 style={{ color: '#58a6ff', textAlign: 'center' }}>🚀 Daytona SDK Comprehensive Test Suite</h1>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div
          style={{
            backgroundColor: '#1f2937',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ color: '#f97316', marginBottom: '15px' }}>🎮 Control Panel</h2>

          <button
            onClick={runAllDaytonaTests}
            disabled={isRunning}
            style={{
              backgroundColor: isRunning ? '#6b7280' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              marginRight: '15px',
              boxShadow: isRunning ? 'none' : '0 4px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            {isRunning ? '🔄 Running All Tests...' : '🚀 START ALL TESTS'}
          </button>

          <button
            onClick={clearLogs}
            disabled={isRunning}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              boxShadow: isRunning ? 'none' : '0 4px 8px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            🗑️ CLEAR LOGS
          </button>
        </div>

        {!isRunning && logs.length === 0 && (
          <div
            style={{
              backgroundColor: '#065f46',
              border: '2px solid #10b981',
              borderRadius: '8px',
              padding: '15px',
              color: '#10b981',
              fontSize: '16px',
              animation: 'pulse 2s infinite',
            }}
          >
            👆 Click "START ALL TESTS" to run all TypeScript examples!
          </div>
        )}
      </div>

      {/* Test Status Overview */}
      {testResults.length > 0 && (
        <div
          style={{
            backgroundColor: '#1f2937',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ color: '#f97316', marginBottom: '15px' }}>📊 Test Status Overview:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            {testResults.map((test) => (
              <div
                key={test.name}
                style={{
                  backgroundColor: '#0f172a',
                  border: `2px solid ${getTestStatusColor(test.status)}`,
                  borderRadius: '6px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#c9d1d9' }}>{test.name}</span>
                <span className={test.status === 'running' ? 'running-icon' : ''} style={{ fontSize: '18px' }}>
                  {getTestStatusIcon(test.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div
          style={{
            backgroundColor: '#1f2937',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px',
          }}
        >
          <h3 style={{ color: '#f97316', marginBottom: '15px' }}>📋 Execution Logs:</h3>
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '4px',
              padding: '15px',
              maxHeight: '600px',
              overflow: 'auto',
            }}
          >
            {logs.map((log, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '8px',
                  padding: '4px',
                  borderLeft: `3px solid ${getLogColor(log.type)}`,
                  paddingLeft: '8px',
                }}
              >
                <span style={{ color: '#64748b', fontSize: '12px' }}>[{log.timestamp}]</span>{' '}
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>[{log.category}]</span>{' '}
                <span style={{ color: getLogColor(log.type) }}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTest && (
        <div
          style={{
            backgroundColor: '#065f46',
            border: '2px solid #10b981',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#10b981' }}>🔄 Currently Running: {currentTest}</span>
        </div>
      )}
    </div>
  )
}

export default SdkTest
