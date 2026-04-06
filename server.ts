import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3000;
const GOOGLE_SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";

app.use(express.json());

// Google Sheets API Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// API routes
app.post("/api/submit", async (req, res) => {
  const { username, answers, timestamp } = req.body;

  if (!GOOGLE_SHEET_ID) {
    console.error("GOOGLE_SHEET_ID is missing");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Prepare row data
    // Column A: Timestamp, Column B: Username, Column C-P: Answers 1-14
    const row = [timestamp, username];
    for (let i = 1; i <= 14; i++) {
      row.push(answers[i] || "");
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:P",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    console.log(`Successfully submitted survey for user: ${username}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Google Sheets error details:", {
      message: error.message,
      code: error.code,
      errors: error.errors,
    });
    res.status(500).json({ 
      error: "Failed to submit to Google Sheets", 
      details: error.message 
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not on Vercel or if explicitly running locally
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
