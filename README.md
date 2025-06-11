# Career Compass - Technical Documentation

## Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Architecture](#2-architecture)
  - [2.1 System Architecture](#21-system-architecture)
  - [2.2 Data Flow](#22-data-flow)
  - [2.3 Technology Stack](#23-technology-stack)
- [3. Frontend Architecture](#3-frontend-architecture)
  - [3.1 Component Structure](#31-component-structure)
  - [3.2 State Management](#32-state-management)
  - [3.3 Routing](#33-routing)
- [4. Backend Architecture](#4-backend-architecture)
  - [4.1 Database Schema](#41-database-schema)
  - [4.2 Serverless Functions](#42-serverless-functions)
  - [4.3 Authentication](#43-authentication)
- [5. Key Features](#5-key-features)
  - [5.1 Resume Analysis](#51-resume-analysis)
  - [5.2 Job Matching](#52-job-matching)
  - [5.3 User Management](#53-user-management)
- [6. Development Workflow](#6-development-workflow)
  - [6.1 Project Setup](#61-project-setup)
  - [6.2 Development Environment](#62-development-environment)
  - [6.3 Deployment](#63-deployment)
- [7. Future Enhancements](#7-future-enhancements)

## 1. Project Overview

Career Compass is an AI-powered career advancement platform that helps users optimize their job search through resume analysis, skill extraction, and personalized job recommendations. The application is designed to provide a seamless user experience while leveraging artificial intelligence to deliver valuable career insights.

Key capabilities:
- Resume parsing and skill extraction
- AI-powered job matching
- Personalized career roadmaps
- ATS-optimized resume generation

## 2. Architecture

### 2.1 System Architecture

The application follows a modern client-server architecture with a React-based frontend and Supabase as the backend service.

mermaid
flowchart TB
    Client["Client (React)"]
    API["Supabase API"]
    Auth["Authentication Service"]
    DB[(Database)]
    Storage["File Storage"]
    Functions["Serverless Functions"]
    
    Client <--> API
    API <--> Auth
    API <--> DB
    API <--> Storage
    API <--> Functions
    
    subgraph "Frontend (Vite + React)"
        Client
    end
    
    subgraph "Backend (Supabase)"
        API
        Auth
        DB
        Storage
        Functions
    end


### 2.2 Data Flow

The following diagram illustrates the data flow for the resume analysis and job matching process:

mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Auth as Authentication
    participant API as Supabase API
    participant Storage as File Storage
    participant Functions as Serverless Functions
    participant DB as Database
    
    User->>Frontend: Upload Resume (PDF)
    Frontend->>Auth: Authenticate Request
    Auth->>Frontend: Return Auth Token
    Frontend->>Storage: Upload File
    Storage->>Frontend: Return File URL
    Frontend->>DB: Save Resume Metadata
    DB->>Frontend: Confirm Save
    
    Frontend->>Functions: Request Resume Analysis
    Functions->>Storage: Download Resume
    Functions->>Functions: Process Resume (AI)
    Functions->>DB: Store Extracted Skills
    Functions->>Frontend: Return Skills Data
    
    User->>Frontend: Select Job Titles
    Frontend->>Functions: Generate Job Matches
    Functions->>DB: Create Job Search Record
    Functions->>DB: Store Job Matches
    Functions->>Frontend: Return Job Matches
    Frontend->>User: Display Results


### 2.3 Technology Stack

mermaid
graph TD
    Frontend["Frontend"]
    Backend["Backend"]
    
    Frontend --> React["React 18"]
    Frontend --> Vite["Vite"]
    Frontend --> Router["React Router 6"]
    Frontend --> Query["React Query"]
    Frontend --> UI["Shadcn/UI + Tailwind"]
    
    Backend --> Supabase["Supabase"]
    Supabase --> Auth["Auth Service"]
    Supabase --> Postgres["PostgreSQL Database"]
    Supabase --> EdgeFunctions["Edge Functions (TypeScript)"]
    Supabase --> ObjectStorage["Object Storage"]


## 3. Frontend Architecture

### 3.1 Component Structure

The application follows a component-based architecture using React functional components with hooks.

mermaid
graph TD
    App["App.tsx"] --> Router["Router"]
    Router --> Index["Index.tsx (Landing Page)"]
    Router --> Dashboard["Dashboard.tsx"]
    Router --> Pricing["Pricing.tsx"]
    Router --> NotFound["NotFound.tsx"]
    
    Dashboard --> ResumeUpload["Resume Upload"]
    Dashboard --> ResumeAnalysis["ResumeAnalysis.tsx"]
    Dashboard --> JobMatches["JobMatches.tsx"]
    
    Index --> AuthModal["AuthModal.tsx"]
    
    subgraph "UI Components"
        Button["Button"]
        Card["Card"]
        Dialog["Dialog"]
        Input["Input"]
        Tabs["Tabs"]
        Badge["Badge"]
    end


### 3.2 State Management

The application uses React Context API for state management, particularly for authentication.

mermaid
flowchart TB
    AuthContext["AuthContext"]
    
    AuthProvider["AuthProvider"] --> AuthContext
    AuthContext --> User["User State"]
    AuthContext --> Profile["Profile State"]
    AuthContext --> Subscription["Subscription State"]
    AuthContext --> AuthMethods["Authentication Methods"]
    
    AuthMethods --> SignUp["signUp()"]
    AuthMethods --> SignIn["signIn()"]
    AuthMethods --> SignInWithGoogle["signInWithGoogle()"]
    AuthMethods --> SignOut["signOut()"]
    
    Components["Application Components"] --> useAuth["useAuth Hook"]
    useAuth --> AuthContext


### 3.3 Routing

The application uses React Router v6 for navigation between different pages.

mermaid
graph LR
    BrowserRouter["BrowserRouter"]
    Routes["Routes"]
    Route1["/ (Index)"]
    Route2["/dashboard"]
    Route3["/pricing"]
    Route4["* (NotFound)"]
    
    BrowserRouter --> Routes
    Routes --> Route1
    Routes --> Route2
    Routes --> Route3
    Routes --> Route4


## 4. Backend Architecture

### 4.1 Database Schema

The application uses a PostgreSQL database hosted by Supabase with the following schema:

mermaid
erDiagram
    profiles {
        uuid id PK
        string email
        string full_name
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }
    
    subscribers {
        uuid id PK
        uuid user_id FK
        string email
        string stripe_customer_id
        boolean subscribed
        string subscription_tier
        timestamp subscription_end
        timestamp created_at
        timestamp updated_at
    }
    
    resumes {
        uuid id PK
        uuid user_id FK
        string file_name
        string file_url
        json extracted_skills
        string parsed_content
        timestamp created_at
        timestamp updated_at
    }
    
    job_searches {
        uuid id PK
        uuid user_id FK
        uuid resume_id FK
        string[] selected_job_titles
        json skill_gaps
        json roadmap
        string search_status
        timestamp created_at
        timestamp updated_at
    }
    
    job_matches {
        uuid id PK
        uuid job_search_id FK
        string job_title
        string company_name
        string job_description
        string job_url
        integer match_percentage
        string location
        string salary_range
        json requirements
        timestamp created_at
    }
    
    generated_resumes {
        uuid id PK
        uuid job_match_id FK
        uuid user_id FK
        string optimized_content
        string file_url
        timestamp created_at
    }
    
    profiles ||--o{ subscribers : "has"
    profiles ||--o{ resumes : "owns"
    profiles ||--o{ job_searches : "initiates"
    job_searches ||--o{ job_matches : "produces"
    job_matches ||--o{ generated_resumes : "generates"
    resumes ||--o{ job_searches : "used in"


### 4.2 Serverless Functions

The application uses Supabase Edge Functions (serverless functions) for AI-powered processing:

1. *analyze-resume*: Processes uploaded resumes to extract skills and suggest relevant job titles
2. *generate-job-matches*: Creates personalized job matches based on extracted skills and user preferences

mermaid
flowchart TB
    subgraph "analyze-resume function"
        AR1["Authentication"]
        AR2["Resume Retrieval"]
        AR3["File Download"]
        AR4["AI Processing"]
        AR5["Store Results"]
        
        AR1 --> AR2 --> AR3 --> AR4 --> AR5
    end
    
    subgraph "generate-job-matches function"
        GM1["Authentication"]
        GM2["Validate Input"]
        GM3["Create Job Search"]
        GM4["Generate Job Matches"]
        GM5["Store Results"]
        GM6["Update Search Status"]
        
        GM1 --> GM2 --> GM3 --> GM4 --> GM5 --> GM6
    end


### 4.3 Authentication

The application uses Supabase Auth for user authentication with the following methods:

- Email/password authentication
- Google OAuth

mermaid
flowchart TB
    Auth["Supabase Auth"]
    
    Auth --> EmailAuth["Email/Password Auth"]
    Auth --> GoogleAuth["Google OAuth"]
    
    EmailAuth --> SignUp["Sign Up"]
    EmailAuth --> SignIn["Sign In"]
    
    subgraph "User Creation Flow"
        Registration["User Registration"]
        CreateAuth["Create Auth User"]
        CreateProfile["Create Profile"]
        CreateSubscription["Create Subscription Record"]
        
        Registration --> CreateAuth --> CreateProfile --> CreateSubscription
    end


## 5. Key Features

### 5.1 Resume Analysis

The resume analysis process involves several steps:

mermaid
flowchart TD
    Upload["Resume Upload"]
    Store["Store in Supabase Storage"]
    Process["Process with AI"]
    Extract["Extract Skills"]
    Identify["Identify Experience Level"]
    Suggest["Suggest Job Titles"]
    
    Upload --> Store
    Store --> Process
    Process --> Extract
    Process --> Identify
    Process --> Suggest
    
    subgraph "Extracted Data"
        TechnicalSkills["Technical Skills"]
        SoftSkills["Soft Skills"]
        ExperienceYears["Experience Years"]
        JobTitles["Suggested Job Titles"]
    end
    
    Extract --> TechnicalSkills
    Extract --> SoftSkills
    Identify --> ExperienceYears
    Suggest --> JobTitles


### 5.2 Job Matching

The job matching process generates personalized job recommendations:

mermaid
flowchart TD
    JobTitles["Selected Job Titles"]
    CreateSearch["Create Job Search"]
    FindJobs["Find Relevant Jobs"]
    CalculateMatch["Calculate Match Percentage"]
    StoreResults["Store Results"]
    
    JobTitles --> CreateSearch
    CreateSearch --> FindJobs
    FindJobs --> CalculateMatch
    CalculateMatch --> StoreResults
    
    subgraph "Match Criteria"
        Skills["Skills Match"]
        Experience["Experience Level"]
        Location["Location Preference"]
    end
    
    CalculateMatch --> Skills
    CalculateMatch --> Experience
    CalculateMatch --> Location


### 5.3 User Management

The application has a complete user management system:

mermaid
flowchart TB
    Auth["Authentication"]
    Profile["User Profile"]
    Subscription["Subscription Management"]
    
    Auth --> Register["User Registration"]
    Auth --> Login["User Login"]
    Auth --> Logout["User Logout"]
    
    Register --> CreateProfile["Create User Profile"]
    Login --> LoadProfile["Load User Profile"]
    
    Profile --> UpdateProfile["Update Profile"]
    Profile --> ManageSubscription["Manage Subscription"]
    
    ManageSubscription --> Subscribe["Subscribe to Plan"]
    ManageSubscription --> Unsubscribe["Cancel Subscription"]
    ManageSubscription --> Upgrade["Upgrade Plan"]


## 6. Development Workflow

### 6.1 Project Setup

The project is built with Vite and React, using TypeScript for type safety. Dependencies are managed with npm.

Key commands:
- npm run dev: Start development server
- npm run build: Build production bundle
- npm run preview: Preview production build locally

### 6.2 Development Environment

The development environment includes:

- Vite for fast development and builds
- ESLint for code linting
- TypeScript for type checking
- Shadcn UI with Tailwind CSS for styling
- React Router for routing
- React Query for data fetching

### 6.3 Deployment

The application can be deployed using standard deployment processes for Vite applications.

## 7. Future Enhancements

Some potential areas for future enhancement include:

1. *Advanced AI Integration*: Integrating with OpenAI or other LLM APIs for more accurate resume parsing and job matching
2. *Mobile App*: Developing a mobile application to provide on-the-go access
3. *Social Features*: Adding the ability to share career roadmaps or job matches with connections
4. *Expanded Job Sources*: Integrating with job boards and APIs to provide real job listings
5. *Interview Preparation*: Adding AI-powered interview preparation tools
6. *Career Progression Tracking*: Implementing tools to track career progress over time
