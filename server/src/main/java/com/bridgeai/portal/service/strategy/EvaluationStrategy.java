package com.bridgeai.portal.service.strategy;

import com.bridgeai.portal.dto.ExamDtos.ExamResultResponse;
import com.bridgeai.portal.dto.ExamDtos.SubmitExamRequest;
import com.bridgeai.portal.model.Exam;
import com.bridgeai.portal.model.ExamAttempt;
import com.bridgeai.portal.model.ExamQuestion;

import java.util.List;

public interface EvaluationStrategy {
    ExamResultResponse evaluate(Exam exam, ExamAttempt attempt, List<ExamQuestion> questions, SubmitExamRequest request);
}
