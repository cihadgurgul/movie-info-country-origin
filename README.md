# Movie Info & Country of Origin Explorer

## Overview
Movie Info & Country of Origin Explorer is a Node.js web application that allows users to search for a movie by title and view detailed information about the film along with data about the country where it was produced.

The application integrates multiple third-party APIs to combine movie metadata with geographic and demographic country data, demonstrating backend development, API orchestration, and server-side request handling.

This project emphasizes clean architecture, external API integration, and transforming raw API responses into meaningful user-facing information.

---

## What This Application Does
1. Accepts a movie title from the user through a web form  
2. Searches for the movie using The Movie Database (TMDB) API  
3. Retrieves detailed movie metadata, including production country codes  
4. Uses the country ISO code to query the REST Countries API  
5. Displays combined movie and country information in a single response  

The goal is to demonstrate how data from multiple independent services can be aggregated into one cohesive application.

---

## Key Features
- Search for a movie by title  
- Retrieve detailed movie metadata (title, release date, overview)  
- Identify production country using ISO country codes  
- Retrieve country information including:
  - Country name
  - Capital city
  - Geographic region
  - Population
  - National flag
- Server-side rendering of dynamic content  
- Input validation and safe output handling  

---

## Tech Stack
### Backend
- Node.js
- Built-in http and https modules

### Frontend
- HTML (form-based interface)

### External APIs
- TMDB (The Movie Database) API
- REST Countries API

---

## APIs Used and Data Flow

### TMDB – Movie Search
Endpoint:
GET /3/search/movie

Purpose:
- Searches for a movie based on user input
- Returns a list of matching movies
- The first valid result is selected

Data extracted:
- Movie ID

---

### TMDB – Movie Details
Endpoint:
GET /3/movie/{movieId}

Purpose:
- Retrieves full movie metadata
- Provides production country information

Data extracted:
- Title
- Release date
- Overview
- Production country ISO code

---

### REST Countries – Country Information
Endpoint:
GET /v3.1/alpha/{countryCode}

Purpose:
- Retrieves detailed information about a country using its ISO code

Data extracted:
- Country name
- Capital
- Region
- Population
- Flag image

---

## Application Architecture

User Input (HTML Form)
→ Node.js HTTP Server
→ TMDB Search API
→ TMDB Movie Details API
→ REST Countries API
→ Combined Response Rendered to Browser

This flow demonstrates sequential API calls, dependency management between responses, and data transformation across services.

---

## Project Structure
.
├── index.js
├── html/
│   └── index.html
└── auth/
    └── credentials.json  (ignored by git)

---

## How to Run Locally

### 1. Install Node.js
Verify Node.js is installed:
node -v

---

### 2. Add TMDB API Credentials
Create the file:
auth/credentials.json

Add your TMDB API key:
{
  "tmdb_api_key": "YOUR_TMDB_API_KEY"
}

This file should not be committed to GitHub.

---

### 3. Start the Server
From the project directory:
node index.js

---

### 4. Access the Application
Open your browser and navigate to:
http://localhost:3000

Enter a movie title (for example: Inception) and submit the form.

---

## Error Handling and Validation
- User input is validated before API requests
- API responses are checked for required fields
- Output is safely rendered to prevent malformed input
- Graceful handling of missing movies or unavailable country data

---

## Security Considerations
- API keys are stored locally and excluded from version control
- Sensitive credentials are not committed to the repository
- Output rendering avoids unsafe HTML injection

---

## What This Project Demonstrates
- Integration of multiple third-party APIs
- Understanding of HTTP request/response lifecycle
- Server-side routing and logic in Node.js
- Data parsing, transformation, and aggregation
- Clean code organization and documentation practices

---

## What I Learned
- Coordinating multiple dependent API calls
- Structuring a backend application cleanly
- Handling real-world API inconsistencies
- Debugging network and data flow issues
- Writing clear technical documentation

---

## Future Improvements
- Add client-side styling for improved UI
- Support multiple production countries per movie
- Add caching to reduce repeated API calls
- Improve error messaging and user feedback

---

## Notes
This project reflects a focus on backend fundamentals, API integration, and clean application structure rather than UI complexity.