// Utility for exporting structured student data into CSV / Excel spreadsheets

export const downloadCsvBlob = (filename, csvContent) => {
  // UTF-8 BOM prefix ensures correct rendering of special characters in Microsoft Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const sanitizeCsvField = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).trim();
  // Escape double quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
};

export const convertToCsv = (columns, rows) => {
  const headerRow = columns.map(c => sanitizeCsvField(c.label || c.key)).join(',');
  const dataRows = rows.map(row => {
    return columns.map(col => {
      const val = typeof col.extractor === 'function' 
        ? col.extractor(row) 
        : row[col.key];
      return sanitizeCsvField(val);
    }).join(',');
  });
  return [headerRow, ...dataRows].join('\r\n');
};

// 1. Assessment & Exam Marks Report
export const exportAssessmentReport = (attempts = [], exams = []) => {
  const examMap = new Map((exams || []).map(e => [e.id, e]));
  const columns = [
    { key: 'attemptId', label: 'Attempt ID' },
    { key: 'studentName', label: 'Candidate Name' },
    { key: 'studentEmail', label: 'Candidate Email' },
    { key: 'examTitle', label: 'Assessment Title', extractor: r => r.examTitle || examMap.get(r.examId)?.title || `Exam #${r.examId}` },
    { key: 'subjectName', label: 'Subject', extractor: r => examMap.get(r.examId)?.subjectName || 'Computer Science' },
    { key: 'score', label: 'Score Obtained' },
    { key: 'totalMarks', label: 'Total Marks', extractor: r => r.totalMarks || examMap.get(r.examId)?.totalMarks || 100 },
    { key: 'percentage', label: 'Percentage (%)', extractor: r => r.percentage != null ? `${Number(r.percentage).toFixed(1)}%` : '0%' },
    { key: 'passed', label: 'Verdict', extractor: r => r.passed ? 'PASSED' : 'NOT QUALIFIED' },
    { key: 'status', label: 'Attempt Status' },
    { key: 'violationCount', label: 'Proctoring Violations', extractor: r => r.violationCount || 0 },
    { key: 'completedAt', label: 'Completion Date', extractor: r => r.completedAt ? new Date(r.completedAt).toLocaleString() : 'In Progress' }
  ];

  const csv = convertToCsv(columns, attempts);
  const stamp = new Date().toISOString().split('T')[0];
  downloadCsvBlob(`BridgeAI_Student_Assessments_Report_${stamp}.csv`, csv);
};

// 2. Assignment Submissions & Marks Report
export const exportAssignmentReport = (submissions = [], assignments = []) => {
  const assignMap = new Map((assignments || []).map(a => [a.id, a]));
  const columns = [
    { key: 'id', label: 'Submission ID' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'assignmentTitle', label: 'Assignment Title', extractor: r => r.assignmentTitle || assignMap.get(r.assignmentId)?.title || `Assignment #${r.assignmentId}` },
    { key: 'score', label: 'Marks Awarded', extractor: r => r.score != null ? r.score : 'Pending' },
    { key: 'maxScore', label: 'Maximum Marks', extractor: r => assignMap.get(r.assignmentId)?.maxScore || 100 },
    { key: 'grade', label: 'Letter Grade', extractor: r => r.grade || 'Ungraded' },
    { key: 'status', label: 'Grading Status' },
    { key: 'submittedAt', label: 'Submission Date', extractor: r => r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A' },
    { key: 'submissionUrl', label: 'Deliverable Link', extractor: r => r.submissionUrl || r.githubUrl || 'None' },
    { key: 'feedback', label: 'Faculty Feedback', extractor: r => r.feedback || 'None' }
  ];

  const csv = convertToCsv(columns, submissions);
  const stamp = new Date().toISOString().split('T')[0];
  downloadCsvBlob(`BridgeAI_Assignment_Grades_Report_${stamp}.csv`, csv);
};

// 3. Project Evaluations Report
export const exportProjectReport = (projects = [], teams = []) => {
  const columns = [
    { key: 'id', label: 'Project Topic ID' },
    { key: 'title', label: 'Project Title' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'studentName', label: 'Student / Leader' },
    { key: 'teamMembers', label: 'Team Members' },
    { key: 'score', label: 'Awarded Marks', extractor: r => r.score != null ? r.score : 'Pending' },
    { key: 'status', label: 'Project Status' },
    { key: 'githubRepoUrl', label: 'Repository Link', extractor: r => r.githubRepoUrl || 'N/A' },
    { key: 'liveDemoUrl', label: 'Live Demo URL', extractor: r => r.liveDemoUrl || 'N/A' },
    { key: 'deadline', label: 'Project Deadline' },
    { key: 'feedback', label: 'Faculty Feedback', extractor: r => r.feedback || 'None' }
  ];

  const csv = convertToCsv(columns, projects);
  const stamp = new Date().toISOString().split('T')[0];
  downloadCsvBlob(`BridgeAI_Project_Evaluations_Report_${stamp}.csv`, csv);
};

// 4. Consolidated Master Performance Report
export const exportMasterStudentReport = ({ students = [], attempts = [], submissions = [], projects = [] }) => {
  const columns = [
    { key: 'id', label: 'Student ID' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Official Email' },
    { key: 'institutionName', label: 'Institution' },
    { key: 'assignedSubject', label: 'Enrolled Subject', extractor: r => r.assignedSubject || 'Computer Science & AI' },
    
    // Assessment Metrics
    { 
      key: 'assessmentCount', 
      label: 'Exams Attempted', 
      extractor: s => attempts.filter(a => a.studentId === s.id || a.candidateEmail === s.email).length 
    },
    { 
      key: 'avgAssessmentPct', 
      label: 'Avg Exam Score (%)', 
      extractor: s => {
        const myAttempts = attempts.filter(a => a.studentId === s.id || a.candidateEmail === s.email);
        if (myAttempts.length === 0) return '0%';
        const avg = myAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / myAttempts.length;
        return `${avg.toFixed(1)}%`;
      }
    },
    
    // Assignment Metrics
    { 
      key: 'assignmentCount', 
      label: 'Assignments Submitted', 
      extractor: s => submissions.filter(sub => sub.studentId === s.id || sub.studentEmail === s.email).length 
    },
    { 
      key: 'avgAssignmentScore', 
      label: 'Avg Assignment Marks', 
      extractor: s => {
        const mySubs = submissions.filter(sub => (sub.studentId === s.id || sub.studentEmail === s.email) && sub.score != null);
        if (mySubs.length === 0) return 'N/A';
        const avg = mySubs.reduce((acc, sub) => acc + sub.score, 0) / mySubs.length;
        return avg.toFixed(1);
      }
    },
    
    // Project Metrics
    {
      key: 'projectStatus',
      label: 'Project Work Status',
      extractor: s => {
        const myProj = projects.find(p => p.studentId === s.id || (p.teamMembers && p.teamMembers.includes(s.fullName)));
        return myProj ? `${myProj.status} (Score: ${myProj.score != null ? myProj.score : 'Pending'})` : 'Not Selected';
      }
    },

    // Total Academic Standing
    {
      key: 'academicStanding',
      label: 'Overall Academic Standing',
      extractor: s => {
        const myAttempts = attempts.filter(a => a.studentId === s.id || a.candidateEmail === s.email);
        const mySubs = submissions.filter(sub => (sub.studentId === s.id || sub.studentEmail === s.email) && sub.score != null);
        if (myAttempts.length === 0 && mySubs.length === 0) return 'No Submissions Yet';
        const avgExam = myAttempts.length > 0 ? (myAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / myAttempts.length) : 0;
        const avgAssign = mySubs.length > 0 ? (mySubs.reduce((acc, s) => acc + s.score, 0) / mySubs.length) : 0;
        const combined = (avgExam * 0.6) + (avgAssign * 0.4);
        if (combined >= 85) return 'Distinction (A+)';
        if (combined >= 75) return 'First Class (A)';
        if (combined >= 60) return 'Second Class (B)';
        if (combined >= 40) return 'Pass (C)';
        return 'Needs Improvement';
      }
    }
  ];

  const csv = convertToCsv(columns, students);
  const stamp = new Date().toISOString().split('T')[0];
  downloadCsvBlob(`BridgeAI_Master_Student_Performance_Sheet_${stamp}.csv`, csv);
};
