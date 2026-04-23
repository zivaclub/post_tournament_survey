import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

dotenv.config({ path: ".env.local" });

const app = express();
const PORT = 3001;
const GOOGLE_SHEET_ID = "1mZN6vvTWw1I1EfX9IjFTTcJe7AIDnJG5nj1iTYgcap0"
const STATS_SHEET_ID = "1zGvXTm-UFohEtVo--MxpXFmDYCl-Q2Mgu2Pl-HyOERE"
const DATA_SHEET_ID = "19AgjIJXOvWv9BBbj-9nESD3z9cTE6675Yjt4qPMhYb8"
const GOOGLE_SERVICE_ACCOUNT_EMAIL = "sheets-editor-bot@ziva-491808.iam.gserviceaccount.com"
const GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/Vjrp2eBgwG5B\n8zgSij26ayhkfOuspTPtSUwf50x0r7S881N69HEcLSuBcWMXD2jLCRFS2davlJO1\n7+aG23IMW7Q3Le5KiMCwYyIHzyIowDqDpACIjEcHV00a+S1Qip/8AS6tRwHtPzeG\n/72RcLXXaqUnmrb6ew5LSmBaqGWfkPKib/qcx9E5x+7A/8bDb2d/p+y4oNng1jJT\nXXeX+2EKvS/zbO0mMuJbSwc1ifmQU2doyeshJtsSessP6WNz0hgydSM3LreN/XCp\nl/uOBwmG7rVJ8x4EdZJZgJTnPjmSD9az4WOxY9GcXbp8k5I6uGIB21w2UHhlniqu\nOdWIzhmtAgMBAAECggEAJIUz94DDqBPyt5nR4RAL2jIr4opJfYmG0MrFwe0nFbqX\n19zl2TkhAczJWgqnbDZfvSk86kB0Ds1gKEDjEmh+a0dxrXqR2h4iEUjKrQznKzoN\nsSSziVylDgymxfg7ovzirnoXS7Ga94qycY0MxN7rhnNvlJCeTk8AmnRW0dcElqEC\nH/0oB6e3PTjUvMzgMIRCp7rzP+3uTTblDFJavdgIE4/DfDGyymjin1stLnSSozh5\nIcRKUO7lyARrS9p+QoSc/eVzqHhthLoTsnUerlH8VvOeH1lynDDcCq5WF4r5iGLj\nYv6R6rUXyS87fJo3i8EbymrngUu04jzNsVwmBp/xoQKBgQDzbokyrsTm3WZsUHYY\nsXeVyHnvrOtfK9mnyscHsL+OUOiQkY6KVXF9XTuxkdRiE+deGcRFgudzAA696zKs\n8nmXEcjWOSBLjxJNTHpqoOQtbgECMfAaYXzmIFoMcxVT7BwKrtcl64SS9a24Qm9a\nZc3BaNVrt2l0lPD35ejZXywoBQKBgQDJNyZTQthZkgTX+LN9nvGtFTnBozWmB2qj\njuH5HmmlgYiszvHehpiQzbmdcG2sxi0zZpwgWAGrLecffsPj5aDMOYd+LAo/RqhU\nsc30Ek7Te5epfwrvYiX1Jn+5rNjgVyHJfAFm8YD4vHEVsWYNQ7j3qqul9QYJXMSH\nuv8oMCQjiQKBgQDKcXR7x8hMTndtQITWCFBxKiXt4ppjrW33ErXueVj0m+iswcAO\n3vvgy/Zmt+YuImtZYIhPXovooXWhD8Y2+feQYOPq89sduz/3NNDheCgKd98y2iDZ\nb5WVM/ZvQA3Omx6+66RVDsZUCSiNggJk5SD15Z8HU6LJp0u2fWblzzZDmQKBgQDI\nXKVKJXbgAjnWgSziOyJ2cntXqVhjomD6yu2TrkgO6WSah1trdWV4U5KwBmL/tzsN\nQvDWeCv5M7VAtG8FgQPUOLkF137AsXAvHfpyPsTFa/2CZyIRaw9XBOYMkuRGyBy5\n0ERpKLR/es20hziSnswRup4/nDRNoFWGvpsTfpSN2QKBgDbQ8ReFUHDTfppC55Yh\nk2dS3S+G1jEalW/RxEphBy+hSnGDpw4yxY5gw9q+7vqUSoWEnGb2pBU08qAjBHwT\nPXJcTk1/SpbcDm6WxVi9YXUL4XjJ9XLXBAu7VMyQvzQZcFEuWP+4PJNHk3xHU0sK\n8JqTVxQSvM9z/99/BySRxWv3\n-----END PRIVATE KEY-----\n"

app.use(express.json());

// Google Sheets API Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// API routes
app.post("/api/submit", async (req, res) => {
  const {
    username,
    player_name,
    answers,
    timestamp,
    computed_report,
    compared_with_pre,
    pre_match_found,
  } = req.body;
  const resolvedName = player_name || username;

  if (!GOOGLE_SHEET_ID || !STATS_SHEET_ID) {
    console.error("GOOGLE_SHEET_ID or STATS_SHEET_ID is missing");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Save to main answers sheet
    const answerRow = [
      timestamp || new Date().toISOString(),
      resolvedName || "",
      JSON.stringify(answers || {}),
      JSON.stringify(computed_report || {}),
      compared_with_pre ? "true" : "false",
      pre_match_found ? "true" : "false",
      "post-survey",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [answerRow],
      },
    });

    // Save to stats sheet
    const statsRow = [
      timestamp || new Date().toISOString(),
      resolvedName || "",
      computed_report?.confidenceScore || 0,
      computed_report?.energyScore || 0,
      computed_report?.socialConfidence || 0,
      computed_report?.mentalWellnessChange || 0,
      computed_report?.strengths?.join("; ") || "",
      computed_report?.suggestions?.join("; ") || "",
      compared_with_pre ? "true" : "false",
      pre_match_found ? "true" : "false",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: STATS_SHEET_ID,
      range: "Sheet1!A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [statsRow],
      },
    });

    console.log(`Successfully submitted survey and stats for user: ${resolvedName}`);
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

// API endpoint to fetch player names from Google Sheet
app.get("/api/players", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: DATA_SHEET_ID,
      range: "Sheet1!B:B", // Column B for player names
    });

    const rows = response.data.values || [];
    // Skip header row and filter out empty names
    const playerNames = rows
      .slice(1) // Skip header row
      .filter(row => row[0] && row[0].trim() !== "") // Filter out empty names
      .map(row => ({ name: row[0].trim() }));

    console.log(`Fetched ${playerNames.length} player names from Google Sheet`);
    res.json(playerNames);
  } catch (error: any) {
    console.error("Error fetching player names:", error);
    res.status(500).json({ 
      error: "Failed to fetch player names", 
      details: error.message 
    });
  }
});

// API endpoint to fetch pre-survey data from Google Sheet
app.get("/api/pre-survey", async (req, res) => {
  try {
    // Fetch columns B to O to get both names (B) and pre-survey answers (C-O)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: DATA_SHEET_ID,
      range: "Sheet1!B:O", // Columns B to O (B=name, C-O=answers)
    });

    const rows = response.data.values || [];
    const preSurveyData = [];
    
    // Skip header row and process each row
    rows.slice(1).forEach((row, index) => {
      if (row[0] && row[0].trim() !== "") { // Check if column B (name) has a value
        const answers: any = {};
        
        // Map columns C-O (indexes 1-13) to questions q1-q7
        // C=row[1], D=row[2], E=row[3], F=row[4], G=row[5], H=row[6], I=row[7]
        for (let i = 1; i <= 7; i++) {
          const answer = row[i];
          if (answer !== undefined && answer !== null && answer !== "") {
            answers[`q${i}`] = parseInt(answer) || 0;
          }
        }
        
        preSurveyData.push({
          name: row[0].trim(), // Column B is the name
          answers: answers
        });
      }
    });

    console.log(`Fetched ${preSurveyData.length} pre-survey records from Google Sheet`);
    res.json(preSurveyData);
  } catch (error: any) {
    console.error("Error fetching pre-survey data:", error);
    res.status(500).json({ 
      error: "Failed to fetch pre-survey data", 
      details: error.message 
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "prod") {
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
