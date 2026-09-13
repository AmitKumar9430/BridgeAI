package com.bridgeai.portal.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExamQuestionTest {

    @Test
    @DisplayName("Should normalize standard single letters A, B, C, D")
    void testStandardLetters() {
        assertEquals("A", ExamQuestion.normalizeCorrectOption("a", "Alpha", "Beta", "Gamma", "Delta"));
        assertEquals("B", ExamQuestion.normalizeCorrectOption("B", "Alpha", "Beta", "Gamma", "Delta"));
        assertEquals("C", ExamQuestion.normalizeCorrectOption("c", "Alpha", "Beta", "Gamma", "Delta"));
        assertEquals("D", ExamQuestion.normalizeCorrectOption("D", "Alpha", "Beta", "Gamma", "Delta"));
    }

    @Test
    @DisplayName("Should normalize Option prefixes and numbers")
    void testPrefixesAndNumbers() {
        assertEquals("A", ExamQuestion.normalizeCorrectOption("Option A", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("B", ExamQuestion.normalizeCorrectOption("Choice B", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("C", ExamQuestion.normalizeCorrectOption("Answer C", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("A", ExamQuestion.normalizeCorrectOption("1", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("B", ExamQuestion.normalizeCorrectOption("2", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("C", ExamQuestion.normalizeCorrectOption("3", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("D", ExamQuestion.normalizeCorrectOption("4", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("B", ExamQuestion.normalizeCorrectOption("[B]", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
        assertEquals("C", ExamQuestion.normalizeCorrectOption("C)", "Opt 1", "Opt 2", "Opt 3", "Opt 4"));
    }

    @Test
    @DisplayName("Should normalize when trainer passes option text")
    void testOptionTextMatching() {
        String optA = "Messages with identical keys are routed to the same partition and consumed in order";
        String optB = "Dead Letter Queue automatically reorders transactions";
        String optC = "Kafka broker performs global locking across all consumer groups";
        String optD = "Consumer offsets are reset to zero after each event";

        assertEquals("A", ExamQuestion.normalizeCorrectOption(optA, optA, optB, optC, optD));
        assertEquals("B", ExamQuestion.normalizeCorrectOption(optB, optA, optB, optC, optD));
        assertEquals("C", ExamQuestion.normalizeCorrectOption("Kafka broker performs global locking", optA, optB, optC, optD));
    }

    @Test
    @DisplayName("Should fall back to A safely for null or empty input")
    void testFallbacks() {
        assertEquals("A", ExamQuestion.normalizeCorrectOption(null, "A", "B", "C", "D"));
        assertEquals("A", ExamQuestion.normalizeCorrectOption("   ", "A", "B", "C", "D"));
    }
}
