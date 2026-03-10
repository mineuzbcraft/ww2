"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DailyChecklistItem } from "@/types/kun-reja"

interface DailyChecklistProps {
  items: DailyChecklistItem[]
  onAddItem: (text: string) => void
  onToggleItem: (id: string) => void
  onDeleteItem: (id: string) => void
}

export function DailyChecklist({ items, onAddItem, onToggleItem, onDeleteItem }: DailyChecklistProps) {
  const [newItemText, setNewItemText] = React.useState("")

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemText.trim()) {
      onAddItem(newItemText)
      setNewItemText("")
    }
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-4">
        <CardTitle className="text-lg font-headline">Kunlik Checkboxlar</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-3">
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <Input
            placeholder="Yangi ish..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="h-8 text-sm"
          />
          <Button size="sm" type="submit" className="h-8 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between group bg-white p-2 rounded-lg border border-transparent hover:border-border transition-all">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={() => onToggleItem(item.id)}
                />
                <label
                  htmlFor={item.id}
                  className={`text-sm font-medium leading-none cursor-pointer ${
                    item.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.text}
                </label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDeleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-center text-muted-foreground italic py-4">
              Ro'yxat bo'sh.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}