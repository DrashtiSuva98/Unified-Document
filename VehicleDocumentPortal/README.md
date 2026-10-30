
# Unified Vehicle Document Intelligence Portal

## 1. Project Overview

A vehicle document intelligence portal built using ASP.NET Core 9 MVC and Angular 19.2.

The application consolidates vehicle sales information and service history into a single interface using vehicle registration numbers. It generates downloadable PDF reports containing ownership details, sales documents, warranty information, service history, and additional notes.

The backend exposes REST APIs through MVC controllers, while Angular provides the frontend. Both are hosted by the same ASP.NET Core server.

## 2. Technology Stack

- **Backend:** ASP.NET Core 9, C#
- **Frontend:** Angular 19.2 (Standalone Components)
- **Build Tool:** esbuild
- **Runtime:** Node.js 22.9.0, npm 10.8.3
- **Data Source:** JSON mock data
- **PDF Generation:** jsPDF 4.2.1
- **Storage:** Browser Local Storage

## 3. Prerequisites

Ensure the following versions are installed:

- Visual Studio 2022 (17.14.41)
- .NET SDK 9.0.318
- Node.js 22.9.0
- npm 10.8.3

Verify installations:

```powershell
dotnet --version
node --version
npm --version
```

## 4. Build and Run

Clone the repository and navigate to the project directory.

**Restore backend dependencies:**

```powershell
dotnet restore
```

**Install frontend dependencies:**

```powershell
cd ClientApp
npm.cmd ci
```

**Start the application:**

```powershell
npm.cmd start
```

Open the application:

http://localhost:5080

The start command builds the Angular frontend and launches the ASP.NET Core server. Both UI and APIs are served from the same application.

Press `Ctrl + C` to stop the application.

### Build Commands

Backend:

```powershell
dotnet build
```

Frontend (from ClientApp):

```powershell
npm.cmd run build
```

## 5. Features and API Endpoints

### Key Features

- Search vehicles using registration numbers.
- Retrieve sales and service information concurrently.
- Display ownership, invoice, and warranty information.
- View complete vehicle service history.
- Edit report information and additional notes.
- Generate, preview, and download consolidated PDF reports.
- Validate registration numbers and handle API errors.
- Browse 50 sample Maharashtra vehicle registrations.

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/vehicles` | List available vehicles |
| GET | `/api/sales/{registrationNumber}` | Retrieve sales information |
| GET | `/api/services/{registrationNumber}` | Retrieve service history |
| GET | `/api/health` | Application health check |


## 6. AI Collaboration Narrative

GitHub Copilot was used as an AI-assisted development tool throughout the implementation.

My approach was to break the requirements into smaller tasks rather than generating the entire application through a single prompt.

I used Copilot to assist with:

- Exploring implementation approaches and application structure.
- Generating initial backend APIs and Angular components.
- Implementing validation, error handling, and PDF generation.
- Identifying potential issues and refining code.
- Supporting documentation and test development.

### Verification and Quality Assurance

I treated AI-generated code as a starting point and reviewed the implementation before integrating it.

I independently verified:

- Backend and frontend builds.
- API contracts and integration.
- Registration number validation and normalization.
- Concurrent API requests and error handling.
- PDF generation, editing, and download functionality.
- Data consistency and invoice calculations.
- Application behavior through dedicated test scripts.

I also reviewed dependency compatibility and avoided forced upgrades that could introduce breaking changes.

### My Responsibility

I retained ownership of the architecture, technical decisions, code review, integration, and final validation.

Copilot accelerated implementation, but the final design decisions and responsibility for code quality remained mine.

**Outcome:** A functional vehicle document intelligence portal that consolidates sales and service information into a unified searchable interface with downloadable PDF reports.

---
