# External Cron Setup for Supabase Edge Functions

Since pg_cron requires a Supabase Pro plan, here are free alternatives to trigger your Edge Functions on a schedule:

## Option 1: Cron-job.org (Recommended - Free)

1. **Sign up at**: https://cron-job.org/en/signup/

2. **Create a cron job for notifications** (every 5 minutes):
   - Title: `75 Hard Send Notifications`
   - URL: `https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/send-notifications`
   - Schedule: Every 5 minutes
   - Request Method: POST
   - Request Headers:
     ```
     Authorization: Bearer YOUR_SUPABASE_ANON_KEY
     Content-Type: application/json
     ```

3. **Create a cron job for daily streaks**:
   - Title: `75 Hard Check Streaks`
   - URL: `https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/check-daily-streaks`
   - Schedule: Daily at 6:00 AM
   - Request Method: POST
   - Request Headers:
     ```
     Authorization: Bearer YOUR_SUPABASE_ANON_KEY
     Content-Type: application/json
     ```

## Option 2: Uptime Robot (Free - 5 minute intervals)

1. **Sign up at**: https://uptimerobot.com/

2. **Create HTTP(S) monitors**:
   - Monitor Type: HTTP(S)
   - URL: Your Edge Function URL
   - Monitoring Interval: 5 minutes
   - Request Type: POST
   - Custom HTTP Headers:
     ```
     Authorization: Bearer YOUR_SUPABASE_ANON_KEY
     Content-Type: application/json
     ```

## Option 3: GitHub Actions (Free)

Create `.github/workflows/cron-notifications.yml`:

```yaml
name: Trigger Notifications

on:
  schedule:
    # Runs every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Send Notifications
        run: |
          curl -X POST https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/send-notifications \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

Create `.github/workflows/cron-daily.yml`:

```yaml
name: Daily Checks

on:
  schedule:
    # Runs daily at 6 AM UTC
    - cron: '0 6 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  check-streaks:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Streak Check
        run: |
          curl -X POST https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/check-daily-streaks \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

Add your Supabase anon key to GitHub Secrets:
1. Go to your repo Settings → Secrets and variables → Actions
2. Add new secret: `SUPABASE_ANON_KEY`

## Option 4: Render.com Cron Jobs (Free)

1. Create a simple Node.js project with this script:

```javascript
// cron.js
const https = require('https');

const jobs = [
  {
    name: 'send-notifications',
    schedule: '*/5 * * * *',
    url: 'https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/send-notifications'
  },
  {
    name: 'check-daily-streaks',
    schedule: '0 6 * * *',
    url: 'https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/check-daily-streaks'
  }
];

// Function to trigger endpoint
function triggerEndpoint(url) {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  https.request(url, options, (res) => {
    console.log(`Triggered ${url}: ${res.statusCode}`);
  }).end();
}

// Export for Render
module.exports = { jobs, triggerEndpoint };
```

2. Deploy to Render.com as a Cron Job service

## Getting Your Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/xkqtpekoiqnwugyzfrit/settings/api
2. Copy the `anon` `public` key
3. Use this in the Authorization header: `Bearer YOUR_ANON_KEY`

## Testing Your Functions

You can test them manually with curl:

```bash
# Test send-notifications
curl -X POST https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test check-daily-streaks  
curl -X POST https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/check-daily-streaks \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Recommended Solution

For your use case, I recommend **Cron-job.org** because:
- Completely free
- Reliable (millions of users)
- Supports 5-minute intervals
- Simple setup
- Email notifications on failures

This gives you the full notification functionality without needing Supabase Pro!