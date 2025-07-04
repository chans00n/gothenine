#!/usr/bin/env tsx
/**
 * Script to fix task counts in daily_progress records
 * This fixes the "8 of 6 tasks" issue by ensuring only the 6 valid tasks are counted
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Valid task IDs for 75 Hard
const VALID_TASK_IDS = [
  'water-intake',
  'workout-indoor', 
  'workout-outdoor',
  'progress-photo',
  'read-nonfiction',
  'follow-diet'
]

async function fixTaskCounts() {
  console.log('Fetching all daily progress records...')
  
  const { data: progressRecords, error } = await supabase
    .from('daily_progress')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching progress records:', error)
    return
  }

  console.log(`Found ${progressRecords.length} progress records`)

  let fixedCount = 0
  
  for (const record of progressRecords) {
    const tasks = record.tasks || {}
    
    // Filter out invalid task IDs
    const validTasks: Record<string, any> = {}
    let actualCompletedCount = 0
    
    for (const taskId of VALID_TASK_IDS) {
      if (tasks[taskId]) {
        validTasks[taskId] = tasks[taskId]
        if (tasks[taskId].completed) {
          actualCompletedCount++
        }
      }
    }
    
    // Check if we need to update this record
    const needsUpdate = 
      Object.keys(tasks).length !== Object.keys(validTasks).length ||
      record.tasks_completed !== actualCompletedCount ||
      record.is_complete !== (actualCompletedCount === 6)
    
    if (needsUpdate) {
      console.log(`Fixing record for ${record.date}:`)
      console.log(`  - Old task count: ${Object.keys(tasks).length}, New: ${Object.keys(validTasks).length}`)
      console.log(`  - Old completed: ${record.tasks_completed}, New: ${actualCompletedCount}`)
      console.log(`  - Invalid tasks removed: ${Object.keys(tasks).filter(id => !VALID_TASK_IDS.includes(id))}`)
      
      const { error: updateError } = await supabase
        .from('daily_progress')
        .update({
          tasks: validTasks,
          tasks_completed: actualCompletedCount,
          is_complete: actualCompletedCount === 6
        })
        .eq('id', record.id)
      
      if (updateError) {
        console.error(`  - Error updating record: ${updateError.message}`)
      } else {
        console.log(`  - ✓ Fixed successfully`)
        fixedCount++
      }
    }
  }
  
  console.log(`\nFixed ${fixedCount} records`)
  console.log('Task count cleanup complete!')
}

// Run the fix
fixTaskCounts().catch(console.error)