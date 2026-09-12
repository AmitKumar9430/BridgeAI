import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Award, CheckCircle, XCircle, AlertTriangle, ArrowLeft,
  FileCheck, ShieldCheck, Printer, Download, Sparkles, RotateCcw, Building2,
  Code2, Terminal, CheckCircle2, FileCode
} from 'lucide-react';

export const ExamResultPage = ({ result, onBackToDashboard, onRetakeExam }) => {
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

  if (!result) return null;

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isSelfAssessment && onRetakeExam && (
            <button
              onClick={() => onRetakeExam(examId)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Practice Self-Assessment
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-md hover:bg-slate-800"
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
                <span className="px-2 py-0.2 rounded-full bg-blue-200/70 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 text-[10px] font-bold">
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
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs shrink-0 flex items-center justify-center gap-1.5 transition-colors"
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
          <h3 className="text-2xl font-black text-blue-700 mt-1">{studentName}</h3>
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
              <strong className="font-mono text-emerald-700">{certificateCode}</strong>
            </div>
            <div>
              <span className="block text-slate-400 dark:text-slate-500">Score</span>
              <strong className="text-slate-900 dark:text-white">{percentage}% (Distinction)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Question-wise Analysis (Infographic 2: Panel 8) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 text-slate-900 dark:text-white">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Question-wise Objective Evaluation</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review candidate response vs. verified answer key with comprehensive technical explanations.
          </p>
        </div>

        <div className="space-y-4">
          {breakdowns.map((q, idx) => {
            const isCoding = q.questionType === 'CODING';

            if (isCoding) {
              const allPassed = q.testCasesPassed > 0 && q.testCasesPassed === q.totalTestCases;
              const somePassed = q.testCasesPassed > 0;

              return (
                <div
                  key={q.questionId || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    allPassed
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : somePassed
                      ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20'
                      : 'border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        allPassed ? 'bg-emerald-600 text-white' : somePassed ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-emerald-600" />
                            <span>Coding Problem</span>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                            {q.selectedLanguage || 'code'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{q.questionText}</h4>

                        {/* Test Cases Passed Summary */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Test Cases Passed: </span>
                            <strong className={allPassed ? 'text-emerald-700' : somePassed ? 'text-amber-700' : 'text-rose-700'}>
                              {q.testCasesPassed || 0} / {q.totalTestCases || 0} Test Cases
                            </strong>
                          </div>

                          <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Execution Status: </span>
                            <strong className={allPassed ? 'text-emerald-700' : somePassed ? 'text-amber-700' : 'text-rose-700'}>
                              {allPassed ? 'All Test Cases Passed' : somePassed ? 'Partial Test Cases Passed' : 'Test Cases Failed'}
                            </strong>
                          </div>
                        </div>

                        {/* Submitted Code Viewer */}
                        {q.submittedCode && (
                          <div className="mt-3 space-y-1">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <FileCode className="w-3 h-3 text-slate-500" />
                              <span>Submitted Code:</span>
                            </span>
                            <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                              {q.submittedCode}
                            </pre>
                          </div>
                        )}

                        {/* Compiler Output if any */}
                        {q.compilerOutput && (
                          <div className="mt-2 space-y-1">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Terminal className="w-3 h-3 text-slate-500" />
                              <span>Compiler / Execution Diagnostics:</span>
                            </span>
                            <pre className="bg-slate-900 text-slate-300 p-2.5 rounded text-xs font-mono overflow-x-auto max-h-36">
                              {q.compilerOutput}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        allPassed
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : somePassed
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      }`}>
                        +{q.marksAwarded} Marks
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={q.questionId || idx}
                className={`p-4 rounded-xl border transition-all ${
                  q.correct
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      q.correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{q.questionText}</h4>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Your Selected Option: </span>
                          <strong className={q.correct ? 'text-emerald-700' : 'text-rose-700'}>
                            Option {q.selectedOption || 'None (Unanswered)'}
                          </strong>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Correct Option: </span>
                          <strong className="text-emerald-700">Option {q.correctOption}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      q.correct
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    }`}>
                      +{q.marksAwarded} Marks
                    </span>
                  </div>
                </div>

                {q.explanation && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold">Explanation: </strong>
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
