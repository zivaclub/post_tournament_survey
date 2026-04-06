import { google } from "googleapis";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const GOOGLE_SHEET_ID = "19AgjIJXOvWv9BBbj-9nESD3z9cTE6675Yjt4qPMhYb8"
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = "sheets-editor-bot@ziva-491808.iam.gserviceaccount.com"
    const GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/Vjrp2eBgwG5B\n8zgSij26ayhkfOuspTPtSUwf50x0r7S881N69HEcLSuBcWMXD2jLCRFS2davlJO1\n7+aG23IMW7Q3Le5KiMCwYyIHzyIowDqDpACIjEcHV00a+S1Qip/8AS6tRwHtPzeG\n/72RcLXXaqUnmrb6ew5LSmBaqGWfkPKib/qcx9E5x+7A/8bDb2d/p+y4oNng1jJT\nXXeX+2EKvS/zbO0mMuJbSwc1ifmQU2doyeshJtsSessP6WNz0hgydSM3LreN/XCp\nl/uOBwmG7rVJ8x4EdZJZgJTnPjmSD9az4WOxY9GcXbp8k5I6uGIB21w2UHhlniqu\nOdWIzhmtAgMBAAECggEAJIUz94DDqBPyt5nR4RAL2jIr4opJfYmG0MrFwe0nFbqX\n19zl2TkhAczJWgqnbDZfvSk86kB0Ds1gKEDjEmh+a0dxrXqR2h4iEUjKrQznKzoN\nsSSziVylDgymxfg7ovzirnoXS7Ga94qycY0MxN7rhnNvlJCeTk8AmnRW0dcElqEC\nH/0oB6e3PTjUvMzgMIRCp7rzP+3uTTblDFJavdgIE4/DfDGyymjin1stLnSSozh5\nIcRKUO7lyARrS9p+QoSc/eVzqHhthLoTsnUerlH8VvOeH1lynDDcCq5WF4r5iGLj\nYv6R6rUXyS87fJo3i8EbymrngUu04jzNsVwmBp/xoQKBgQDzbokyrsTm3WZsUHYY\nsXeVyHnvrOtfK9mnyscHsL+OUOiQkY6KVXF9XTuxkdRiE+deGcRFgudzAA696zKs\n8nmXEcjWOSBLjxJNTHpqoOQtbgECMfAaYXzmIFoMcxVT7BwKrtcl64SS9a24Qm9a\nZc3BaNVrt2l0lPD35ejZXywoBQKBgQDJNyZTQthZkgTX+LN9nvGtFTnBozWmB2qj\njuH5HmmlgYiszvHehpiQzbmdcG2sxi0zZpwgWAGrLecffsPj5aDMOYd+LAo/RqhU\nsc30Ek7Te5epfwrvYiX1Jn+5rNjgVyHJfAFm8YD4vHEVsWYNQ7j3qqul9QYJXMSH\nuv8oMCQjiQKBgQDKcXR7x8hMTndtQITWCFBxKiXt4ppjrW33ErXueVj0m+iswcAO\n3vvgy/Zmt+YuImtZYIhPXovooXWhD8Y2+feQYOPq89sduz/3NNDheCgKd98y2iDZ\nb5WVM/ZvQA3Omx6+66RVDsZUCSiNggJk5SD15Z8HU6LJp0u2fWblzzZDmQKBgQDI\nXKVKJXbgAjnWgSziOyJ2cntXqVhjomD6yu2TrkgO6WSah1trdWV4U5KwBmL/tzsN\nQvDWeCv5M7VAtG8FgQPUOLkF137AsXAvHfpyPsTFa/2CZyIRaw9XBOYMkuRGyBy5\n0ERpKLR/es20hziSnswRup4/nDRNoFWGvpsTfpSN2QKBgDbQ8ReFUHDTfppC55Yh\nk2dS3S+G1jEalW/RxEphBy+hSnGDpw4yxY5gw9q+7vqUSoWEnGb2pBU08qAjBHwT\nPXJcTk1/SpbcDm6WxVi9YXUL4XjJ9XLXBAu7VMyQvzQZcFEuWP+4PJNHk3xHU0sK\n8JqTVxQSvM9z/99/BySRxWv3\n-----END PRIVATE KEY-----\n"

    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { username, answers, timestamp } = payload || {};

    if (!username || !answers || !timestamp) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const row = [timestamp, username];

    for (let i = 1; i <= 14; i++) {
      row.push(answers[i] || "");
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "Sheet1!A:P",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Submit API error:", {
      message: error?.message,
      code: error?.code,
      errors: error?.errors,
    });
    return res.status(500).json({
      error: "Failed to submit to Google Sheets",
      details: error?.message || "Unknown error",
    });
  }
}
