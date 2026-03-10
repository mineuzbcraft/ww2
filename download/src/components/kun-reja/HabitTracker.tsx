"use client"

import * as React from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import { uz } from "date-fns/locale"
import { Habit } from "@/types/kun-reja"
import { cn } from "@/lib/utils"

interface HabitTrackerProps {
  habits: Habit[]
  onAddHabit: (name: string) => void
  onToggleHabit: (id: string, date: string) => void
  onDeleteHabit: (id: string) => void
}

export function HabitTracker({ habits, onAddHabit, onToggleHabit, onDeleteHabit }: HabitTrackerProps) {
  const [newHabitName, setNewHabitName] = React.useState("")
  
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (newHabitName.trim()) {
      onAddHabit(newHabitName)
      setNewHabitName("")
    }
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-headline flex items-center justify-between">
          Odatlar
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Yangi odat..."
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="h-8 text-sm"
          />
          <Button size="sm" type="submit" className="h-8 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-4">
          <div className="flex items-center gap-1 justify-end pr-2">
            {weekDays.map((day, i) => (
              <div key={i} className="w-8 text-[10px] text-center font-bold text-muted-foreground uppercase">
                {format(day, 'EE', { locale: uz })}
              </div>
            ))}
          </div>

          {habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-2">
              <div className="flex-1 flex items-center justify-between group">
                <span className="text-sm font-medium truncate max-w-[100px]">{habit.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDeleteHabit(habit.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                {weekDays.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const isCompleted = habit.completedDates.includes(dateStr)
                  const isToday = isSameDay(day, today)
                  
                  return (
                    <button
                      key={i}
                      onClick={() => onToggleHabit(habit.id, dateStr)}
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center transition-all",
                        isCompleted 
                          ? "bg-accent text-white shadow-sm" 
                          : "bg-secondary hover:bg-secondary/80",
                        isToday && !isCompleted && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      {isCompleted && <Check className="h-4 w-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {habits.length === 0 && (
            <p className="text-xs text-center text-muted-foreground italic py-4">
              Hali odatlar qo'shilmagan.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}