// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

const express = require("express");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const { https } = require("firebase-functions");


const app = express();
const quotes = require("./quotes.json"); // Add this file inside the `functions` folder

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const API_KEY = process.env.API_KEY || "default_api_key";
app.use(express.json());

// 🔹 Apply Rate Limiting to Prevent Abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: "Too many requests, please try again later." }
  });
  app.use(limiter);
  
  // 🔹 Middleware to Enforce API Key Authentication
  app.use((req, res, next) => {
    const providedKey = req.headers["x-api-key"];
    if (!providedKey || providedKey !== API_KEY) {
      return res.status(403).json({ error: "Unauthorized: Invalid API Key" });
    }
    next();
  });
  

// Endpoints (copy from your `app.js` file)
app.post("/quotes", async (req, res) => {
    try {
        for (const quote of quotes) {
            const snapshot = await db.collection("quotes").where("text", "==", quote.text).get();
            if (!snapshot.empty) {
                console.log(`Quote already exists: "${quote.text}"`);
                continue;
            }
            const docRef = db.collection("quotes").doc();
            await docRef.set(quote);
        }
        res.status(201).send("Quotes uploaded successfully (duplicates skipped)!");
    } catch (error) {
        console.error("Error uploading quotes:", error);
        res.status(500).send("Error uploading quotes");
    }
});

app.get("/quotes", async (req, res) => {
    try {
        const snapshot = await db.collection("quotes").get();
        const allQuotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(allQuotes);
    } catch (error) {
        console.error("Error fetching quotes:", error);
        res.status(500).send("Error fetching quotes");
    }
});

app.get("/quotes/random", async (req, res) => {
    try {
        const snapshot = await db.collection("quotes").get();
        const allQuotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
        res.status(200).json(randomQuote);
    } catch (error) {
        console.error("Error fetching random quote:", error);
        res.status(500).send("Error fetching random quote");
    }
});

app.get("/quotes/category/:category", async (req, res) => {
    try {
        const category = req.params.category;
        const snapshot = await db.collection("quotes").where("category", "==", category).get();
        const categoryQuotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(categoryQuotes);
    } catch (error) {
        console.error("Error fetching quotes by category:", error);
        res.status(500).send("Error fetching quotes by category");
    }
});

// Export the Express app as a Firebase Function
//exports.api = require("firebase-functions").https.onRequest(app);

exports.api = https.onRequest(app);
