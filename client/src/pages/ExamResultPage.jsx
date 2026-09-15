import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Award, CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  FileCheck, ShieldCheck, Printer, Download, Sparkles, RotateCcw, Building2,
  Code2, Terminal, CheckCircle2, FileCode, Copy, Check, Clock, Play,
  Cpu, AlertCircle, ShieldAlert, CheckSquare, Layers, HelpCircle
} from 'lucide-react';

export const ExamResultPage = ({ result: initialResult, onBackToDashboard, onRetakeExam }) => {
  const [result, setResult] = useState(initialResult || null);
  const [loading, setLoading] = useState(!initialResult);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
      setLoading(false);
    } else {
      // Auto-fetch latest result if accessed directly or refreshed
      const fetchLatestResult = async () => {
        try {
          setLoading(true);
          const res = await api.get('/exams/latest-result');
          setResult(res.data);
        } catch (err) {
          console.warn('Could not fetch latest exam result:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchLatestResult();
    }
  }, [initialResult]);

  useEffect(() => {
    if (result?.passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#059669', '#D97706', '#0F172A']
      });
    }
  }, [result]);

  const handleCopyCode = (qId, code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(qId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading Proctored Assessment Scorecard &amp; Diagnostics...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
          <FileCheck className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Exam Result Record Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          There is no completed exam submission in the active session. Please navigate to the examinations dashboard to attempt scheduled tests.
        </p>
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>
      </div>
    );
  }

  const {
    examId,
    examTitle,
    studentName,
    score,
    totalMarks,
    percentage,
    passed,
    violationCount,
    status,
    certificateCode,
    assessmentType,
    allowMultipleAttempts,
    institutionName,
    canReattempt,
    breakdowns = []
  } = result;

  const isTerminated = status === 'TERMINATED_BY_VIOLATION';
  const isSelfAssessment = assessmentType === 'SELF_ASSESSMENT' || allowMultipleAttempts || canReattempt;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-900 dark:text-slate-100 animate-fadeIn">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isSelfAssessment && onRetakeExam && (
            <button
              onClick={() => onRetakeExam(examId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-2xs cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Practice Self-Assessment
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F172A] dark:bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Performance Scorecard
          </button>
        </div>
      </div>

      {/* Self-Assessment Practice Alert Banner */}
      {isSelfAssessment && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950 dark:text-blue-100 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-bold text-blue-950 dark:text-blue-100">Module Self-Assessment Practice Result</strong>
                <span className="px-2 py-0.5 rounded-full bg-blue-200/70 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 text-[10px] font-bold">
                  Unlimited Practice Attempts
                </span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                This test is intended for continuous self-assessment and conceptual preparation. You can retake this test at any time without restriction.
              </p>
            </div>
          </div>
          {onRetakeExam && (
            <button
              onClick={() => onRetakeExam(examId)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </button>
          )}
        </div>
      )}

      {/* Trainer-Assigned Institutional Banner */}
      {!isSelfAssessment && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-purple-950 dark:text-purple-100">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-xs font-semibold">
              Trainer-Assigned Assessment evaluated by faculty of <strong>{institutionName || 'Your Institution'}</strong>.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700 shrink-0">
            Institutional Proctored Exam
          </span>
        </div>
      )}

      {/* Result Overview Banner */}
      <div className={`rounded-xl p-8 border shadow-sm text-center ${
        isTerminated
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
          : passed
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
      }`}>
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm border">
          {isTerminated ? (
            <div className="w-full h-full rounded-full bg-rose-600 text-white flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
          ) : passed ? (
            <div className="w-full h-full rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-amber-600 text-white flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 inline-block mb-2">
          {isTerminated
            ? 'EXAM TERMINATED DUE TO VIOLATIONS'
            : isSelfAssessment
            ? `PRACTICE SELF-ASSESSMENT: ${passed ? 'PASSED' : 'NEEDS PRACTICE'}`
            : passed
            ? 'TRAINER-ASSIGNED ASSESSMENT: PASSED'
            : 'TRAINER-ASSIGNED ASSESSMENT: NOT QUALIFIED'}
        </span>

        <h1 className="text-2xl font-bold">{examTitle}</h1>
        <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">Candidate: <strong>{studentName}</strong></p>

        {/* Score metrics */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 bg-white dark:bg-slate-900/90 py-4 px-4 sm:px-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Score</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{score} / {totalMarks}</p>
          </div>
          <div className="hidden sm:block h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Percentage</p>
            <p className={`text-xl sm:text-2xl font-black mt-0.5 ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
              {percentage}%
            </p>
          </div>
          <div className="hidden sm:block h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Violation Strikes</p>
            <p className={`text-xl sm:text-2xl font-black mt-0.5 ${violationCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {violationCount}
            </p>
          </div>
        </div>
      </div>

      {/* Official Certificate Card if Passed */}
      {passed && certificateCode && (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-8 shadow-sm text-center relative overflow-hidden text-slate-900 dark:text-white">
          <div className="absolute top-4 right-4">
            <span className="text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full">
              CERTIFICATE VERIFIED
            </span>
          </div>

          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">BridgeAI Certificate of Excellence</p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">This is to certify that</h2>
          <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{studentName}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-2">
            has successfully demonstrated professional competence and cleared the proctored examination for:
          </p>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2">{examTitle}</h4>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            <div>
              <span className="block text-slate-400 dark:text-slate-500">Issue Date</span>
              <strong className="text-slate-900 dark:text-white">{new Date().toLocaleDateString()}</strong>
            </div>
            <div>
              <span className="block text-slate-400 dark:text-slate-500">Credential ID</span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">{certificateCode}</strong>
            </div>
            <div>
              <span className="block text-slate-400 dark:text-slate-500">Score</span>
              <strong className="text-slate-900 dark:text-white">{percentage}% (Distinction)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Question-wise Analysis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 text-slate-900 dark:text-white">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Comprehensive Question Evaluation &amp; Diagnostics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review submitted solutions, testcase execution breakdowns, compiler outputs, and objective answer keys.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {breakdowns.length} Problems Evaluated
          </span>
        </div>

        <div className="space-y-6">
          {breakdowns.map((q, idx) => {
            const isCoding = q.questionType === 'CODING';

            if (isCoding) {
              const allPassed = q.testCasesPassed > 0 && q.testCasesPassed === q.totalTestCases;
              const somePassed = q.testCasesPassed > 0 && !allPassed;
              const isCopied = copiedCodeId === (q.questionId || idx);

              return (
                <div
                  key={q.questionId || idx}
                  className={`p-5 rounded-2xl border transition-all shadow-xs ${
                    allPassed
                      ? 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/20 dark:bg-emerald-950/15'
                      : somePassed
                      ? 'border-amber-200 dark:border-amber-800/70 bg-amber-50/20 dark:bg-amber-950/15'
                      : 'border-rose-200 dark:border-rose-800/70 bg-rose-50/20 dark:bg-rose-950/15'
                  }`}
                >
                  {/* Problem Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800/70 pb-3.5">
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        allPassed ? 'bg-emerald-600 text-white' : somePassed ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold uppercase flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                            <Code2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>Coding Assessment</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold uppercase border border-slate-200 dark:border-slate-700">
                            Language: {q.selectedLanguage || 'python'}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {q.problemTitle || q.questionText}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        allPassed
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : somePassed
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      }`}>
                        +{q.marksAwarded} / {q.maxMarks || q.marksAwarded} Marks
                      </span>
                    </div>
                  </div>

                  {/* Problem Description if provided */}
                  {q.questionText && q.questionText !== q.problemTitle && (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200 block mb-1">Problem Description:</strong>
                      <p className="whitespace-pre-wrap">{q.questionText}</p>
                    </div>
                  )}

                  {/* Test Cases Passed Summary Bar */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${allPassed ? 'text-emerald-600' : somePassed ? 'text-amber-600' : 'text-rose-600'}`} />
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">Test Cases Passed:</span>
                      </div>
                      <strong className={`font-mono font-bold text-sm ${allPassed ? 'text-emerald-600 dark:text-emerald-400' : somePassed ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {q.testCasesPassed || 0} / {q.totalTestCases || 0} Cases
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">Evaluation Status:</span>
                      </div>
                      <strong className={`font-bold ${allPassed ? 'text-emerald-600 dark:text-emerald-400' : somePassed ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {allPassed ? 'All Test Cases Passed' : somePassed ? 'Partial Test Cases Passed' : 'All Test Cases Failed'}
                      </strong>
                    </div>
                  </div>

                  {/* Submitted Code Viewer */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-blue-500" />
                        <span>Candidate Submitted Code:</span>
                      </span>
                      {q.submittedCode && (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(q.questionId || idx, q.submittedCode)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {q.submittedCode ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A] shadow-md">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                          <span>solution.{q.selectedLanguage === 'python' ? 'py' : q.selectedLanguage === 'java' ? 'java' : q.selectedLanguage === 'cpp' ? 'cpp' : q.selectedLanguage === 'c' ? 'c' : 'txt'}</span>
                          <span className="uppercase">{q.selectedLanguage || 'code'}</span>
                        </div>
                        <pre className="p-4 text-emerald-400 dark:text-emerald-300 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed selection:bg-blue-600 selection:text-white">
                          {q.submittedCode}
                        </pre>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 italic text-center">
                        No solution code was submitted for this problem during the assessment.
                      </div>
                    )}
                  </div>

                  {/* Individual Test Cases Detailed Breakdown */}
                  {q.testCaseResults && q.testCaseResults.length > 0 && (
                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Individual Test Case Execution Breakdown:</span>
                      </div>

                      <div className="space-y-2.5">
                        {q.testCaseResults.map((tc, tcIdx) => (
                          <div
                            key={tc.id || tcIdx}
                            className={`p-3.5 rounded-xl border transition-all ${
                              tc.passed
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  tc.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                }`}>
                                  {tcIdx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  Test Case #{tcIdx + 1} {tc.sample ? '(Sample)' : '(Hidden)'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {tc.executionTimeMs !== undefined && (
                                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {tc.executionTimeMs} ms
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                  tc.passed
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                                }`}>
                                  {tc.passed ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                                      <span>Passed</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      <span>Failed</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Inputs and Outputs Table */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
                              {/* Input */}
                              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block mb-1">Input:</span>
                                <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all max-h-20 overflow-y-auto">
                                  {tc.input || '(empty)'}
                                </div>
                              </div>

                              {/* Expected Output */}
                              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Expected Output:</span>
                                <div className="text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap break-all max-h-20 overflow-y-auto font-semibold">
                                  {tc.expectedOutput || '(empty)'}
                                </div>
                              </div>

                              {/* Actual Output */}
                              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block mb-1">Candidate Output:</span>
                                <div className={`whitespace-pre-wrap break-all max-h-20 overflow-y-auto font-semibold ${tc.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {tc.actualOutput || (tc.error ? `Error: ${tc.error}` : '(no output)')}
                                </div>
                              </div>
                            </div>

                            {/* Error Details if any */}
                            {tc.error && (
                              <div className="mt-2 p-2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-[11px] font-mono">
                                <strong>Execution Error:</strong> {tc.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compiler / Diagnostics Output if present */}
                  {q.compilerOutput && (
                    <div className="mt-4 space-y-1">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        <span>Compiler &amp; Runtime Output:</span>
                      </span>
                      <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono overflow-x-auto max-h-36 border border-slate-800">
                        {q.compilerOutput}
                      </pre>
                    </div>
                  )}
                </div>
              );
            }

            // MCQ / Objective Problem
            return (
              <div
                key={q.questionId || idx}
                className={`p-5 rounded-2xl border transition-all shadow-xs ${
                  q.correct
                    ? 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/20 dark:bg-emerald-950/15'
                    : 'border-rose-200 dark:border-rose-800/70 bg-rose-50/20 dark:bg-rose-950/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      q.correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold uppercase border border-purple-200 dark:border-purple-800">
                          Objective MCQ
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {q.questionText}
                      </h4>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">Your Selected Option: </span>
                          <strong className={q.correct ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-rose-700 dark:text-rose-400 font-bold'}>
                            Option {q.selectedOption || 'None (Unanswered)'}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">Verified Correct Option: </span>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Option {q.correctOption}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      q.correct
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    }`}>
                      +{q.marksAwarded} Marks
                    </span>
                  </div>
                </div>

                {q.explanation && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">Faculty Explanation: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
