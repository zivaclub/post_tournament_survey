import { google } from "googleapis";

const DATA_SHEET_ID = "19AgjIJXOvWv9BBbj-9nESD3z9cTE6675Yjt4qPMhYb8";
const GOOGLE_SERVICE_ACCOUNT_EMAIL = "sheets-editor-bot@ziva-491808.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/Vjrp2eBgwG5B\n8zgSij26ayhkfOuspTPtSUwf50x0r7S881N69HEcLSuBcWMXD2jLCRFS2davlJO1\n7+aG23IMW7Q3Le5KiMCwYyIHzyIowDqDpACIjEcHV00a+S1Qip/8AS6tRwHtPzeG\n/72RcLXXaqUnmrb6ew5LSmBaqGWfkPKib/qcx9E5x+7A/8bDb2d/p+y4oNng1jJT\nXXeX+2EKvS/zbO0mMuJbSwc1ifmQU2doyeshJtsSessP6WNz0hgydSM3LreN/XCp\nl/uOBwmG7rVJ8x4EdZJZgJTnPjmSD9az4WOxY9GcXbp8k5I6uGIB21w2UHhlniqu\nOdWIzhmtAgMBAAECggEAJIUz94DDqBPyt5nR4RAL2jIr4opJfYmG0MrFwe0nFbqX\n19zl2TkhAczJWgqnbDZfvSk86kB0Ds1gKEDjEmh+a0dxrXqR2h4iEUjKrQznKzoN\nsSSziVylDgymxfg7ovzirnoXS7Ga94qycY0MxN7rhnNvlJCeTk8AmnRW0dcElqEC\nH/0oB6e3PTjUvMzgMIRCp7rzP+3uTTblDFJavdgIE4/DfDGyymjin1stLnSSozh5\nIcRKUO7lyARrS9p+QoSc/eVzqHhthLoTsnUerlH8VvOeH1lynDDcCq5WF4r5iGLj\nYv6R6rUXyS87fJo3i8EbymrngUu04jzNsVwmBp/xoQKBgQDzbokyrsTm3WZsUHYY\nsXeVyHnvrOtfK9mnyscHsL+OUOiQkY6KVXF9XTuxkdRiE+deGcRFgudzAA696zKs\n8nmXEcjWOSBLjxJNTHpqoOQtbgECMfAaYXzmIFoMcxVT7BwKrtcl64SS9a24Qm9a\nZc3BaNVrt2l0lPD35ejZXywoBQKBgQDJNyZTQthZkgTX+LN9nvGtFTnBozWmB2qj\njuH5HmmlgYiszvHehpiQzbmdcG2sxi0zZpwgWAGrLecffsPj5aDMOYd+LAo/RqhU\nsc30Ek7Te5epfwrvYiX1Jn+5rNjgVyHJfAFm8YD4vHEVsWYNQ7j3qqul9QYJXMSH\nuv8oMCQjiQKBgQDKcXR7x8hMTndtQITWCFBxKiXt4ppjrW33ErXueVj0m+iswcAO\n3vvgy/Zmt+YuImtZYIhPXovooXWhD8Y2+feQYOPq89sduz/3NNDheCgKd98y2iDZ\nb5WVM/ZvQA3Omx6+66RVDsZUCSiNggJk5SD15Z8HU6LJp0u2fWblzzZDmQKBgQDI\nXKVKJXbgAjnWgSziOyJ2cntXqVhjomD6yu2TrkgO6WSah1trdWV4U5KwBmL/tzsN\nQvDWeCv5M7VAtG8FgQPUOLkF137AsXAvHfpyPsTFa/2CZyIRaw9XBOYMkuRGyBy5\n0ERpKLR/es20hziSnswRup4/nDRNoFWGvpsTfpSN2QKBgDbQ8ReFUHDTfppC55Yh\nk2dS3S+G1jEalW/RxEphBy+hSnGDpw4yxY5gw9q+7vqUSoWEnGb2pBU08qAjBHwT\nPXJcTk1/SpbcDm6WxVi9YXUL4XjJ9XLXBAu7VMyQvzQZcFEuWP+4PJNHk3xHU0sK\n8JqTVxQSvM9z/99/BySRxWv3\n-----END PRIVATE KEY-----\n";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
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
    console.log("Sample pre-survey data:", preSurveyData.slice(0, 2));
    preSurveyData.forEach((record, index) => {
      console.log(`Record ${index}: ${record.name}`, record.answers);
    });
    return res.status(200).json(preSurveyData);
  } catch (error: any) {
    console.error("Error fetching pre-survey data:", error);
    return res.status(500).json({ 
      error: "Failed to fetch pre-survey data", 
      details: error.message 
    });
  }
}
