const http = require("http");
const https = require("https");
const fs = require("fs");
const url = require("url");
const path = require("path");
const querystring = require("querystring");

// ============================
// CONFIGURATION
// ============================
const PORT = 3000;

const CREDENTIALS_PATH = path.join(__dirname, "auth", "credentials.json");

let TMDB_API_KEY = "";

try {
  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf8");
  const creds = JSON.parse(raw);
  TMDB_API_KEY = creds.tmdb_api_key;
} catch (err) {
  console.error("ERROR: Unable to load TMDB API key");
}


// ============================
// SERVER
// ============================

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    console.log(`Request: ${req.method} ${parsed.pathname}`);

    if (req.method === "GET" && parsed.pathname === "/") {
        return serveHomePage(res);
    }

    if (req.method === "POST" && parsed.pathname === "/search") {
        return handleMovieSearch(req, res);
    }

    // 404
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 Not Found</h1>");
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


// ============================
// PAGE HANDLERS
// ============================

function serveHomePage(res) {
    fs.readFile("./html/index.html", (err, data) => {
        if (err) {
            console.error("Error loading index.html:", err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            return res.end("Server error");
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
    });
}


function handleMovieSearch(req, res) {
    let body = "";

    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
        const form = querystring.parse(body);
        const title = (form.title || "").trim();

        if (!title) {
            res.writeHead(200, { "Content-Type": "text/html" });
            return res.end(`<h1>Please enter a movie title.</h1><a href="/">Back</a>`);
        }

        console.log("Searching TMDB for:", title);

        // PHASE 2 – first API call
        searchTMDB_Title(title, (movieDetails) => {
            if (!movieDetails) {
                res.writeHead(200, { "Content-Type": "text/html" });
                return res.end(`<h1>No movie found for "${title}".</h1><a href="/">Back</a>`);
            }

            const countries = movieDetails.production_countries || [];
            if (countries.length === 0) {
                res.writeHead(200, { "Content-Type": "text/html" });
                return res.end(`<h1>Movie found but has no production country info.</h1><a href="/">Back</a>`);
            }

            const countryCode = countries[0].iso_3166_1;
            console.log("Country code:", countryCode);

            // PHASE 3 – second API call
            fetchCountry(countryCode, (countryInfo) => {
                if (!countryInfo) {
                    res.writeHead(200, { "Content-Type": "text/html" });
                    return res.end("<h1>Could not load country info.</h1><a href='/'>Back</a>");
                }

                // PHASE 4 – final response
                respondToUser(res, movieDetails, countryInfo);
            });
        });
    });
}


// ============================
// TMDB API (Search → Details)
// ============================

// Step 1: Search by title
function searchTMDB_Title(title, callback) {
    const path = `/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&include_adult=false`;

    const options = {
        hostname: "api.themoviedb.org",
        path: path,
        method: "GET"
    };

    console.log("TMDB Search Request:", path);

    const req = https.request(options, (resSearch) => {
        let data = "";

        resSearch.on("data", chunk => data += chunk.toString());
        resSearch.on("end", () => {
            if (resSearch.statusCode !== 200) return callback(null);

            let parsed;
            try {
                parsed = JSON.parse(data);
            } catch {
                return callback(null);
            }

            if (!parsed.results || parsed.results.length === 0)
                return callback(null);

            const movieId = parsed.results[0].id;

            // NOW fetch full details
            fetchTMDB_Details(movieId, callback);
        });
    });

    req.on("error", () => callback(null));
    req.end();
}


// Step 2: Get full movie details (this includes production_countries)
function fetchTMDB_Details(movieId, callback) {
    const path = `/3/movie/${movieId}?api_key=${TMDB_API_KEY}`;

    const options = {
        hostname: "api.themoviedb.org",
        path: path,
        method: "GET"
    };

    console.log("TMDB Details Request:", path);

    const req = https.request(options, (resDetail) => {
        let data = "";

        resDetail.on("data", chunk => data += chunk.toString());
        resDetail.on("end", () => {
            if (resDetail.statusCode !== 200) return callback(null);

            try {
                const json = JSON.parse(data);
                callback(json);
            } catch {
                callback(null);
            }
        });
    });

    req.on("error", () => callback(null));
    req.end();
}


// ============================
// REST COUNTRIES API
// ============================

function fetchCountry(code, callback) {
    const path = `/v3.1/alpha/${encodeURIComponent(code)}?fields=name,capital,region,population,flags`;

    const options = {
        hostname: "restcountries.com",
        path: path,
        method: "GET"
    };

    console.log("REST Countries Request:", path);

    const req = https.request(options, (apiRes) => {
        let data = "";

        apiRes.on("data", chunk => data += chunk.toString());
        apiRes.on("end", () => {
            if (apiRes.statusCode !== 200) return callback(null);

            try {
                const json = JSON.parse(data);
                const obj = Array.isArray(json) ? json[0] : json;
                callback(obj);
            } catch {
                callback(null);
            }
        });
    });

    req.on("error", () => callback(null));
    req.end();
}


// ============================
// FINAL RESPONSE TO USER
// ============================

function respondToUser(res, movie, country) {
    res.writeHead(200, { "Content-Type": "text/html" });

    const movieTitle = movie.title || movie.original_title;
    const release = movie.release_date || "N/A";
    const overview = movie.overview || "N/A";

    const countryName = country.name?.common || "N/A";
    const capital = (country.capital && country.capital[0]) || "N/A";
    const region = country.region || "N/A";
    const population = country.population || "N/A";
    const flag = country.flags?.png;

    const html = `
        <h1>Movie Origin Explorer</h1>

        <h2>Movie Info</h2>
        <p><strong>Title:</strong> ${escape(movieTitle)}</p>
        <p><strong>Release Date:</strong> ${escape(release)}</p>
        <p><strong>Overview:</strong> ${escape(overview)}</p>

        <h2>Country Info</h2>
        <p><strong>Name:</strong> ${escape(countryName)}</p>
        <p><strong>Capital:</strong> ${escape(capital)}</p>
        <p><strong>Region:</strong> ${escape(region)}</p>
        <p><strong>Population:</strong> ${escape(population)}</p>
        ${flag ? `<img src="${flag}" width="200">` : ""}

        <p><a href="/">Search again</a></p>
    `;

    res.end(html);
}


// Escape HTML
function escape(str) {
    return String(str).replace(/[&<>"]/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
    }[c]));
}