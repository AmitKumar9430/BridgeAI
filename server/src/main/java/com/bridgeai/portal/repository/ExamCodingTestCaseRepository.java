package com.bridgeai.portal.repository;

import com.bridgeai.portal.model.ExamCodingTestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamCodingTestCaseRepository extends JpaRepository<ExamCodingTestCase, Long> {
    List<ExamCodingTestCase> findByQuestionId(Long questionId);
    List<ExamCodingTestCase> findByQuestionIdAndSampleTrue(Long questionId);
    void deleteByQuestionId(Long questionId);
}
