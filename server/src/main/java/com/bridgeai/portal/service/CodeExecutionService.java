package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.ExamDtos.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class CodeExecutionService {

    private static final int DEFAULT_TIMEOUT_SECONDS = 5;

    /**
     * Shared pool for stdout/stderr/stdin pumping threads.
     * FIX (#3, thread leak): previously a brand-new single-thread executor was created
     * (and never shut down) for every single test case run. Under load this leaked
     * non-daemon threads without bound. We now use one bounded, daemon-backed pool for
     * the lifetime of the service, and shut it down on bean destruction.
     */
    private final ExecutorService ioPool = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "code-exec-io");
        t.setDaemon(true);
        return t;
    });

    @PreDestroy
    public void shutdown() {
        ioPool.shutdownNow();
    }

    public static class ExecutionResult {
        public String status; // "SUCCESS", "COMPILATION_ERROR", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED"
        public String compilerOutput;
        public List<TestCaseExecutionResultDto> testCaseResults = new ArrayList<>();
        public int passedCount = 0;
        public int totalCount = 0;
        public long totalExecutionTimeMs = 0;
    }

    /**
     * Executes code against a list of test cases (for interactive testing or final submission).
     */
    public ExecutionResult execute(String language, String code, List<CodingTestCaseDto> testCases, int timeLimitSeconds) {
        if (timeLimitSeconds <= 0) {
            timeLimitSeconds = DEFAULT_TIMEOUT_SECONDS;
        }

        String lang = language != null ? language.trim().toLowerCase() : "python";
        if (lang.equals("c++")) lang = "cpp";
        if (lang.equals("c#")) lang = "csharp";

        ExecutionResult result = new ExecutionResult();
        if (testCases == null || testCases.isEmpty()) {
            // Run single test with empty input
            testCases = Collections.singletonList(
                    CodingTestCaseDto.builder().id(0L).input("").expectedOutput("").sample(true).build()
            );
        }
        result.totalCount = testCases.size();

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("bridgeai_exec_");

            // Step 1: Write code file
            String sourceFileName = getSourceFileName(lang, code);
            Path sourceFile = tempDir.resolve(sourceFileName);
            Files.writeString(sourceFile, code, StandardCharsets.UTF_8);

            // Step 2: Compile (if compiled language)
            String compileError = compileCode(lang, tempDir, sourceFileName);
            if (compileError != null) {
                result.status = "COMPILATION_ERROR";
                result.compilerOutput = compileError;
                for (CodingTestCaseDto tc : testCases) {
                    result.testCaseResults.add(TestCaseExecutionResultDto.builder()
                            .id(tc.getId())
                            .input(tc.getInput())
                            .expectedOutput(tc.getExpectedOutput())
                            .actualOutput("")
                            .passed(false)
                            .executionTimeMs(0)
                            .error("Compilation Error:\n" + compileError)
                            .sample(tc.isSample())
                            .build());
                }
                return result;
            }

            // Step 3: Run against each test case
            boolean hasRuntimeError = false;
            boolean hasTimeout = false;

            for (CodingTestCaseDto tc : testCases) {
                TestCaseRunResult runRes = runSingleTestCase(lang, tempDir, sourceFileName, tc.getInput(), timeLimitSeconds);
                result.totalExecutionTimeMs += runRes.executionTimeMs;

                String normalizedActual = normalizeOutput(runRes.stdout);
                String normalizedExpected = normalizeOutput(tc.getExpectedOutput());
                boolean passed = runRes.success && normalizedActual.equals(normalizedExpected);

                if (passed) {
                    result.passedCount++;
                }
                if (runRes.isTimeout) {
                    hasTimeout = true;
                } else if (!runRes.success && runRes.error != null && !runRes.error.isBlank()) {
                    hasRuntimeError = true;
                }

                result.testCaseResults.add(TestCaseExecutionResultDto.builder()
                        .id(tc.getId())
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .actualOutput(runRes.stdout != null ? runRes.stdout : "")
                        .passed(passed)
                        .executionTimeMs(runRes.executionTimeMs)
                        .error(runRes.error)
                        .sample(tc.isSample())
                        .build());
            }

            if (hasTimeout) {
                result.status = "TIME_LIMIT_EXCEEDED";
            } else if (hasRuntimeError && result.passedCount == 0) {
                result.status = "RUNTIME_ERROR";
            } else {
                result.status = "SUCCESS";
            }

            return result;

        } catch (Exception e) {
            log.error("Execution failure for language {}", lang, e);
            result.status = "RUNTIME_ERROR";
            result.compilerOutput = "System Execution Exception: " + e.getMessage();
            return result;
        } finally {
            if (tempDir != null) {
                deleteDirectoryRecursively(tempDir.toFile());
            }
        }
    }

    private String getSourceFileName(String lang, String code) {
        switch (lang) {
            case "c":
                return "Solution.c";
            case "cpp":
                return "Solution.cpp";
            case "java": {
                // Check if public class defined
                Pattern pattern = Pattern.compile("public\\s+class\\s+([A-Za-z0-9_]+)");
                Matcher matcher = pattern.matcher(code);
                if (matcher.find()) {
                    return matcher.group(1) + ".java";
                }
                return "Main.java";
            }
            case "csharp":
                return "Solution.cs";
            case "kotlin":
                return "Solution.kt";
            case "python":
            default:
                return "solution.py";
        }
    }

    private String compileCode(String lang, Path dir, String sourceFileName) {
        // FIX (#2, Kotlin/C# dead-end): runSingleTestCase always rejects these two
        // languages as unsupported, regardless of whether compilation succeeded. Actually
        // invoking kotlinc/csc here wastes real CPU time compiling something that can never
        // be executed, and made compileCode/runSingleTestCase disagree with each other.
        // Since execution support isn't implemented, fail fast here instead of pretending
        // to compile.
        if (lang.equals("kotlin") || lang.equals("csharp")) {
            return (lang.equals("kotlin") ? "Kotlin" : "C#") + " is not supported on this server";
        }

        List<String> cmd = new ArrayList<>();
        switch (lang) {
            case "c":
                cmd.add("gcc");
                cmd.add("-O2");
                cmd.add("-std=c11");
                cmd.add(sourceFileName);
                cmd.add("-o");
                cmd.add("Solution.exe");
                break;
            case "cpp":
                cmd.add("g++");
                cmd.add("-O2");
                cmd.add("-std=c++14");
                cmd.add(sourceFileName);
                cmd.add("-o");
                cmd.add("Solution.exe");
                break;
            case "java":
                cmd.add("javac");
                cmd.add("-encoding");
                cmd.add("UTF-8");
                cmd.add(sourceFileName);
                break;
            case "python":
            default:
                return null; // Interpreted, no compilation needed
        }

        if (cmd.isEmpty()) return null;

        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(dir.toFile());
            Process p = pb.start();

            boolean finished = p.waitFor(15, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                return "Compilation timed out after 15 seconds";
            }

            if (p.exitValue() != 0) {
                String errorOutput = readStream(p.getErrorStream());
                if (errorOutput.isBlank()) {
                    errorOutput = readStream(p.getInputStream());
                }
                return errorOutput.isBlank() ? "Compilation failed with exit code " + p.exitValue() : errorOutput;
            }
            return null;
        } catch (Exception e) {
            log.warn("Compiler execution notice for {}: {}", lang, e.getMessage());
            return "Compiler invocation error: " + e.getMessage();
        }
    }

    private static class TestCaseRunResult {
        boolean success;
        boolean isTimeout;
        String stdout;
        String error;
        long executionTimeMs;
    }

    private TestCaseRunResult runSingleTestCase(String lang, Path dir, String sourceFileName, String input, int timeLimitSeconds) {
        TestCaseRunResult res = new TestCaseRunResult();
        List<String> cmd = new ArrayList<>();

        switch (lang) {
            case "c":
            case "cpp":
                cmd.add(dir.resolve("Solution.exe").toString());
                break;
            case "java":
                cmd.add("java");
                cmd.add("-Xmx256m");
                cmd.add("-Dfile.encoding=UTF-8");
                String mainClassName = sourceFileName.replace(".java", "");
                cmd.add(mainClassName);
                break;
            case "python":
                cmd.add("python");
                cmd.add("-u");
                cmd.add(sourceFileName);
                break;
            case "csharp":
            case "kotlin":
                res.success = false;
                res.error = (lang.equals("kotlin") ? "Kotlin" : "C#") + " is not supported on this server";
                return res;
            default:
                cmd.add("python");
                cmd.add(sourceFileName);
                break;
        }

        long startTime = System.currentTimeMillis();
        Process process = null;
        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(dir.toFile());
            process = pb.start();
            final Process proc = process;

            // FIX (#1, stdin/stdout deadlock): stdout/stderr reader threads must be running
            // *before* we write to stdin. Previously stdin was written synchronously first;
            // if the child program interleaves reads and writes (e.g. reads a line, echoes
            // a line, reads the next line), it can fill the stdout pipe buffer before anyone
            // is draining it, block on that write, while we are still blocked writing stdin
            // -- a classic pipe deadlock. Starting the readers first, and writing stdin from
            // its own task, avoids that ordering dependency entirely.
            Future<String> stdoutFuture = ioPool.submit(() -> readStream(proc.getInputStream()));
            Future<String> stderrFuture = ioPool.submit(() -> readStream(proc.getErrorStream()));
            Future<?> stdinFuture = ioPool.submit(() -> writeStdin(proc, input));

            boolean completed = process.waitFor(timeLimitSeconds, TimeUnit.SECONDS);
            long duration = System.currentTimeMillis() - startTime;
            res.executionTimeMs = duration;

            if (!completed) {
                process.destroyForcibly();
                stdinFuture.cancel(true);
                res.isTimeout = true;
                res.success = false;
                res.error = "Time Limit Exceeded (" + timeLimitSeconds + "s)";
                // Best-effort cleanup of reader tasks; don't let them block us further.
                stdoutFuture.cancel(true);
                stderrFuture.cancel(true);
                return res;
            }

            // FIX (#4, hard-coded 1s read timeout): once the process has exited, reading
            // the remaining buffered output should be fast, but a fixed 1-second cap is
            // fragile for test cases with large stdout -- a legitimate slow read would fall
            // into the generic catch block and get mislabeled as a plain "Execution Error".
            // Give it a more generous, still-bounded window, and report a read-timeout
            // distinctly if it happens.
            long readTimeoutSeconds = Math.max(2, Math.min(timeLimitSeconds, 10));
            String stdout;
            String stderr;
            try {
                stdout = stdoutFuture.get(readTimeoutSeconds, TimeUnit.SECONDS);
                stderr = stderrFuture.get(readTimeoutSeconds, TimeUnit.SECONDS);
            } catch (TimeoutException te) {
                stdoutFuture.cancel(true);
                stderrFuture.cancel(true);
                res.success = false;
                res.error = "Timed out reading program output after process completion";
                return res;
            }

            res.stdout = stdout;
            if (process.exitValue() == 0) {
                res.success = true;
            } else {
                res.success = false;
                res.error = (stderr != null && !stderr.isBlank()) ? stderr : "Runtime exit code: " + process.exitValue();
            }
            return res;

        } catch (Exception e) {
            res.executionTimeMs = System.currentTimeMillis() - startTime;
            res.success = false;
            res.error = "Execution Error: " + e.getMessage();
            return res;
        } finally {
            if (process != null) {
                process.destroyForcibly();
            }
        }
    }

    /**
     * Writes the test case input to the process's stdin and closes it.
     * Runs on the shared io pool so it can proceed concurrently with the
     * stdout/stderr readers (see FIX #1 above).
     */
    private static void writeStdin(Process process, String input) {
        try {
            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(
                        new OutputStreamWriter(process.getOutputStream(), StandardCharsets.UTF_8))) {
                    writer.write(input);
                    if (!input.endsWith("\n")) {
                        writer.newLine();
                    }
                    writer.flush();
                }
            } else {
                process.getOutputStream().close();
            }
        } catch (IOException ignored) {
            // Child may have exited already (e.g. it doesn't read stdin at all) -- not fatal.
        }
    }

    public static String normalizeOutput(String raw) {
        if (raw == null) return "";
        // Replace CRLF with LF, strip trailing spaces per line, trim start/end
        String[] lines = raw.replace("\r\n", "\n").replace("\r", "\n").split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            sb.append(lines[i].stripTrailing());
            if (i < lines.length - 1) {
                sb.append("\n");
            }
        }
        return sb.toString().trim();
    }

    private static String readStream(InputStream is) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buf = new byte[1024];
        int n;
        while ((n = is.read(buf)) != -1) {
            baos.write(buf, 0, n);
        }
        return baos.toString(StandardCharsets.UTF_8);
    }

    private static void deleteDirectoryRecursively(File file) {
        if (file == null || !file.exists()) return;
        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) {
                deleteDirectoryRecursively(child);
            }
        }
        file.delete();
    }
}