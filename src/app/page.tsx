
"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  Settings, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Zap,
  Target,
  ShieldCheck,
  UserCheck,
  BarChart3,
  Clock,
  XCircle,
  Activity,
  TrendingUp,
  Loader2,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfToday, subDays, eachDayOfInterval, getDate, isBefore, startOfDay } from "date-fns"
import { uz } from "date-fns/locale"
import { Habit, PrayerStatus } from "@/types/kun-reja"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts"

// Firebase hooks
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

const MOTIVATIONS = [
  { en: "Without Allah, I am nothing.", uz: "Allohning yordamisiz men hech kimman." },
  { en: "Champions don't make excuses, they make history.", uz: "Chempionlar bahona izlamaydilar, ular tarix yaratadilar." },
  { en: "Discipline is doing what needs to be done, even if you don't want to.", uz: "Intizom - bu xohlamasang ham, kerakli ishni qilishdir." },
  { en: "Cristiano Ronaldo works harder than everyone. That's why he is the best.", uz: "Ronaldo hamma kishidan ko'p mehnat qiladi. Shuning uchun u eng zo'ri." },
  { en: "Prayer is your oxygen. Don't stop breathing.", uz: "Namoz - bu sening kisloroding. Nafas olishdan to'xtama." },
]

const DEFAULT_HABITS = [
  { name: "Bomdod namozi", category: "namoz" },
  { name: "Peshin namozi", category: "namoz" },
  { name: "Asr namozi", category: "namoz" },
  { name: "Shom namozi", category: "namoz" },
  { name: "Xufton namozi", category: "namoz" },
  { name: "50 ta push-up (Otjimaniya)", category: "sport" },
  { name: "Turnik (10 ta)", category: "sport" },
  { name: "Futbol mashg'uloti", category: "sport" },
  { name: "Qur'on o'qish (1 pora)", category: "learning" },
  { name: "Kitob o'qish (30 bet)", category: "learning" },
]

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function KunRejaApp() {
  const db = useFirestore()
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [isManageOpen, setIsManageOpen] = React.useState(false)
  const [newHabitName, setNewHabitName] = React.useState("")
  const [newHabitCategory, setNewHabitCategory] = React.useState<Habit['category']>('other')
  const { toast } = useToast()

  const userId = "abubakr_fixed_id"

  const habitsQuery = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, 'users', userId, 'habits')
  }, [db, userId])
  
  const { data: habitsRaw, isLoading: isHabitsLoading } = useCollection<Habit>(habitsQuery)
  const habits = habitsRaw || []

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const toggleHabit = (id: string, date: string) => {
    if (!db) return
    const habit = habits.find(h => h.id === id)
    if (!habit) return

    const habitRef = doc(db, 'users', userId, 'habits', id)
    
    if (habit.category === 'namoz') {
      const currentHistory = habit.prayerHistory || {}
      const currentStatus = (currentHistory[date] || 'todo') as PrayerStatus
      let nextStatus: PrayerStatus = 'todo'
      
      if (currentStatus === 'todo') nextStatus = 'ontime'
      else if (currentStatus === 'ontime') nextStatus = 'late'
      else if (currentStatus === 'late') nextStatus = 'missed'
      else nextStatus = 'todo'
      
      updateDocumentNonBlocking(habitRef, {
        prayerHistory: { ...currentHistory, [date]: nextStatus }
      })
    } else {
      const currentDates = habit.completedDates || []
      const isCompleted = currentDates.includes(date)
      const newDates = isCompleted 
        ? currentDates.filter(d => d !== date)
        : [...currentDates, date]
      
      updateDocumentNonBlocking(habitRef, { completedDates: newDates })
    }
  }

  const addHabit = (name: string, category: Habit['category']) => {
    if (!name.trim() || !db) return
    const id = generateId()
    
    // MUHIM: Firebase undefined qiymatni qabul qilmaydi! 
    // Faqat kerakli maydonlarni aniq qiymatlar bilan yuboramiz.
    const newHabitData: any = {
      id: id,
      name: name.trim(),
      category: category,
      completedDates: [],
    }

    if (category === 'namoz') {
      newHabitData.prayerHistory = {}
    }

    const habitRef = doc(db, 'users', userId, 'habits', id)
    setDocumentNonBlocking(habitRef, newHabitData, { merge: true })
  }

  const seedDefaultHabits = () => {
    if (!db) return
    DEFAULT_HABITS.forEach(h => {
      const exists = habits.some(existing => existing.name.toLowerCase() === h.name.toLowerCase())
      if (!exists) {
        addHabit(h.name, h.category as any)
      }
    })
    toast({ title: "Muvaffaqiyat", description: "Barcha standart vazifalar yuklandi!" })
  }

  const handleManualAdd = () => {
    if (!newHabitName.trim()) {
      toast({ title: "Xatolik", description: "Vazifa nomini kiriting!", variant: "destructive" })
      return
    }
    addHabit(newHabitName, newHabitCategory)
    setNewHabitName("")
    setIsManageOpen(false)
    toast({ title: "Muvaffaqiyat", description: "Yangi vazifa saqlandi!" })
  }

  const deleteHabit = (id: string) => {
    if (!db) return
    const habitRef = doc(db, 'users', userId, 'habits', id)
    deleteDocumentNonBlocking(habitRef)
  }

  const getStatsForDate = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd')
    const isDPast = isBefore(startOfDay(date), startOfDay(new Date()))
    const total = habits.length
    if (total === 0) return { percent: 0, done: 0, missed: 0, total: 0 }
    
    let doneCount = 0
    let missedCount = 0

    habits.forEach(h => {
      const rawStatus = h.category === 'namoz' 
        ? (h.prayerHistory?.[dStr] || 'todo') 
        : ((h.completedDates || []).includes(dStr) ? 'done' : 'todo')
      
      const status = (isDPast && rawStatus === 'todo') ? 'missed' : rawStatus
      
      if (status === 'ontime' || status === 'done') doneCount += 1
      else if (status === 'late') doneCount += 0.5
      else if (status === 'missed') missedCount += 1
    })

    return {
      percent: Math.round((doneCount / (total || 1)) * 100),
      done: Math.floor(doneCount),
      missed: Math.ceil(missedCount),
      total
    }
  }

  const selectedDayStats = React.useMemo(() => getStatsForDate(selectedDate), [habits, selectedDate])

  const historyData = React.useMemo(() => {
    const today = startOfToday()
    const days = eachDayOfInterval({ start: subDays(today, 6), end: today })
    return days.map(date => {
      const stats = getStatsForDate(date)
      return {
        name: getDate(date).toString(),
        fullDate: format(date, 'd-MMMM', { locale: uz }),
        done: stats.done,
        missed: stats.missed,
        percent: stats.percent
      }
    })
  }, [habits])

  if (isHabitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Akademiya yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()))

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 pb-20">
      
      {/* Header Section */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-[#020617] via-[#1e1b4b] to-[#020617] text-white overflow-hidden rounded-[3rem]">
        <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-indigo-500/20 p-6 rounded-[2.5rem] border border-white/10">
            <UserCheck className="h-16 w-16 text-indigo-400" />
          </div>
          <div className="space-y-4 text-center md:text-left flex-1">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300">
              ABUBAKR ACADEMY: <br/> CHAMPION CONTROL
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <div className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-black border border-white/10 flex items-center gap-2 shadow-xl">
                 <Zap className="h-4 w-4 fill-current animate-pulse" /> PERFORMANCE: {selectedDayStats.percent}%
               </div>
               <div className="bg-white/10 px-6 py-2 rounded-xl text-sm font-black border border-white/10 flex items-center gap-2 backdrop-blur-xl">
                 <ShieldCheck className="h-4 w-4 text-green-400" /> DISCIPLINE: {selectedDayStats.done}/{habits.length}
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-xl border-b-4 border-slate-100 gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                  {format(selectedDate, 'd-MMMM', { locale: uz })} HISOBOTI
                 </h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Activity Log</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="bg-green-600 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase shadow-lg flex items-center gap-2">
                 <CheckCircle2 className="h-3 w-3" /> {selectedDayStats.done} DONE
               </div>
               <div className="bg-red-500 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase shadow-lg flex items-center gap-2">
                 <XCircle className="h-3 w-3" /> {selectedDayStats.missed} MISSED
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {habits.map((h) => {
              const isNamoz = h.category === 'namoz'
              const rawStatus = isNamoz 
                ? (h.prayerHistory?.[dateStr] || 'todo') 
                : ((h.completedDates || []).includes(dateStr) ? 'done' : 'todo')
              const status = (isPastDate && rawStatus === 'todo') ? 'missed' : rawStatus

              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id, dateStr)}
                  className={cn(
                    "flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all text-left shadow-lg hover:scale-[1.02] active:scale-95",
                    status === 'ontime' || status === 'done' ? "bg-green-50 border-green-100" : 
                    status === 'late' ? "bg-yellow-50 border-yellow-100" :
                    status === 'missed' ? "bg-red-50 border-red-100" : "bg-white border-slate-50"
                  )}
                >
                  <div className="space-y-1">
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-white",
                      h.category === 'namoz' ? "bg-indigo-600" :
                      h.category === 'sport' ? "bg-orange-500" : "bg-slate-600"
                    )}>
                      {h.category}
                    </span>
                    <h3 className="text-lg font-black text-slate-800">{h.name}</h3>
                  </div>
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center border-2",
                    status === 'ontime' || status === 'done' ? "bg-green-500 border-green-600 text-white" :
                    status === 'late' ? "bg-yellow-500 border-yellow-600 text-white" :
                    status === 'missed' ? "bg-red-500 border-red-600 text-white" : "bg-slate-50 border-slate-100"
                  )}>
                    {status === 'ontime' || status === 'done' ? <ShieldCheck className="h-5 w-5" /> :
                     status === 'late' ? <Clock className="h-5 w-5" /> :
                     status === 'missed' ? <XCircle className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-slate-200" />}
                  </div>
                </button>
              )
            })}
          </div>

          <Card className="rounded-[3rem] border-none shadow-xl bg-white p-8">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-xl font-black flex items-center gap-4 uppercase tracking-tighter text-slate-900">
                <BarChart3 className="h-6 w-6 text-primary" /> PERFORMANCE LOG
              </CardTitle>
            </CardHeader>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900'}} />
                  <YAxis hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl text-white text-[10px]">
                            <p className="font-black uppercase mb-1 border-b border-white/10 pb-1">{data.fullDate}</p>
                            <p className="font-bold text-green-400">DONE: {data.done}</p>
                            <p className="font-bold text-red-400">MISSED: {data.missed}</p>
                            <p className="font-bold">PERCENT: {data.percent}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="done" fill="#4f46e5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className={cn(
            "rounded-[3rem] border-none shadow-xl overflow-hidden",
            selectedDayStats.percent === 100 ? "bg-indigo-600 text-white" : "bg-white text-slate-900"
          )}>
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[10px] flex items-center gap-2 font-black uppercase tracking-widest opacity-60">
                <Target className="h-4 w-4" /> DAILY SUMMARY
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="flex items-end justify-between">
                <div className="text-6xl font-black tracking-tighter leading-none">{selectedDayStats.percent}%</div>
                <div className="text-[10px] font-black opacity-60 uppercase">
                  {selectedDayStats.done}/{habits.length} DONE
                </div>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${selectedDayStats.percent}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-xl bg-white p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="w-full"
              locale={uz}
              showOutsideDays={false}
              classNames={{
                day_selected: "bg-indigo-600 text-white font-black rounded-xl shadow-lg",
                day_today: "border-2 border-indigo-100 text-indigo-600 font-black rounded-xl",
                day: "h-10 w-10 font-bold text-slate-700 hover:bg-indigo-50 rounded-xl text-[11px]",
                caption_label: "font-black text-sm uppercase text-slate-900"
              }}
            />
          </Card>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Motivation Quotes</p>
            {MOTIVATIONS.map((m, i) => (
              <Card key={i} className="bg-white border-none shadow-md rounded-[1.5rem] border-l-4 border-indigo-50 hover:border-indigo-600 transition-all">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="bg-slate-100 p-2 rounded-xl">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-tight">"{m.en}"</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{m.uz}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-2xl shadow-3xl p-0 z-50 bg-slate-950 border-4 border-white hover:scale-110 transition-all">
            <Settings className="h-8 w-8 text-indigo-500" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-8 border-none shadow-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase text-slate-950 tracking-tighter flex items-center gap-3">
              <Activity className="h-6 w-6 text-indigo-600" /> ACADEMY CONTROL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <Button onClick={seedDefaultHabits} variant="outline" className="w-full h-12 rounded-xl font-black border-2 border-indigo-100 text-indigo-600 gap-2 hover:bg-indigo-50 text-xs">
              <Download className="h-4 w-4" /> STANDART VAZIFALARNI YUKLASH
            </Button>
            <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100">
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase text-slate-500 tracking-widest px-1">Vazifa Nomi</Label>
                <Input placeholder="Yangi vazifa..." value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className="rounded-xl border-slate-200 h-12 font-bold text-base px-4 shadow-sm" />
              </div>
              <div className="grid gap-2">
                <Label className="font-black text-[10px] uppercase text-slate-500 tracking-widest px-1">Category</Label>
                <Select value={newHabitCategory} onValueChange={(v: any) => setNewHabitCategory(v)}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-12 font-bold text-base px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="namoz">Namoz (Faith)</SelectItem>
                    <SelectItem value="learning">Ta'lim (Mental)</SelectItem>
                    <SelectItem value="sport">Sport (Physical)</SelectItem>
                    <SelectItem value="health">Salomatlik</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleManualAdd} className="w-full h-14 rounded-xl font-black bg-indigo-600 text-white text-base shadow-xl hover:shadow-indigo-200">
                <Plus className="mr-2 h-5 w-5" /> QO'SHISH
              </Button>
            </div>
            <div className="space-y-2">
              <p className="font-black text-[10px] uppercase text-slate-500 px-2">Vazifalar ({habits.length})</p>
              <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {habits.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-slate-800">{h.name}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{h.category}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => deleteHabit(h.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
