"use client"

import * as React from "react"
import { Sparkles, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { suggestSmartTasks } from "@/ai/flows/smart-task-assistant"
import { useToast } from "@/hooks/use-toast"

interface SmartAssistantProps {
  taskDescription: string
  onSuggestionsReceived: (subTasks: string[], reminders: string[]) => void
}

export function SmartAssistant({ taskDescription, onSuggestionsReceived }: SmartAssistantProps) {
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  const handleGetSuggestions = async () => {
    if (!taskDescription.trim()) {
      toast({
        title: "Xatolik",
        description: "Iltimos, avval vazifa tavsifini kiriting.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await suggestSmartTasks({ taskDescription })
      onSuggestionsReceived(result.subTasks, result.reminders)
      toast({
        title: "Muvaffaqiyatli",
        description: "AI yordamida yangi takliflar olindi!",
      })
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Takliflarni olishda xatolik yuz berdi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      className="gap-2 border-accent text-accent hover:bg-accent/10"
      onClick={handleGetSuggestions}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Aqlli takliflar
    </Button>
  )
}