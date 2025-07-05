# Supabase Edge Functions Setup for Notifications

This guide explains how to set up Supabase Edge Functions for automated push notifications in your 75 Hard Tracker app.

## Overview

Using Supabase Edge Functions provides several advantages over Vercel cron jobs:
- **More flexible scheduling**: Can run functions every minute, hour, or custom intervals
- **No plan limitations**: Available on Supabase free tier
- **Direct database access**: Functions run close to your database
- **Better integration**: Native Supabase support for cron jobs

## Prerequisites

1. Install Supabase CLI:
```bash
brew install supabase/tap/supabase
```

2. Login to Supabase:
```bash
supabase login
```

## Setup Steps

### 1. Link Your Project

```bash
cd /path/to/75hard-tracker
supabase link --project-ref your-project-ref
```

You can find your project ref in the Supabase dashboard URL: `https://app.supabase.com/project/[your-project-ref]`

### 2. Set Function Secrets

Set the VAPID keys for push notifications:

```bash
# Set secrets for the functions
supabase secrets set VAPID_PUBLIC_KEY=BMFXv_KgGgDNaeH85EeHiHY18WVKIKwbADaK3uMMEF7mlkWGAVjVn75DcadAr_ZyWiAH7HpU5aQEV-vYZzTtd-4
supabase secrets set VAPID_PRIVATE_KEY=NO5BggcFbn65EUmtVi9vor3S1Ezeao2tYXk_L1ndA8A
supabase secrets set VAPID_SUBJECT=mailto:chanson@stblcreative.com
```

### 3. Deploy the Functions

Deploy both Edge Functions:

```bash
# Deploy notification sender (runs every 5 minutes)
supabase functions deploy send-notifications

# Deploy daily streak checker (runs once per day)
supabase functions deploy check-daily-streaks
```

### 4. Set Up Cron Schedules

In your Supabase Dashboard:

1. Go to **Edge Functions** section
2. Click on `send-notifications` function
3. Click **Add Schedule**
4. Set schedule to: `*/5 * * * *` (every 5 minutes)
5. Save

Repeat for `check-daily-streaks`:
1. Click on `check-daily-streaks` function
2. Click **Add Schedule**
3. Set schedule to: `0 6 * * *` (daily at 6 AM UTC)
4. Save

### 5. Test the Functions

You can test the functions locally:

```bash
# Test notification sender
supabase functions serve send-notifications --no-verify-jwt

# In another terminal, call the function
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-notifications' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## How It Works

### Send Notifications Function (Every 5 Minutes)

This function:
- Checks all users' notification preferences
- Sends notifications to users whose scheduled times match (within 5-minute window)
- Handles all notification types:
  - Daily reminders
  - Workout reminders (2 per day)
  - Water reminders (every 2 hours between 7 AM - 9 PM)
  - Reading reminders
  - Photo reminders

### Check Daily Streaks Function (Once Daily)

This function:
- Runs once per day at 6 AM UTC
- Checks all active challenges for streak milestones
- Sends achievement notifications for days: 7, 14, 21, 30, 40, 50, 60, 70, 75
- Creates in-app achievement notifications for major milestones

## Monitoring

You can monitor function executions in the Supabase Dashboard:

1. Go to **Edge Functions**
2. Click on a function name
3. View **Logs** tab for execution history
4. Check **Metrics** for performance data

## Troubleshooting

### Functions not running?

1. Check function logs in Supabase Dashboard
2. Verify secrets are set correctly:
   ```bash
   supabase secrets list
   ```
3. Ensure cron schedules are active in dashboard

### Notifications not sending?

1. Verify users have:
   - Push subscriptions in `push_subscriptions` table
   - Notifications enabled in `notification_preferences`
   - Valid browser permissions

2. Check function logs for errors
3. Test push subscription validity manually

### Local Development

To run functions locally:

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve send-notifications --env-file .env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-notifications' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

## Advantages Over Vercel Cron

1. **Frequency**: Can run every 5 minutes vs once per day
2. **Cost**: Free on Supabase free tier
3. **Reliability**: Runs closer to your database
4. **Flexibility**: Easy to add new notification types
5. **Monitoring**: Built-in logs and metrics

## Next Steps

After setup:
1. Remove Vercel cron configuration from `vercel.json`
2. Update user documentation about notification timing
3. Monitor function performance in Supabase Dashboard