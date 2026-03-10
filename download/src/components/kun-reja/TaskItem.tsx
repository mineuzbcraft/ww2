"use client"

import * as React from "react"
import { CheckCircle2, Circle, Clock, Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Task, Priority } from "@/types/kun-reja"

interface TaskItemProps {
  task: Task
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

const priorityConfig: Record<Priority, { label: string, color: string }> = {
  low: { label: "Past", color: "bg-green-100 text-green-700 border-green-200" },
  medium: { label: "O'rta", color: "bg-blue-100 text-blue-700 border-blue-200" },
  high: { label: "Muhim", color: "bg-red-100 text-red-700 border-red-200" },
}

export function TaskItem({ task, onToggleStatus, onDelete, onEdit }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <Card className={cn(
      "group transition-all duration-300 hover:shadow-md border-l-4",
      task.status === 'done' ? "opacity-60 grayscale border-l-muted" : 
      task.priority === 'high' ? "border-l-destructive" :
      task.priority === 'medium' ? "border-l-accent" : "border-l-green-500"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full p-0"
            onClick={() => onToggleStatus(task.id)}
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
          </Button>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className={cn(
                "font-semibold text-lg leading-tight",
                task.status === 'done' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className={cn("px-2 py-0", priorityConfig[task.priority].color)}>
                {priorityConfig[task.priority].label}
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.date}
              </span>
              {(task.subTasks.length > 0 || task.reminders.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 p-0 text-xs text-accent"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "Yashirish" : "Batafsil"}
                  {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              )}
            </div>

            {isExpanded && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {task.description && (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md italic">
                    {task.description}
                  </p>
                )}
                
                {task.subTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      Kichik vazifalar
                    </h4>
                    <ul className="space-y-1">
                      {task.subTasks.map((st, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {st}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {task.reminders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      Eslatmalar
                    </h4>
                    <ul className="space-y-1">
                      {task.reminders.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-blue-600 bg-blue-50 p-2 rounded">
                          <AlertCircle className="h-3 w-3 mt-1 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}