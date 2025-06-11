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

```mermaid
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
