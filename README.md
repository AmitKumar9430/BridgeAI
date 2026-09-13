# BridgeAI

**BridgeAI** is an integrated **Training, Learning & Examination Management Platform** designed for educational institutions and organizations to manage training programs, courses, assignments, projects, secure online examinations, proctoring, live sessions, and student performance through role-based dashboards.

The platform provides a centralized ecosystem connecting **students, trainers, administrators, super administrators, and vigilance/proctoring teams**.

---

## 🚀 Key Features

### 🎓 Student Management

* Student registration and authentication
* Personalized student dashboard
* Course and training access
* Assignment submission
* Project participation
* Exam participation
* Exam result tracking
* Certificates and academic records
* Notifications and updates

### 📚 Training & Course Management

* Create and manage courses
* Course modules and learning resources
* Trainer assignment
* Training progress management
* Assignment creation and evaluation
* Project management
* Student-team/project allocation

### 📝 Online Examination

* Secure online examinations
* MCQ-based assessments
* Coding assessments
* Custom test cases for coding questions
* Exam attempts and answer tracking
* Automated evaluation
* Exam result generation
* Violation tracking

### 🛡️ Secure Proctoring & Vigilance

BridgeAI includes mechanisms for conducting controlled online examinations.

Features include:

* Browser/assessment protection
* Examination activity monitoring
* Violation detection and recording
* Vigilance dashboard
* Exam attempt monitoring
* Audit logging
* Secure assessment environment

### 👨‍🏫 Trainer Dashboard

Trainers can:

* Manage assigned courses
* View students
* Manage assignments
* Evaluate submissions
* Conduct training activities
* Manage projects
* Track learner performance

### 🏢 Administrative Dashboards

The platform supports multiple administrative roles:

* **Admin**
* **Super Admin**
* **Boss/Admin-level management**
* **Vigilance/Proctoring team**

Each role receives access based on its permissions and responsibilities.

### 🔐 Authentication & Security

* Role-based authentication
* JWT-based authorization
* Secure password handling
* OTP-based workflows
* Protected API endpoints
* Role-based access control
* Assessment protection
* Audit logging

---

## 🏗️ System Architecture

BridgeAI follows a modern full-stack architecture:

```text
                   ┌─────────────────────┐
                   │      BridgeAI       │
                   │     Platform        │
                   └──────────┬──────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
        ┌────────▼────────┐      ┌────────▼────────┐
        │   React Client  │      │ Spring Boot API │
        │      + Vite     │      │     Backend     │
        └────────┬────────┘      └────────┬────────┘
                 │                         │
                 │                         │
                 │                ┌────────▼────────┐
                 │                │   Database      │
                 │                │  / Persistence  │
                 │                └─────────────────┘
                 │
        ┌────────▼────────┐
        │ Role-Based      │
        │ Dashboards      │
        └─────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* **React**
* **Vite**
* **JavaScript / JSX**
* **Tailwind CSS**
* React Context API
* Axios/API service layer

### Backend

* **Java**
* **Spring Boot**
* Spring Security
* JWT Authentication
* Spring Data JPA
* Maven

### Security

* JWT authentication
* Role-based authorization
* OTP authentication workflows
* Assessment protection
* Audit logging
* Exam violation tracking

### Deployment & Infrastructure

* Docker
* Docker Compose
* Nginx
* Netlify
* Render

---

## 📁 Project Structure

```text
BridgeAI/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   └── common/
│   │   │
│   │   ├── context/
│   │   ├── pages/
│   │   ├── security/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/bridgeai/portal/
│   │   │   │       ├── config/
│   │   │   │       ├── controller/
│   │   │   │       ├── dto/
│   │   │   │       ├── exception/
│   │   │   │       ├── model/
│   │   │   │       ├── repository/
│   │   │   │       ├── security/
│   │   │   │       └── service/
│   │   │   │
│   │   │   └── resources/
│   │   │
│   │   └── test/
│   │
│   ├── Dockerfile
│   └── pom.xml
│
├── docker/
│   └── nginx/
│
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## 🔄 Application Modules

BridgeAI is organized into multiple functional modules:

| Module         | Purpose                                        |
| -------------- | ---------------------------------------------- |
| Authentication | User registration, login and authorization     |
| Courses        | Course and module management                   |
| Training       | Training delivery and learner management       |
| Assignments    | Assignment creation, submission and evaluation |
| Projects       | Project selection, teams and project work      |
| Examinations   | Online exams and attempts                      |
| Coding Tests   | Programming questions and test-case evaluation |
| Proctoring     | Assessment protection and violation monitoring |
| Vigilance      | Examination monitoring and compliance          |
| Certificates   | Certificate management                         |
| Live Sessions  | Training/live session management               |
| Notifications  | Student and system notifications               |
| Audit Logs     | Tracking important platform activities         |
| Administration | Platform and institution management            |

---

## 👥 User Roles

BridgeAI follows a role-based architecture.

### Student

Students can:

* Access assigned courses
* Attend training
* Submit assignments
* Participate in projects
* Take examinations
* View results
* Receive notifications
* Access certificates

### Trainer

Trainers can:

* Manage assigned courses
* Manage training content
* Review assignments
* Evaluate submissions
* Manage projects
* Track students

### Admin

Administrators can manage:

* Students
* Trainers
* Courses
* Training programs
* Examinations
* Assignments
* Projects
* Institutional data

### Super Admin

Super administrators have broader platform-level control and management capabilities.

### Vigilance

Vigilance users are responsible for examination monitoring and handling assessment-related violations and records.

---

## 🔐 Authentication Flow

A typical authentication flow is:

```text
User
 │
 ▼
Registration / Login
 │
 ▼
Authentication API
 │
 ▼
Credential Validation
 │
 ▼
JWT Token Generation
 │
 ▼
Frontend stores authentication state
 │
 ▼
Protected API Requests
 │
 ▼
Role-Based Authorization
 │
 ▼
Role-specific Dashboard
```

---

## 📝 Examination Flow

```text
Create Examination
       │
       ▼
Add Questions
       │
       ├──────────────┐
       ▼              ▼
     MCQ         Coding Questions
       │              │
       │        Add Test Cases
       │              │
       └───────┬──────┘
               ▼
        Student Attempts Exam
               │
               ▼
        Assessment Protection
               │
               ▼
       Answers Recorded
               │
               ▼
          Evaluation
               │
               ▼
         Exam Result
               │
               ▼
       Performance Record
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Java
* Maven
* Database required by the configured Spring Boot environment
* Docker *(optional)*

---

## 💻 Running the Frontend

Navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will then be available through the Vite development server.

---

## ☕ Running the Backend

Navigate to the server directory:

```bash
cd server
```

Build the Spring Boot application:

```bash
mvn clean install
```

Run the application:

```bash
mvn spring-boot:run
```

The backend configuration can be found in:

```text
server/src/main/resources/application.yml
```

---

## 🐳 Running with Docker

BridgeAI also contains Docker configuration for containerized deployment.

From the project root:

```bash
docker-compose up --build
```

To stop the containers:

```bash
docker-compose down
```

---

## 🌐 Deployment

The project includes deployment configuration for:

* **Netlify** — frontend deployment
* **Render** — backend/deployment configuration
* **Docker** — containerized deployment
* **Nginx** — reverse proxy and web server configuration

Deployment configuration files include:

```text
netlify.toml
render.yaml
docker-compose.yml
docker/
```

---

## 🔒 Security Considerations

BridgeAI is designed with security-sensitive workflows in mind, particularly online examinations.

The platform incorporates:

* JWT-based authentication
* Protected backend endpoints
* Role-based authorization
* OTP workflows
* Assessment protection
* Exam violation records
* Audit logs
* Secure API communication
* Server-side validation

Sensitive credentials and environment-specific configuration should **not** be committed to source control.

---

## 📊 Backend Architecture

The backend follows a layered Spring Boot architecture:

```text
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
Database
```

### Controllers

REST controllers expose APIs for major platform capabilities such as:

* Authentication
* Courses
* Assignments
* Exams
* Projects
* Certificates
* Live Sessions
* Notifications
* Institutions
* Vigilance
* Administration

### Services

Business logic is implemented through dedicated service classes.

Examples include:

* `AuthService`
* `ExamService`
* `AssignmentService`
* `ProjectService`
* `TrainingService`
* `ProctoringService`
* `VigilanceService`
* `FileStorageService`

### Repositories

Spring Data repositories provide persistence operations for the application's entities.

---

## 🧪 Testing

Backend tests are located under:

```text
server/src/test/
```

Run backend tests using:

```bash
mvn test
```

---

## 📌 Environment Configuration

Environment-specific configuration should be supplied through environment variables or deployment secrets rather than committing sensitive values into the repository.

Typical configuration may include:

```text
Database configuration
JWT configuration
Email configuration
File storage configuration
Frontend API URL
Deployment-specific settings
```

Refer to:

```text
server/src/main/resources/application.yml
```

and the deployment configuration files for the environment-specific setup.

---

## 🎯 Project Goals

BridgeAI aims to provide a unified platform that reduces the fragmentation between:

**Training → Learning → Assessment → Evaluation → Monitoring → Certification**

Instead of using separate systems for training, assignments, examinations, and monitoring, BridgeAI brings these workflows together into a single platform.

---

## 🔮 Future Enhancements

Potential future improvements include:

* AI-powered learning recommendations
* AI-assisted assessment evaluation
* Advanced examination analytics
* Automated performance insights
* Enhanced remote proctoring
* Learning-path personalization
* Real-time examination analytics
* Advanced institutional reporting
* Mobile application support

---

## 🤝 Contributing

Contributions are welcome.

A typical contribution workflow:

```bash
git checkout -b feature/your-feature
```

Make your changes, test them, and commit:

```bash
git add .
git commit -m "Add your feature"
```

Push the branch:

```bash
git push origin feature/your-feature
```

Then create a Pull Request.

---

## 📄 License

Add the applicable project license here.

If this is a private or institutional project, specify the appropriate ownership and usage restrictions.

---

## ⭐ BridgeAI

**BridgeAI — Connecting Training, Assessment and Performance in one platform.**
