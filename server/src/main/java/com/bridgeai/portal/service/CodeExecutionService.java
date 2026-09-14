package com.bridgeai.portal.service;

import com.bridgeai.portal.dto.ExamDtos.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
            case "csharp":
                // Try dotnet or csc
                if (isCommandAvailable("csc")) {
                    cmd.add("csc");
                    cmd.add("/nologo");
                    cmd.add("/out:Solution.exe");
                    cmd.add(sourceFileName);
                } else if (isCommandAvailable("dotnet")) {
                    // Script execution or compilation via dotnet
                    return null; // Will run with dotnet exec
                }
                break;
            case "kotlin":
                if (isCommandAvailable("kotlinc")) {
                    cmd.add("kotlinc");
                    cmd.add(sourceFileName);
                    cmd.add("-include-runtime");
                    cmd.add("-d");
                    cmd.add("Solution.jar");
                } else {
                    // Fallback to java/portable compiler
                    return null;
                }
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
        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.directory(dir.toFile());
            Process process = pb.start();

            // Pipe input
            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream(), StandardCharsets.UTF_8))) {
                    writer.write(input);
                    if (!input.endsWith("\n")) {
                        writer.newLine();
                    }
                    writer.flush();
                } catch (IOException ignored) {}
            } else {
                process.getOutputStream().close();
            }

            // Capture streams in parallel
            Future<String> stdoutFuture = Executors.newSingleThreadExecutor().submit(() -> readStream(process.getInputStream()));
            Future<String> stderrFuture = Executors.newSingleThreadExecutor().submit(() -> readStream(process.getErrorStream()));

            boolean completed = process.waitFor(timeLimitSeconds, TimeUnit.SECONDS);
            long duration = System.currentTimeMillis() - startTime;
            res.executionTimeMs = duration;

            if (!completed) {
                process.destroyForcibly();
                res.isTimeout = true;
                res.success = false;
                res.error = "Time Limit Exceeded (" + timeLimitSeconds + "s)";
                return res;
            }

            String stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS);

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

    private static boolean isCommandAvailable(String cmd) {
        try {
            Process p = new ProcessBuilder(System.getProperty("os.name").toLowerCase().contains("win") ? "where" : "which", cmd).start();
            return p.waitFor(2, TimeUnit.SECONDS) && p.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
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
