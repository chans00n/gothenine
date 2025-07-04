import { inAppNotificationService } from '@/lib/services/in-app-notification-service'

export async function createTaskCompletionNotification(taskName: string) {
  try {
    await inAppNotificationService.createNotification({
      title: 'Task Completed! 🎉',
      description: `Great job completing your ${taskName}. Keep up the momentum!`,
      type: 'progress'
    })
  } catch (error) {
    console.error('Error creating task completion notification:', error)
  }
}

export async function createStreakNotification(streakDays: number) {
  try {
    let title = ''
    let description = ''

    if (streakDays === 7) {
      title = 'One Week Strong! 🔥'
      description = 'You\'ve completed 7 days in a row. You\'re building great habits!'
    } else if (streakDays === 30) {
      title = 'One Month Milestone! 🏆'
      description = '30 days of consistency! You\'re unstoppable!'
    } else if (streakDays === 50) {
      title = '50 Days and Counting! 💪'
      description = 'You\'re over halfway to completing 75 Hard!'
    } else if (streakDays === 75) {
      title = '75 HARD COMPLETE! 🎊'
      description = 'Congratulations! You\'ve completed the 75 Hard challenge!'
    } else if (streakDays % 10 === 0) {
      title = `${streakDays} Day Streak! 🌟`
      description = `Amazing dedication! You\'ve maintained your streak for ${streakDays} days.`
    } else {
      return // Don't create notification for other days
    }

    await inAppNotificationService.createNotification({
      title,
      description,
      type: 'achievement'
    })
  } catch (error) {
    console.error('Error creating streak notification:', error)
  }
}

export async function createWelcomeNotification() {
  try {
    await inAppNotificationService.createNotification({
      title: 'Welcome to 75 Hard! 👋',
      description: 'Your journey to mental toughness starts now. Check your daily tasks to begin!',
      type: 'system'
    })
  } catch (error) {
    console.error('Error creating welcome notification:', error)
  }
}

export async function createDailyReminderNotification(incompleteTasks: string[]) {
  try {
    const taskCount = incompleteTasks.length
    await inAppNotificationService.createNotification({
      title: `${taskCount} Task${taskCount > 1 ? 's' : ''} Remaining Today`,
      description: `Don't forget to complete: ${incompleteTasks.join(', ')}`,
      type: 'reminder'
    })
  } catch (error) {
    console.error('Error creating daily reminder notification:', error)
  }
}