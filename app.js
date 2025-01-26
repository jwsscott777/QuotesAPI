const express = require("express");
const admin = require("firebase-admin");
const quotes = require("./quotes.json");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

const db = admin.firestore();
const app = express();
const port = 3000;

app.use(express.json());
// Original post request
// app.post("/quotes", async (req, res) => {
//     try {
//       for (const quote of quotes) {
//         const docRef = db.collection("quotes").doc(); // Auto-generate an ID
//         await docRef.set(quote);
//       }
//       res.status(201).send("Quotes uploaded successfully!");
//     } catch (error) {
//       console.error("Error uploading quotes:", error);
//       res.status(500).send("Error uploading quotes");
//     }
//   });

app.post("/quotes", async (req, res) => {
    try {
      for (const quote of quotes) {
        // Check if the quote already exists in Firestore
        const snapshot = await db.collection("quotes").where("text", "==", quote.text).get();
        if (!snapshot.empty) {
          console.log(`Quote already exists: "${quote.text}"`);
          continue; // Skip duplicate quotes
        }
        const docRef = db.collection("quotes").doc(); // Auto-generate an ID
        await docRef.set(quote);
      }
      res.status(201).send("Quotes uploaded successfully (duplicates skipped)!");
    } catch (error) {
      console.error("Error uploading quotes:", error);
      res.status(500).send("Error uploading quotes");
    }
  });

  // 2. Get all quotes
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
  
  // 3. Get a random quote
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
  
  // 4. Get quotes by category
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

  // Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });




  

