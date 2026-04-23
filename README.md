# Ziva Club Survey App (Pre + Post Tournament)

This app now supports:

- `/post-survey` (default): post-tournament survey with 18 questions
- `/pre-survey`: compatibility route that keeps the first 7 baseline mental questions
- `/admin`: lightweight analytics panel for local dashboard metrics

## Local Run

1. Install dependencies  
   `npm install`
2. Run development server  
   `npm run dev`
3. Open:
   - `http://localhost:3000/post-survey`
   - `http://localhost:3000/pre-survey`
   - `http://localhost:3000/admin`

## JSON Import Method

At survey start screen:

1. **Player List JSON** upload for searchable/valid names only.
   Example:
   ```json
   [
     { "name": "Rahul Sharma" },
     { "name": "Amit Patel" },
     { "name": "Priya Shah" }
   ]
   ```
2. **Pre Survey Responses JSON** upload for report comparison.
   Example:
   ```json
   [
     {
       "name": "Rahul Sharma",
       "answers": { "q1": 3, "q2": 2, "q3": 3, "q4": 4, "q5": 3, "q6": 3, "q7": 4 }
     }
   ]
   ```
   Ready-to-use sample files are available in `src/sample-data/`.

## What Gets Stored

Each post submission stores:

- `player_name`
- `timestamp`
- `answers`
- `computed_report`
- `compared_with_pre`
- `pre_match_found`

Also persisted in browser local storage for admin analytics summary.

## Report Calculation Logic

After submission, a personalized report is generated:

- **Confidence Score** from Q8, Q9, Q10
- **Energy Score** from Q11, Q12
- **Social Confidence** from Q13, Q14
- **Mental Wellness Change** compares pre-vs-post averages of Q1-Q7 (if pre data exists)
- **Strengths** and **Suggested Next Steps** are generated from score thresholds and participation intent

## Notes

- Backend append now stores JSON payload columns in Google Sheet (`A:G`) for post-survey records.
- Keep your Google service account credentials configured in server environment before production use.
