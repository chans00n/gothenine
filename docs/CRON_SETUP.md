# Vercel Cron Jobs Setup

This guide explains how to set up cron jobs for automated push notifications in your 75 Hard Tracker app.

## Overview

The app uses Vercel Cron Jobs to automatically send push notifications based on user preferences. Two cron jobs are configured:

1. **Notifications Cron** - Runs every minute to check and send scheduled notifications
2. **Daily Check Cron** - Runs once daily at 6 AM UTC to check streaks and send milestone notifications

## Setup Steps

### 1. Add Environment Variables

Add the following to your Vercel project environment variables:

```bash
# Already added (from push notification setup)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com

# New - Cron job security
CRON_SECRET=your_generated_secret_key
```

Generate a secure CRON_SECRET with:
```bash
openssl rand -base64 32
```

### 2. Deploy to Vercel

The `vercel.json` file in the project root already contains the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "* * * * *"  // Every minute
    },
    {
      "path": "/api/cron/daily-check", 
      "schedule": "0 6 * * *"  // Daily at 6 AM UTC
    }
  ]
}
```

### 3. Verify Cron Jobs

After deployment:

1. Go to your Vercel dashboard
2. Navigate to your project
3. Click on the "Functions" tab
4. Click on "Cron Jobs"
5. You should see both cron jobs listed

### 4. Monitor Cron Jobs

- Vercel will show execution logs for each cron job
- Failed executions will be marked in red
- You can manually trigger cron jobs from the dashboard for testing

## How It Works

### Notifications Cron (Every Minute)

This cron job runs every minute and:
- Checks for users who should receive daily reminders at the current time
- Checks for workout reminders (both workout 1 and workout 2)
- Checks for reading reminders
- Checks for photo reminders
- Checks for water reminders (every 15 minutes to reduce load)

### Daily Check Cron (Once Daily)

This cron job runs once per day and:
- Checks all active challenges for streak milestones (7, 14, 21, 30, 40, 50, 60, 70, 75 days)
- Sends streak achievement notifications to users who hit milestones

## Testing

You can test the cron jobs locally by calling the endpoints directly:

```bash
# Test notifications cron
curl -H "Authorization: Bearer your_cron_secret" http://localhost:3000/api/cron/notifications

# Test daily check cron
curl -H "Authorization: Bearer your_cron_secret" http://localhost:3000/api/cron/daily-check
```

## Troubleshooting

### Notifications not sending?

1. Check that users have:
   - Enabled notifications in settings
   - Granted browser notification permissions
   - Valid push subscriptions in the database

2. Verify environment variables are set correctly in Vercel

3. Check Vercel Function logs for errors

### Cron jobs not running?

1. Ensure you're on a Vercel plan that supports cron jobs
2. Check that the cron syntax is correct in `vercel.json`
3. Verify the CRON_SECRET matches between your environment and code

## Schedule Reference

Cron syntax: `minute hour day month weekday`

- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 6 * * *` - Daily at 6 AM
- `0 9,17 * * *` - Daily at 9 AM and 5 PM

## Security

The cron endpoints are protected by:
- Authorization header check with CRON_SECRET
- Vercel automatically adds this header when calling cron endpoints
- Direct access without the correct header returns 401 Unauthorized