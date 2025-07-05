# Vercel Cron Jobs Setup

This guide explains how to set up cron jobs for automated push notifications in your 75 Hard Tracker app.

## Overview

The app uses Vercel Cron Jobs to automatically send push notifications. Due to Vercel Hobby plan limitations (1 cron job running once per day), we use a single daily cron job that:

1. **Daily Notification Cron** - Runs once daily at 12 PM UTC (noon) to:
   - Send daily reminders to users scheduled around that time
   - Check for streak milestones and send achievement notifications
   - Send a general daily reminder to all users with notifications enabled

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

The `vercel.json` file in the project root contains the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-check", 
      "schedule": "0 12 * * *"  // Daily at 12 PM UTC (noon)
    }
  ]
}
```

**Note**: On Vercel's Hobby plan, you're limited to 2 cron jobs that can run once per day each. We use just one to maximize functionality.

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

### Daily Notification Cron (Once Daily at Noon UTC)

This single cron job handles all notifications within Hobby plan limits:

1. **Targeted Daily Reminders**: Sends reminders to users who have their daily reminder time set between 11 AM - 1 PM
2. **Streak Milestones**: Checks all active challenges and sends notifications for milestone days (7, 14, 21, 30, 40, 50, 60, 70, 75)
3. **General Daily Reminder**: Ensures all users with notifications enabled get at least one daily reminder

### Limitations on Hobby Plan

- Only runs once per day at noon UTC
- Users with reminder times outside 11 AM - 1 PM will receive a general daily reminder instead
- Water, workout, reading, and photo reminders at specific times are not supported on Hobby plan
- For full notification functionality, consider upgrading to Vercel Pro which allows unlimited cron executions

## Testing

You can test the cron job locally by calling the endpoint directly:

```bash
# Test daily notification cron
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