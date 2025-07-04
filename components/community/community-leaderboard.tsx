"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  User, 
  CheckCircle2, 
  ArrowUpDown,
  Trophy,
  Target,
  Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommunityUser {
  id: string
  displayName: string
  avatarUrl?: string
  currentDay: number
  challengeName: string
  tasksCompleted: number
  totalTasks: number
  startedAt?: string
  isCurrentUser: boolean
}

interface CommunityLeaderboardProps {
  users: CommunityUser[]
  currentUserId: string
}

type SortOption = 'day' | 'tasks' | 'name' | 'started'
type FilterOption = 'all' | 'completed' | 'in-progress'

export function CommunityLeaderboard({ users }: CommunityLeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('day')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (filterBy === 'completed') {
      filtered = filtered.filter(user => user.tasksCompleted === user.totalTasks)
    } else if (filterBy === 'in-progress') {
      filtered = filtered.filter(user => user.tasksCompleted < user.totalTasks)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'day':
          return b.currentDay - a.currentDay
        case 'tasks':
          return b.tasksCompleted - a.tasksCompleted
        case 'name':
          return a.displayName.localeCompare(b.displayName)
        case 'started':
          return (a.startedAt || '').localeCompare(b.startedAt || '')
        default:
          return 0
      }
    })

    return sorted
  }, [users, searchQuery, sortBy, filterBy])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getDayColor = (day: number) => {
    if (day >= 75) return 'text-green-600'
    if (day >= 50) return 'text-blue-600'
    if (day >= 25) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getMilestoneIcon = (day: number) => {
    if (day >= 75) return <Trophy className="h-4 w-4" />
    if (day >= 50) return <Flame className="h-4 w-4" />
    if (day >= 25) return <Target className="h-4 w-4" />
    return null
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Community Members</CardTitle>
          <CardDescription>
            Find and connect with others on their Go the Nine journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="search-members" className="sr-only">Search members</label>
              <Input
                id="search-members"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search members by name"
              />
            </div>

            {/* Filter */}
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="completed">Completed Today</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Current Day</SelectItem>
                <SelectItem value="tasks">Tasks Completed</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="started">Start Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-sm font-medium text-muted-foreground">Member</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-muted-foreground hidden sm:table-cell">Day</th>
                  <th className="px-3 sm:px-4 py-3 text-right text-sm font-medium text-muted-foreground">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAndSortedUsers.map((user) => {
                  const isCompleted = user.tasksCompleted === user.totalTasks

                  return (
                    <tr 
                      key={user.id}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        user.isCurrentUser && "bg-primary/5"
                      )}
                    >
                      {/* Member Info */}
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                              {user.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                              ) : (
                                <AvatarFallback className="text-xs sm:text-sm">
                                  {getInitials(user.displayName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            {user.isCurrentUser && (
                              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-primary border-2 border-background" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <p className="font-medium text-sm truncate">{user.displayName}</p>
                              {user.isCurrentUser && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">You</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              Day {user.currentDay}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Current Day */}
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          <span className={cn("font-bold text-base sm:text-lg", getDayColor(user.currentDay))}>
                            {user.currentDay}
                          </span>
                          {getMilestoneIcon(user.currentDay)}
                        </div>
                      </td>

                      {/* Today's Progress */}
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          <span className="text-sm font-medium whitespace-nowrap">
                            {user.tasksCompleted}/{user.totalTasks}
                          </span>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {Array.from({ length: user.totalTasks }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full",
                                  i < user.tasksCompleted
                                    ? isCompleted ? "bg-green-500" : "bg-yellow-500"
                                    : "bg-gray-300"
                                )}
                              />
                            ))}
                          </div>
                          {isCompleted && (
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedUsers.length === 0 && (
            <div className="py-12 text-center">
              <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm">No members found</p>
              <p className="text-muted-foreground text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Showing {filteredAndSortedUsers.length} of {users.length} members
            </p>
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Complete</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-gray-300" />
                <span className="text-muted-foreground">Not Started</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}