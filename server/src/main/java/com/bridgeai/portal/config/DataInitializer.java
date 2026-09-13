package com.bridgeai.portal.config;

import com.bridgeai.portal.model.*;
import com.bridgeai.portal.repository.*;
import com.bridgeai.portal.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final ResourceItemRepository resourceRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final ProjectWorkRepository projectRepository;
    private final LiveSessionRepository liveSessionRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository questionRepository;
    private final InstitutionRepository institutionRepository;
    private final InstitutionService institutionService;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Checking initial system seed data...");

        // Ensure recording_snapshot_url in exam_attempts can store large base64 photos
        try {
            jdbcTemplate.execute("ALTER TABLE exam_attempts MODIFY COLUMN recording_snapshot_url LONGTEXT");
            log.info("Successfully ensured recording_snapshot_url is LONGTEXT in MySQL");
        } catch (Exception e) {
            log.debug("Notice on recording_snapshot_url column definition: {}", e.getMessage());
        }

        // 0. Seed Institutions with complete location details
        seedInstitution("Indian Institute of Technology (IIT)", "IIT-D", "Institute of National Importance", "NAAC A++ | NIRF Rank #1",
                "Hauz Khas, Outer Ring Road", "New Delhi", "Delhi", "110016",
                "registrar@iitd.ac.in", "+91-11-2659-1000", "https://home.iitd.ac.in", 1961);

        seedInstitution("National Institute of Tech (NIT)", "NIT-T", "Institute of National Importance", "NAAC A+ | NIRF Rank #9",
                "Tanjore Main Road, National Highway 67", "Tiruchirappalli", "Tamil Nadu", "620015",
                "admin@nitt.edu", "+91-431-250-3000", "https://www.nitt.edu", 1964);

        seedInstitution("Birla Institute of Technology and Science (BITS)", "BITS-P", "Institute of Eminence", "NAAC A | Category 1 Autonomous",
                "Vidya Vihar Campus", "Pilani", "Rajasthan", "333031",
                "registrar@pilani.bits-pilani.ac.in", "+91-1596-242210", "https://www.bits-pilani.ac.in", 1964);

        // 1. Seed Core Users (Boss Admin, Super Admin, Trainer, Student)
        User bossAdmin = seedUser("boss@bridgeai.edu", "BossAdmin@2026", "Chief Director", "+91-9876500001", Role.ROLE_BOSS_ADMIN, "National Higher Education Board", "System Governance");
        User superAdmin = seedUser("superadmin@bridgeai.edu", "SuperAdmin@2026", "Dr. Arvind Roy", "+91-9876500002", Role.ROLE_SUPER_ADMIN, "Indian Institute of Technology (IIT)", "Institutional Administration");
        User superAdmin2 = seedUser("sunita.superadmin@bridgeai.edu", "SuperAdmin@2026", "Dr. Sunita Rao", "+91-9876500012", Role.ROLE_SUPER_ADMIN, "Indian Institute of Technology (IIT)", "Academics & Accreditation");
        User trainer = seedUser("bharat.trainer@bridgeai.edu", "Trainer@2026", "Bharat Sharma", "+91-9876500003", Role.ROLE_TRAINER, "Indian Institute of Technology (IIT)", "Computer Science & AI");
        User trainer2 = seedUser("marcus.trainer@bridgeai.edu", "Trainer@2026", "Prof. Marcus Vance", "+91-9876500009", Role.ROLE_TRAINER, "Indian Institute of Technology (IIT)", "Java & Enterprise Systems");

        // Link trainers to Supervising Super Admin
        if (trainer.getSuperAdminId() == null) {
            trainer.setSuperAdminId(superAdmin.getId());
            trainer.setSuperAdminName(superAdmin.getFullName());
            userRepository.save(trainer);
        }
        if (trainer2.getSuperAdminId() == null) {
            trainer2.setSuperAdminId(superAdmin.getId());
            trainer2.setSuperAdminName(superAdmin.getFullName());
            userRepository.save(trainer2);
        }
        User student = seedUser("rahul.student@bridgeai.edu", "Student@2026", "Rahul Verma", "+91-9876500004", Role.ROLE_STUDENT, "Indian Institute of Technology (IIT)", "Computer Science & AI");
        User priya = seedUser("priya.student@bridgeai.edu", "Student@2026", "Priya Sharma", "+91-9876500005", Role.ROLE_STUDENT, "Indian Institute of Technology (IIT)", "Computer Science & AI");
        User amit = seedUser("amit.student@bridgeai.edu", "Student@2026", "Amit Patel", "+91-9876500006", Role.ROLE_STUDENT, "Indian Institute of Technology (IIT)", "Computer Science & AI");
        User neha = seedUser("neha.student@bridgeai.edu", "Student@2026", "Neha Gupta", "+91-9876500007", Role.ROLE_STUDENT, "Indian Institute of Technology (IIT)", "Computer Science & AI");
        User vikram = seedUser("vikram.student@bridgeai.edu", "Student@2026", "Vikram Singh", "+91-9876500008", Role.ROLE_STUDENT, "Indian Institute of Technology (IIT)", "Computer Science & AI");

        User vigilanceOfficer = seedUser("rahul.sharma@bridgeai.edu", "Vigilance@2026", "Rahul Sharma", "+91-9876500015", Role.ROLE_VIGILANCE_OFFICER, "National Examination Board", "Examination Vigilance & Anti-Fraud");
        if (vigilanceOfficer.getStaffId() == null) {
            vigilanceOfficer.setStaffId("VO-001");
            userRepository.save(vigilanceOfficer);
        }

        // Clean up any remaining bracketed role suffixes from all existing users in the database
        List<User> existingUsersWithBrackets = userRepository.findAll();
        for (User u : existingUsersWithBrackets) {
            if (u.getFullName() != null && u.getFullName().contains("(")) {
                u.setFullName(u.getFullName().replaceAll("\\s*\\([^)]*\\)", "").trim());
                userRepository.save(u);
            }
        }

        // 2. Seed Course if empty
        if (courseRepository.count() == 0) {
            log.info("Seeding initial courses and modules matching training portal design...");

            Course course1 = Course.builder()
                    .title("AI & GenAI Engineering Masterclass")
                    .description("Comprehensive masterclass covering Python for AI, REST APIs, Microservices, RAG architectures, and Autonomous Agentic AI systems.")
                    .category("Artificial Intelligence")
                    .trainerId(trainer.getId())
                    .trainerName(trainer.getFullName())
                    .institutionName("Indian Institute of Technology (IIT)")
                    .badgeColor("#0F172A")
                    .startDate(LocalDate.of(2026, 9, 1))
                    .endDate(LocalDate.of(2026, 12, 15))
                    .enrolledCount(128)
                    .progressPercentage(70)
                    .build();
            Course savedCourse = courseRepository.save(course1);

            // Seed Modules
            CourseModule m1 = moduleRepository.save(CourseModule.builder()
                    .courseId(savedCourse.getId())
                    .title("Module 1: Introduction to AI & Vector Spaces")
                    .description("Foundations of artificial intelligence, high-dimensional embeddings, and similarity metrics.")
                    .orderIndex(1)
                    .build());

            CourseModule m2 = moduleRepository.save(CourseModule.builder()
                    .courseId(savedCourse.getId())
                    .title("Module 2: REST APIs & Microservices Integration")
                    .description("Designing production-ready HTTP endpoints, idempotency, rate limiting, and Postman testing.")
                    .orderIndex(2)
                    .build());

            CourseModule m3 = moduleRepository.save(CourseModule.builder()
                    .courseId(savedCourse.getId())
                    .title("Module 3: GenAI & Retrieval-Augmented Generation (RAG)")
                    .description("Chunking strategies, hybrid retrieval, re-ranking, and context window orchestration.")
                    .orderIndex(3)
                    .build());

            CourseModule m4 = moduleRepository.save(CourseModule.builder()
                    .courseId(savedCourse.getId())
                    .title("Module 4: Agentic AI & Autonomous Multi-Agent Workflows")
                    .description("State machines, tool-use execution loops, and fault-tolerant agent coordination.")
                    .orderIndex(4)
                    .build());

            // Seed Resources with modular rich content
            resourceRepository.save(ResourceItem.builder()
                    .courseId(savedCourse.getId())
                    .moduleId(m1.getId())
                    .title("Vector Embeddings & Semantic Similarity Complete Guide")
                    .resourceType("ARTICLE")
                    .urlOrPath("https://arxiv.org/pdf/1706.03762.pdf")
                    .fileSize("4.2 MB")
                    .orderIndex(1)
                    .description("In-depth exploration of vector dimensions, cosine distance, and dense representations.")
                    .videoEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")
                    .richContent("### What is a Vector Embedding?\n\nIn modern Machine Learning, a **vector embedding** is a numerical representation of real-world objects—such as words, documents, or images—in a continuous high-dimensional vector space.\n\n```python\nimport numpy as np\n\ndef cosine_similarity(a, b):\n    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))\n\n# Example embeddings\nv1 = np.array([0.82, 0.45, -0.19])\nv2 = np.array([0.79, 0.48, -0.15])\nprint('Cosine Similarity:', cosine_similarity(v1, v2))\n```\n\n### Key Properties:\n1. **Distance preserves semantics**: Synonyms have high dot-products.\n2. **Fixed Dimensionality**: Regardless of input size, dense vectors standardise downstream search pipelines.")
                    .build());

            resourceRepository.save(ResourceItem.builder()
                    .courseId(savedCourse.getId())
                    .moduleId(m2.getId())
                    .title("REST API Best Practices & HTTP Semantics")
                    .resourceType("PPT")
                    .urlOrPath("https://swagger.io/specification/")
                    .fileSize("6.8 MB")
                    .orderIndex(2)
                    .description("Industry standards for RESTful API architecture, caching, and idempotency.")
                    .richContent("### REST Architectural Constraints\n\nRepresentational State Transfer (REST) adheres to six primary architectural constraints:\n1. **Client-Server Separation**\n2. **Stateless Communication**\n3. **Cacheability**\n4. **Uniform Interface**\n5. **Layered System**\n6. **Code on Demand (Optional)**\n\n```json\n{\n  \"status\": 200,\n  \"message\": \"Resource updated successfully\",\n  \"data\": { \"id\": 101, \"active\": true }\n}\n```")
                    .build());

            resourceRepository.save(ResourceItem.builder()
                    .courseId(savedCourse.getId())
                    .moduleId(m3.getId())
                    .title("RAG Architecture Blueprint & Indexing Pipeline")
                    .resourceType("PDF")
                    .urlOrPath("https://huggingface.co/datasets")
                    .fileSize("2.5 MB")
                    .orderIndex(3)
                    .description("End-to-end guide on ingestion, recursive chunking, and bi-encoder re-ranking.")
                    .richContent("### Retrieval-Augmented Generation (RAG)\n\nRAG combines a generative model with an external retrieval mechanism to produce grounded, up-to-date answers without retraining.")
                    .build());

            // Seed Assignments
            Assignment a1 = assignmentRepository.save(Assignment.builder()
                    .courseId(savedCourse.getId())
                    .moduleId(m2.getId())
                    .trainerId(trainer.getId())
                    .trainerName(trainer.getFullName())
                    .subjectName("Computer Science & AI")
                    .title("REST API & Postman Automated Test Suite")
                    .description("Test and validate the following APIs using Postman collection runner. Submit your completed test suite documentation and screenshots in PDF format.")
                    .dueDateTime(LocalDateTime.now().plusDays(5))
                    .pdfAttachmentUrl("https://raw.githubusercontent.com/postmanlabs/openapi/main/examples/petstore.json")
                    .submissionType("PDF")
                    .maxScore(100)
                    .assignedToAll(true)
                    .allowResubmission(true)
                    .build());

            Assignment a2 = assignmentRepository.save(Assignment.builder()
                    .courseId(savedCourse.getId())
                    .moduleId(m3.getId())
                    .trainerId(trainer.getId())
                    .trainerName(trainer.getFullName())
                    .subjectName("Computer Science & AI")
                    .title("Build a RAG Document Ingestion Pipeline")
                    .description("Implement recursive chunking, sentence transformer embeddings, and hybrid BM25 retrieval. Submit a consolidated PDF technical report.")
                    .dueDateTime(LocalDateTime.now().plusDays(10))
                    .pdfAttachmentUrl("https://example.com/rag-spec.pdf")
                    .submissionType("PDF")
                    .maxScore(100)
                    .assignedToAll(true)
                    .allowResubmission(false)
                    .build());

            // Sample submission for Rahul
            submissionRepository.save(AssignmentSubmission.builder()
                    .assignmentId(a1.getId())
                    .studentId(student.getId())
                    .studentName(student.getFullName())
                    .submissionType("PDF")
                    .submissionContent("Completed Postman test collection with 45 test assertions verified across authentication, pagination, and error handlers.")
                    .pdfSubmissionUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
                    .status("CHECKED")
                    .score(92)
                    .grade("A+")
                    .feedback("Excellent test coverage, positive and negative HTTP status codes properly verified.")
                    .canEdit(true)
                    .evaluatedByTrainerId(trainer.getId())
                    .submittedAt(LocalDateTime.now().minusDays(1))
                    .evaluatedAt(LocalDateTime.now())
                    .build());

            // Seed Live Sessions & Recordings
            liveSessionRepository.save(LiveSession.builder()
                    .courseId(savedCourse.getId())
                    .subjectName("Computer Science & AI")
                    .title("REST APIs & Microservice Contracts Masterclass")
                    .trainerId(trainer.getId())
                    .trainerEmail(trainer.getEmail())
                    .trainerName(trainer.getFullName())
                    .creatorRole("ROLE_TRAINER")
                    .targetAudience("Enrolled Students")
                    .institutionId(trainer.getInstitutionId())
                    .institutionName(trainer.getInstitutionName())
                    .scheduledAt(LocalDateTime.now().minusDays(2))
                    .durationMinutes(60)
                    .platform("GOOGLE_MEET")
                    .joinUrl("https://meet.google.com/bai-live-rest")
                    .status("RECORDED")
                    .recordingVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")
                    .recordingNotes("Session covered OpenAPI 3.1 specification, idempotency keys for POST requests, and circuit breakers.")
                    .build());

            liveSessionRepository.save(LiveSession.builder()
                    .courseId(savedCourse.getId())
                    .subjectName("Computer Science & AI")
                    .title("GenAI & Agentic AI Live Interactive Workshop")
                    .trainerId(trainer.getId())
                    .trainerEmail(trainer.getEmail())
                    .trainerName(trainer.getFullName())
                    .creatorRole("ROLE_TRAINER")
                    .targetAudience("Enrolled Students")
                    .institutionId(trainer.getInstitutionId())
                    .institutionName(trainer.getInstitutionName())
                    .scheduledAt(LocalDateTime.now().plusDays(3))
                    .durationMinutes(90)
                    .platform("ZOOM")
                    .joinUrl("https://zoom.us/j/9012345678")
                    .status("UPCOMING")
                    .build());

            // Seed Proctored Module Exams
            Exam exam = examRepository.save(Exam.builder()
                    .courseId(savedCourse.getId())
                    .moduleId(m1.getId())
                    .trainerId(trainer.getId())
                    .trainerName(trainer.getFullName())
                    .institutionId(trainer.getInstitutionId())
                    .institutionName(trainer.getInstitutionName())
                    .assessmentType("TRAINER_ASSIGNED")
                    .allowMultipleAttempts(false)
                    .title("Module 1 Test: AI Foundations & Vector Spaces")
                    .description("Mandatory institutional proctored examination assigned by IIT Bombay faculty. Safe browsing mode, fullscreen lock, webcam surveillance, and tab switch tracking are strictly enforced.")
                    .durationMinutes(30)
                    .passingPercentage(60)
                    .maxViolations(3)
                    .totalMarks(50)
                    .scheduledStartTime(LocalDateTime.now().minusHours(1))
                    .scheduledEndTime(LocalDateTime.now().plusDays(7))
                    .active(true)
                    .randomizeQuestions(true)
                    .build());

            Exam exam2 = examRepository.save(Exam.builder()
                    .courseId(savedCourse.getId())
                    .moduleId(m2.getId())
                    .trainerId(trainer.getId())
                    .trainerName(trainer.getFullName())
                    .institutionId(trainer.getInstitutionId())
                    .institutionName(trainer.getInstitutionName())
                    .assessmentType("SELF_ASSESSMENT")
                    .allowMultipleAttempts(true)
                    .title("Module 2 Practice Self-Assessment: REST APIs & Microservices Integration")
                    .description("Self-assessment module test for continuous evaluation and practice. Students can attempt this practice test multiple times to solidify understanding.")
                    .durationMinutes(20)
                    .passingPercentage(60)
                    .maxViolations(3)
                    .totalMarks(30)
                    .scheduledStartTime(LocalDateTime.now().minusHours(1))
                    .scheduledEndTime(LocalDateTime.now().plusDays(14))
                    .active(true)
                    .randomizeQuestions(true)
                    .build());

            questionRepository.save(ExamQuestion.builder()
                    .examId(exam2.getId())
                    .questionText("Which HTTP status code should be returned when a POST request successfully creates a new database resource?")
                    .optionA("200 OK")
                    .optionB("201 Created")
                    .optionC("204 No Content")
                    .optionD("202 Accepted")
                    .correctOption("B")
                    .marks(10)
                    .explanation("HTTP 201 Created is the standard response for successful resource creation, typically accompanied by a Location header.")
                    .build());

            questionRepository.save(ExamQuestion.builder()
                    .examId(exam2.getId())
                    .questionText("In microservices, which pattern prevents cascading service failures by failing fast when downstream services are unresponsive?")
                    .optionA("Saga Pattern")
                    .optionB("Circuit Breaker Pattern")
                    .optionC("CQRS Pattern")
                    .optionD("Sidecar Pattern")
                    .correctOption("B")
                    .marks(10)
                    .explanation("The Circuit Breaker pattern (e.g. Resilience4j) wraps network calls and trips when failures exceed a threshold.")
                    .build());

            questionRepository.save(ExamQuestion.builder()
                    .examId(exam2.getId())
                    .questionText("What header is commonly used in REST APIs to ensure safe, duplicate-free request retries?")
                    .optionA("Idempotency-Key")
                    .optionB("Retry-After")
                    .optionC("Cache-Control")
                    .optionD("X-Request-ID")
                    .correctOption("A")
                    .marks(10)
                    .explanation("An Idempotency-Key header allows servers to identify and safely ignore duplicate POST retries.")
                    .build());

            // Seed Questions
            questionRepository.save(ExamQuestion.builder()
                    .examId(exam.getId())
                    .questionText("What does REST stand for in modern web architectures?")
                    .optionA("Representational State Transfer")
                    .optionB("Remote State Transfer")
                    .optionC("Resource State Transfer")
                    .optionD("None of the above")
                    .correctOption("A")
                    .marks(10)
                    .explanation("REST stands for Representational State Transfer, introduced by Roy Fielding in 2000.")
                    .build());

            questionRepository.save(ExamQuestion.builder()
                    .examId(exam.getId())
                    .questionText("Which HTTP method is defined as idempotent according to RFC 7231?")
                    .optionA("POST")
                    .optionB("PUT")
                    .optionC("PATCH")
                    .optionD("CONNECT")
                    .correctOption("B")
                    .marks(10)
                    .explanation("PUT is idempotent because multiple identical requests have the exact same side-effect as a single request.")
                    .build());

            questionRepository.save(ExamQuestion.builder()
                    .examId(exam.getId())
                    .questionText("Under the Single Responsibility Principle (SRP) in SOLID design, what does responsibility mean?")
                    .optionA("A class must only have a single method")
                    .optionB("A class should have one, and only one, reason to change")
                    .optionC("A class cannot import external dependencies")
                    .optionD("A service must only interact with one database table")
                    .correctOption("B")
                    .marks(10)
                    .explanation("Uncle Bob Martin defines SRP as: 'A module should be responsible to one, and only one, actor' (one reason to change).")
                    .build());

            questionRepository.save(ExamQuestion.builder()
                    .examId(exam.getId())
                    .questionText("In Spring Security, which session creation policy should be used for stateless JWT authentication?")
                    .optionA("ALWAYS")
                    .optionB("IF_REQUIRED")
                    .optionC("NEVER")
                    .optionD("STATELESS")
                    .correctOption("D")
                    .marks(10)
                    .explanation("SessionCreationPolicy.STATELESS ensures Spring Security never creates an HttpSession or uses it to obtain SecurityContext.")
                    .build());

            questionRepository.save(ExamQuestion.builder()
                    .examId(exam.getId())
                    .questionText("In an Nginx load balancer configuration, which directive distributes incoming traffic to the server with the fewest active connections?")
                    .optionA("round_robin")
                    .optionB("ip_hash")
                    .optionC("least_conn")
                    .optionD("random_weight")
                    .correctOption("C")
                    .marks(10)
                    .explanation("The 'least_conn' directive instructs Nginx to pass requests to the backend server with the least number of active connections.")
                    .build());

            // Seed Project Topics in ProjectWork
            projectRepository.save(ProjectWork.builder()
                    .courseId(savedCourse.getId())
                    .title("Cloud-Native Autonomous Multi-Agent Orchestrator")
                    .description("Design and build an asynchronous multi-agent coordinator using Spring Boot, Redis queue, and LLM tool-calling APIs. Implement rate limiting and fault tolerance.")
                    .requirements("Deliverables: Project ZIP archive, PPT presentation deck, PDF technical report, and GitHub repository URL.")
                    .deadline(LocalDate.now().plusMonths(1))
                    .trainerId(trainer.getId())
                    .trainerName(trainer.getFullName())
                    .subjectName("Computer Science & AI")
                    .institutionName("Indian Institute of Technology (IIT)")
                    .availableForSelection(true)
                    .status("AVAILABLE")
                    .createdAt(LocalDateTime.now())
                    .build());

            projectRepository.save(ProjectWork.builder()
                    .courseId(savedCourse.getId())
                    .title("High-Throughput Vector Similarity Search Engine")
                    .description("Develop a distributed similarity search service supporting dense embeddings and sparse BM25 keyword matching with sub-15ms latency.")
                    .requirements("Deliverables: Complete ZIP archive, PPT slides, and PDF architectural benchmarks.")
                    .deadline(LocalDate.now().plusWeeks(3))
                    .trainerId(trainer.getId())
                    .trainerName(trainer.getFullName())
                    .subjectName("Computer Science & AI")
                    .institutionName("Indian Institute of Technology (IIT)")
                    .availableForSelection(true)
                    .status("AVAILABLE")
                    .createdAt(LocalDateTime.now())
                    .build());

            log.info("Seeding completed successfully.");
        }

        // 3. Ensure Subject 2: Full Stack Java & Enterprise Cloud Architecture exists (Concerned Faculty: Prof. Marcus Vance)
        boolean hasJavaCourse = courseRepository.findAll().stream().anyMatch(c -> c.getTitle().contains("Full Stack Java"));
        if (!hasJavaCourse) {
            log.info("Seeding Full Stack Java & Enterprise Cloud Architecture subject for Prof. Marcus Vance...");
            Course course2 = courseRepository.save(Course.builder()
                    .title("Full Stack Java & Enterprise Cloud Architecture")
                    .description("Master Java 21 LTS, Spring Boot 3 microservices, Hibernate ORM, Docker containerization, and enterprise distributed patterns.")
                    .category("Enterprise Software")
                    .trainerId(trainer2.getId())
                    .trainerName(trainer2.getFullName())
                    .institutionName("Indian Institute of Technology (IIT)")
                    .badgeColor("#2563EB")
                    .startDate(LocalDate.of(2026, 9, 1))
                    .endDate(LocalDate.of(2026, 12, 15))
                    .enrolledCount(96)
                    .progressPercentage(45)
                    .build());

            CourseModule jm1 = moduleRepository.save(CourseModule.builder()
                    .courseId(course2.getId())
                    .title("Module 1: Basics & Core Java 21 Engineering")
                    .description("JVM internals, bytecode execution, Stack vs Heap memory, and modern type semantics.")
                    .orderIndex(1)
                    .build());

            CourseModule jm2 = moduleRepository.save(CourseModule.builder()
                    .courseId(course2.getId())
                    .title("Module 2: Object-Oriented Design & Interfaces")
                    .description("Encapsulation, inheritance hierarchies, abstract contracts, and SOLID principles.")
                    .orderIndex(2)
                    .build());

            CourseModule jm3 = moduleRepository.save(CourseModule.builder()
                    .courseId(course2.getId())
                    .title("Module 3: Spring Boot Microservices & Database Persistence")
                    .description("Production REST API development, JPA Hibernate ORM, and connection pooling.")
                    .orderIndex(3)
                    .build());

            // Topics under Module 1
            resourceRepository.save(ResourceItem.builder()
                    .courseId(course2.getId())
                    .moduleId(jm1.getId())
                    .title("Introduction to Java & Enterprise Systems")
                    .resourceType("ARTICLE")
                    .urlOrPath("https://docs.oracle.com/en/java/")
                    .orderIndex(1)
                    .description("Platform independence, JVM garbage collection, and modern Java 21 LTS features.")
                    .richContent("### Introduction to Java Enterprise Systems\n\nJava is an established object-oriented programming language designed for platform-independent enterprise software systems.\n\n```java\npackage com.bridgeai.portal;\n\npublic class EnterpriseEngine {\n    public static void main(String[] args) {\n        System.out.println(\"Java Enterprise Node Active on Port 8080\");\n    }\n}\n```\n\n### Architectural Highlights:\n- **Platform Independence**: Bytecode execution across JVM environments.\n- **Garbage Collection**: Automated heap reclamation with low-latency ZGC.\n- **Strong Typing**: Compile-time safety for high-throughput enterprise backends.")
                    .build());

            resourceRepository.save(ResourceItem.builder()
                    .courseId(course2.getId())
                    .moduleId(jm1.getId())
                    .title("Variables & Stack/Heap Memory Allocation")
                    .resourceType("ARTICLE")
                    .urlOrPath("https://docs.oracle.com/en/java/")
                    .orderIndex(2)
                    .description("Stack vs Heap allocation and primitive vs reference semantics.")
                    .richContent("### Variables & Memory Allocation\n\nIn Java, primitive variables reside in thread stack frames, while object instances are allocated in the heap.\n\n```java\nint activeNodes = 16; // Stored in Stack\nString cluster = \"Production-East\"; // Reference to Heap string pool\n```")
                    .build());

            // Topics under Module 2
            resourceRepository.save(ResourceItem.builder()
                    .courseId(course2.getId())
                    .moduleId(jm2.getId())
                    .title("OOP Architecture: Encapsulation & Polymorphism")
                    .resourceType("ARTICLE")
                    .urlOrPath("https://docs.oracle.com/en/java/")
                    .orderIndex(1)
                    .description("Object-oriented architectural fundamentals in high-scale systems.")
                    .richContent("### Polymorphic Contracts\n\nInterfaces decouple service consumers from underlying persistent implementations.\n\n```java\npublic interface PaymentGateway {\n    TransactionResult process(PaymentRequest req);\n}\n```")
                    .build());

            // Topics under Module 3
            resourceRepository.save(ResourceItem.builder()
                    .courseId(course2.getId())
                    .moduleId(jm3.getId())
                    .title("Spring Data JPA & Hibernate ORM Architecture")
                    .resourceType("ARTICLE")
                    .urlOrPath("https://spring.io/projects/spring-data-jpa")
                    .orderIndex(1)
                    .description("Entity lifecycles, transactional boundaries, and repository query methods.")
                    .richContent("### Spring Data JPA Repository\n\nAutomates database queries using method name parsing and JPQL queries with connection pooling.")
                    .build());
        }

        // 4. Ensure Subject 3: Data Structures, Algorithms & System Design exists (Concerned Faculty: Dr. Arvind Roy)
        boolean hasDsaCourse = courseRepository.findAll().stream().anyMatch(c -> c.getTitle().contains("Data Structures"));
        if (!hasDsaCourse) {
            log.info("Seeding Data Structures, Algorithms & System Design subject for Dr. Arvind Roy...");
            Course course3 = courseRepository.save(Course.builder()
                    .title("Data Structures, Algorithms & System Design")
                    .description("In-depth algorithmic problem solving, scalable architecture, load balancing, and high-concurrency storage systems.")
                    .category("Computer Science Core")
                    .trainerId(superAdmin.getId())
                    .trainerName(superAdmin.getFullName())
                    .institutionName("Indian Institute of Technology (IIT)")
                    .badgeColor("#059669")
                    .startDate(LocalDate.of(2026, 9, 1))
                    .endDate(LocalDate.of(2026, 12, 15))
                    .enrolledCount(142)
                    .progressPercentage(60)
                    .build());

            CourseModule dm1 = moduleRepository.save(CourseModule.builder()
                    .courseId(course3.getId())
                    .title("Module 1: Time & Space Complexity Analysis")
                    .description("Asymptotic Big-O notation, amortized runtime analysis, and benchmarking.")
                    .orderIndex(1)
                    .build());

            CourseModule dm2 = moduleRepository.save(CourseModule.builder()
                    .courseId(course3.getId())
                    .title("Module 2: Trees, Graphs & Dynamic Programming")
                    .description("Graph traversals, topological sorting, memoization, and optimal substructure.")
                    .orderIndex(2)
                    .build());

            resourceRepository.save(ResourceItem.builder()
                    .courseId(course3.getId())
                    .moduleId(dm1.getId())
                    .title("Asymptotic Analysis & Big-O Notation")
                    .resourceType("ARTICLE")
                    .urlOrPath("https://en.wikipedia.org/wiki/Asymptotic_computational_complexity")
                    .orderIndex(1)
                    .description("Foundations of algorithmic complexity and scalability limits.")
                    .richContent("### Big-O Asymptotic Complexity\n\nQuantifies how runtime and memory grow as input size $N$ increases.\n\n- O(1): Constant time hash lookups\n- O(log N): Binary search in balanced trees\n- O(N): Linear sequential scan\n- O(N log N): Optimal comparison-based sorting")
                    .build());
        }

        // Ensure all existing courses in database are tagged with their institution name
        courseRepository.findAll().forEach(c -> {
            if (c.getInstitutionName() == null || c.getInstitutionName().isBlank()) {
                c.setInstitutionName("Indian Institute of Technology (IIT)");
                courseRepository.save(c);
            }
        });

        // Enforce Super Boss Admin institutional strike policy on all existing and seeded exams
        institutionService.syncAllExamStrikesWithInstitutions();
    }

    private void seedInstitution(String name, String code, String category, String accreditation,
                                 String address, String city, String state, String pin,
                                 String email, String phone, String web, int estYear) {
        if (!institutionRepository.existsByName(name)) {
            Institution inst = Institution.builder()
                    .name(name)
                    .code(code)
                    .category(category)
                    .accreditation(accreditation)
                    .campusAddress(address)
                    .city(city)
                    .state(state)
                    .postalCode(pin)
                    .country("India")
                    .contactEmail(email)
                    .contactPhone(phone)
                    .websiteUrl(web)
                    .establishedYear(estYear)
                    .status("ACTIVE")
                    .maxStrikesAllowed(3)
                    .createdAt(LocalDateTime.now())
                    .build();
            institutionRepository.save(inst);
            log.info("Seeded institution [{}] in [{}, {}]", name, city, state);
        }
    }

    private User seedUser(String email, String rawPassword, String name, String phone, Role role, String instName, String subject) {
        Long instId = null;
        if (instName != null && !instName.isBlank()) {
            instId = institutionRepository.findByName(instName)
                    .map(Institution::getId)
                    .orElse(null);
        }
        String cleanName = name != null ? name.replaceAll("\\s*\\([^)]*\\)", "").trim() : "";
        User u = userRepository.findByEmail(email).orElse(null);
        if (u == null) {
            u = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .fullName(cleanName)
                    .phone(phone)
                    .role(role)
                    .institutionId(instId)
                    .institutionName(instName)
                    .assignedSubject(subject)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            log.info("Created user [{}] with role [{}] for institute [{}]", email, role, instName);
            return userRepository.save(u);
        } else {
            u.setFullName(cleanName);
            if (rawPassword != null && !rawPassword.isBlank()) {
                u.setPassword(passwordEncoder.encode(rawPassword));
            }
            if (u.getInstitutionId() == null && instId != null) {
                u.setInstitutionId(instId);
            }
            if (u.getInstitutionName() == null && instName != null) {
                u.setInstitutionName(instName);
            }
            if (u.getAssignedSubject() == null && subject != null) {
                u.setAssignedSubject(subject);
            }
            return userRepository.save(u);
        }
    }
}
