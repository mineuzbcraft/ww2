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
  BarChart3,
  Clock,
  XCircle,
  Activity,
  TrendingUp,
  Loader2,
  Download,
  Trophy,
  Flame,
  Star,
  Crown,
  Medal,
  Sword,
  Dumbbell,
  Brain,
  Globe,
  Languages,
  ArrowUpRight,
  Sparkles,
  Quote,
  Flag,
  Rocket,
  FileText,
  Save,
  AlertTriangle,
  HandMetal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
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

import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

const MOTIVATIONS = [
  { text: "Abubakr, namozingni tashlama! Allohdan so'ra, U senga hamma narsani beradi.", category: "faith" },
  { text: "18 yoshda millioner bo'lib O'zbekistondan chiqib ketasan! Bu sening taqdiring, Insha'Alloh.", category: "vision" },
  { text: "Ingliz tilini o'rgan, Evropada Ronaldodek bo'lasan! SIUUU!", category: "ronaldo" },
  { text: "Harakatdan to'xtama! Alloh yordam bermasa, biz hech kimmiz.", category: "faith" },
  { text: "Bugungi og'riq — ertangi millionerlik rohati. Sabr qil va tinmasdan ishla!", category: "mindset" },
  { text: "Discipline — bu sening 18 yoshdagi erkinliging chiptasidir.", category: "mindset" },
  { text: "Insha'Allah, sening ismingni butun dunyo taniydi. Faqat harakat qil!", category: "vision" },
  { text: "Tinmasdan Allohdan so'ra! Duo — bu sening eng kuchli qurolingdir.", category: "faith" },
  { text: "Bugungi ingliz tili — ertangi London yoki Dubay safari.", category: "learning" },
  { text: "Abubakr, uxlama! Evropada millioner bo'lish uchun bugun uyg'oq bo'lishing shart!", category: "action" },
]

const DEFAULT_HABITS = [
  { name: "Bomdod (Allohga duo qil)", category: "namoz" },
  { name: "Peshin (Maqsadingni esla)", category: "namoz" },
  { name: "Asr (Charchoqni yeng)", category: "namoz" },
  { name: "Shom (Shukr qil)", category: "namoz" },
  { name: "Xufton (Xulosa qil)", category: "namoz" },
  { name: "English (Evropaga bilet)", category: "learning" },
  { name: "100 Push-up (Warrior mode)", category: "sport" },
  { name: "Turnik (Champion spirit)", category: "sport" },
  { name: "Millionerlik kitoblari / Biznes", category: "learning" },
  { name: "Futbol (Texnika va Cristiano)", category: "sport" },
]

const generateId = () => {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
};

export default function KunRejaApp() {
  const db = useFirestore()
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [isManageOpen, setIsManageOpen] = React.useState(false)
  const [newHabitName, setNewHabitName] = React.useState("")
  const [newHabitCategory, setNewHabitCategory] = React.useState<Habit['category']>('other')
  const [noteContent, setNoteContent] = React.useState("")
  const { toast } = useToast()

  const userId = "abubakr_fixed_id"
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const habitsQuery = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, 'users', userId, 'habits')
  }, [db, userId])
  
  const { data: habitsRaw, isLoading: isHabitsLoading } = useCollection<Habit>(habitsQuery)
  const habits = habitsRaw || []

  const noteRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, 'users', userId, 'dailyNotes', dateStr)
  }, [db, userId, dateStr])

  const { data: noteData } = useDoc<{content: string}>(noteRef)

  React.useEffect(() => {
    if (noteData) {
      setNoteContent(noteData.content || "")
    } else {
      setNoteContent("")
    }
  }, [noteData])

  const saveNote = () => {
    if (!db || !noteRef) return
    setDocumentNonBlocking(noteRef, { content: noteContent, date: dateStr }, { merge: true })
    toast({ title: "SAQLANDI", description: "Bugungi darslar va xulosalar muhrlandi!" })
  }

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
    
    const newHabitData = {
      id: id,
      name: name.trim(),
      category: category,
      completedDates: [],
      prayerHistory: {}
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
    toast({ title: "BISMILLAH!", description: "Millionerlik rejasi yuklandi. Olg'a, Abubakr!" })
  }

  const handleManualAdd = () => {
    if (!newHabitName.trim()) {
      toast({ title: "Xatolik", description: "Vazifa nomini kiriting!", variant: "destructive" })
      return
    }
    addHabit(newHabitName, newHabitCategory)
    setNewHabitName("")
    setIsManageOpen(false)
    toast({ title: "QABUL QILINDI", description: "Yangi maqsad sari qadam!" })
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

    // To make sure total = done + missed visually in stacked bar
    missedCount = Math.max(0, total - Math.floor(doneCount));

    return {
      percent: Math.round((doneCount / (total || 1)) * 100),
      done: doneCount,
      missed: missedCount,
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

  const getRank = (percent: number) => {
    if (percent >= 95) return { title: "LEGENDARY CHAMPION", color: "text-yellow-400", icon: Crown }
    if (percent >= 80) return { title: "FUTURE MILLIONAIRE", color: "text-indigo-400", icon: Rocket }
    if (percent >= 60) return { title: "EUROPEAN STAR", color: "text-emerald-400", icon: Globe }
    if (percent >= 30) return { title: "STRUGGLING WARRIOR", color: "text-blue-400", icon: Sword }
    return { title: "WAKE UP, ABUBAKR!", color: "text-slate-500", icon: Loader2 }
  }

  const currentRank = getRank(selectedDayStats.percent)
  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()))
  const isFailDay = isPastDate && selectedDayStats.percent === 0 && habits.length > 0

  if (isHabitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 text-indigo-500 mx-auto animate-spin" />
          <p className="font-black text-white uppercase tracking-widest animate-pulse">BISMILLAH...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-700 p-4 md:p-8 max-w-[1400px] mx-auto space-y-12 pb-32",
      isFailDay ? "bg-red-950/20" : "bg-[#020617]"
    )}>
      
      {/* Top Coach Banner */}
      <div className={cn(
        "border-y py-6 px-6 rounded-3xl flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in duration-700",
        isFailDay ? "bg-red-600/20 border-red-500/30" : "bg-indigo-600/20 border-indigo-500/30"
      )}>
         <div className="flex items-center gap-3 text-center">
            <Brain className={cn("h-6 w-6 shrink-0", isFailDay ? "text-red-400" : "text-indigo-400")} />
            <p className="text-[12px] md:text-sm font-black uppercase tracking-[0.2em]">
              {isFailDay ? "ABUBAKR, MILLIONERLIKNI UNUTDINGMI? TUR O'RNINGDAN!" : "ABUBAKR, TINMASDAN ALLOHDAN SO'RA! 18 YOSHDA MILLIONER BO'LASAN!"}
            </p>
            <Brain className={cn("h-6 w-6 shrink-0", isFailDay ? "text-red-400" : "text-indigo-400")} />
         </div>
      </div>

      {/* Hero Section */}
      <Card className={cn(
        "border-none overflow-hidden rounded-[4rem] transition-all duration-700 shadow-2xl",
        isFailDay ? "bg-gradient-to-br from-red-950 via-red-900 to-black" : 
        selectedDayStats.percent >= 90 ? "bg-gradient-to-br from-[#020617] via-[#1e1b4b] to-[#020617] border border-yellow-500/20" :
        "bg-gradient-to-br from-[#020617] via-[#1e1b4b] to-[#020617]"
      )}>
        <CardContent className="p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative">
          <div className="absolute top-4 right-8 md:right-16 hidden md:flex items-center gap-3">
             <Star className="h-5 w-5 text-yellow-400 fill-current" />
             <span className="text-[10px] font-black uppercase tracking-widest text-yellow-200">INSHA'ALLOH: MILLIONER</span>
          </div>
          <div className="relative group">
            <div className={cn("absolute inset-0 blur-3xl opacity-20", isFailDay ? "bg-red-500" : "bg-indigo-500")} />
            <div className={cn(
              "relative p-10 rounded-[3.5rem] border border-white/20 shadow-2xl transition-transform duration-500",
              isFailDay ? "bg-gradient-to-br from-red-600 to-red-900" : "bg-gradient-to-br from-indigo-500 to-purple-700"
            )}>
              {isFailDay ? <AlertTriangle className="h-24 w-24 text-white" /> : <Trophy className="h-24 w-24 text-yellow-300 drop-shadow-[0_0_25px_rgba(253,224,71,0.6)] animate-float" />}
              {selectedDayStats.percent >= 95 && !isFailDay && <Crown className="absolute -top-6 -right-6 h-12 w-12 text-yellow-400" />}
            </div>
          </div>
          <div className="space-y-6 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <div className={cn(
                "px-4 py-1.5 rounded-full border flex items-center gap-2",
                isFailDay ? "bg-red-500/20 border-red-500/30 text-red-200" : "bg-orange-500/20 border-orange-500/30 text-orange-200"
              )}>
                <Flame className={cn("h-4 w-4", isFailDay ? "text-red-500" : "text-orange-500")} />
                <span className="text-[10px] font-black tracking-widest uppercase">{isFailDay ? "MAS'ULIYATSIZLIK!" : "TINMASDAN HARAKAT QIL!"}</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[1.0] bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-500">
              {isFailDay ? "MAG'LUBIYAT KUNI!" : "ABUBAKR, HARAKAT QIL!"} <br/><span className={cn("text-2xl md:text-4xl", isFailDay ? "text-red-400" : "text-indigo-400")}>NAMOZ O'QI VA ALLOHDAN SO'RA!</span>
            </h1>
            <p className="text-sm md:text-xl font-black text-indigo-300 uppercase tracking-[0.1em] max-w-2xl mx-auto md:mx-0 opacity-90 mt-4">
              {isFailDay ? "AGAR SHUNDAY DAVOM ETSANG, HECH QACHON MILLIONER BO'LA OLMAYSAN!" : "INSHA'ALLOH, 18 YOSHGACHA O'ZBEKISTONDAN CHIQIB KETASAN! MILLIONERLIK SENI KUTMOQDA!"}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
               <div className="bg-white/5 backdrop-blur-lg border border-white/10 px-8 py-5 rounded-[2.5rem] flex items-center gap-4 shadow-2xl">
                 <Zap className={cn("h-8 w-8", isFailDay ? "text-red-500" : "text-yellow-400 fill-current")} /> 
                 <div>
                   <div className="text-[11px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Success Power</div>
                   <div className="text-3xl font-black">{selectedDayStats.percent}%</div>
                 </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          
          {/* Daily Status Header */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900/40 backdrop-blur-lg p-10 rounded-[3.5rem] shadow-3xl border border-white/5 gap-8">
            <div className="flex items-center gap-8 text-center md:text-left">
              <div className="bg-indigo-600/10 p-5 rounded-3xl border border-indigo-500/20">
                <CalendarIcon className="h-12 w-12 text-indigo-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                  {format(selectedDate, 'd-MMMM', { locale: uz })}
                 </h2>
                 <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-2">Bugungi Jang Rejasi</p>
              </div>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 px-8 py-4 rounded-3xl text-[12px] font-black text-indigo-400 uppercase flex items-center gap-3">
               <Languages className="h-5 w-5" /> LEARN ENGLISH FOR EUROPE
            </div>
          </div>

          {/* Missions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                    "flex items-center justify-between p-8 rounded-[3rem] border-2 transition-all text-left shadow-2xl hover:scale-[1.01] active:scale-95 group",
                    status === 'ontime' || status === 'done' ? "bg-green-500/10 border-green-500/30 text-green-500" : 
                    status === 'late' ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" :
                    status === 'missed' ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-slate-900/40 border-white/5 hover:border-white/20 text-slate-400"
                  )}
                >
                  <div className="space-y-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-4 py-1.5 rounded-full text-white",
                      h.category === 'namoz' ? "bg-indigo-600" :
                      h.category === 'sport' ? "bg-orange-600" :
                      h.category === 'learning' ? "bg-emerald-600" : "bg-slate-700"
                    )}>
                      {h.category}
                    </span>
                    <h3 className="text-xl font-black tracking-tight leading-none group-hover:text-white transition-colors">{h.name}</h3>
                  </div>
                  <div className={cn(
                    "h-16 w-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all shadow-xl",
                    status === 'ontime' || status === 'done' ? "bg-green-500 border-green-400 text-white" :
                    status === 'late' ? "bg-yellow-500 border-yellow-400 text-white" :
                    status === 'missed' ? "bg-red-500 border-red-400 text-white" : "bg-slate-800 border-white/5 group-hover:border-white/20"
                  )}>
                    {status === 'ontime' || status === 'done' ? <ShieldCheck className="h-8 w-8" /> :
                     status === 'late' ? <Clock className="h-8 w-8" /> :
                     status === 'missed' ? <XCircle className="h-8 w-8" /> : <div className="h-4 w-4 rounded-full bg-white/10" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Efficiency History */}
          <Card className="rounded-[4rem] border border-white/5 bg-slate-900/40 p-12 shadow-3xl">
            <CardHeader className="p-0 pb-12">
              <CardTitle className="text-3xl font-black flex items-center gap-5 uppercase tracking-tighter text-white">
                <BarChart3 className="h-10 w-10 text-indigo-500" /> Millionaire Path Progress
              </CardTitle>
            </CardHeader>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 14, fontWeight: '900', fill: '#64748b'}} />
                  <YAxis hide domain={[0, habits.length || 1]} />
                  <Tooltip 
                    cursor={{fill: '#ffffff05'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="backdrop-blur-lg border bg-slate-950/95 border-white/10 p-6 rounded-[2rem] shadow-4xl text-white">
                            <p className="font-black uppercase mb-3 border-b border-white/10 pb-3 tracking-[0.2em] text-xs text-indigo-300">{data.fullDate}</p>
                            <p className="font-bold flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-indigo-500" /> G'ALABA: {Math.floor(data.done)}</p>
                            <p className="font-bold flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-red-500" /> MAG'LUBIYAT: {data.missed}</p>
                            <div className="mt-4 pt-4 border-t border-white/10 text-2xl font-black text-indigo-400">{data.percent}% ERISHILDI</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="done" stackId="a" fill="#4f46e5" radius={historyData.some(d => d.missed === 0) ? [12, 12, 0, 0] : [0, 0, 0, 0]} />
                  <Bar dataKey="missed" stackId="a" fill="#ef4444" radius={[12, 12, 0, 0]} minPointSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 flex justify-center gap-10">
               <div className="flex items-center gap-3">
                 <div className="h-4 w-4 rounded-full bg-indigo-500" />
                 <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">G'ALABA (DONE)</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="h-4 w-4 rounded-full bg-red-500" />
                 <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">MAG'LUBIYAT (MISSED)</span>
               </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          
          <Card className={cn(
            "rounded-[4rem] border border-white/10 shadow-4xl overflow-hidden transition-all duration-700",
            isFailDay ? "bg-red-950 border-red-500/30" :
            selectedDayStats.percent >= 80 ? "bg-gradient-to-br from-indigo-700 via-indigo-900 to-purple-950 shadow-[0_0_60px_rgba(79,70,229,0.3)]" : "bg-slate-900/60"
          )}>
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-[12px] flex items-center gap-3 font-black uppercase tracking-[0.3em] text-indigo-200">
                <Target className="h-6 w-6" /> Millionaire Index
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-10">
              <div className="flex items-end justify-between">
                <div className="text-8xl font-black tracking-tighter leading-none text-white">
                  {selectedDayStats.percent}<span className="text-3xl opacity-50 ml-1">%</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-6 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 p-1">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      isFailDay ? "bg-red-500" : selectedDayStats.percent >= 80 ? "bg-white" : "bg-indigo-500"
                    )}
                    style={{ width: `${selectedDayStats.percent}%` }}
                  />
                </div>
                <p className="text-[11px] font-black text-center uppercase tracking-[0.2em] text-indigo-100">
                  {selectedDayStats.percent === 100 ? "ALLOH SENGADAN ROZI BO'LSIN, CHEMPION!" : 
                   selectedDayStats.percent >= 80 ? "EVROPA SARI TO'G'RI YO'LDASAS!" : 
                   selectedDayStats.percent > 0 ? "RONALDO BO'LAMAN DESANG, TUR O'RNINGDAN!" : "ABUBAKR, MILLIONERLIKNI UNUTDINGMI?"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] px-6">TRENER VA RONALDO MASLAHATI</p>
            {MOTIVATIONS.map((m, i) => (
              <Card key={i} className="bg-slate-900/40 border border-white/5 shadow-2xl rounded-[3rem] group hover:border-indigo-500/50 transition-all">
                <CardContent className="p-8 flex items-start gap-6">
                  <div className="bg-indigo-600/10 p-4 rounded-3xl border border-indigo-500/20 shrink-0">
                    {m.category === 'faith' ? <ShieldCheck className="h-6 w-6 text-indigo-400" /> :
                     m.category === 'ronaldo' ? <Star className="h-6 w-6 text-yellow-400 fill-current" /> :
                     <Globe className="h-6 w-6 text-indigo-400" />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[15px] font-black text-white leading-tight">"{m.text}"</p>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">— {m.category === 'ronaldo' ? 'Cristiano Ronaldo' : 'Ustozing'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Notes / Trainer Report - AT THE ABSOLUTE BOTTOM */}
      <div className="pt-20">
        <Card className="rounded-[3.5rem] border border-white/10 bg-slate-900/40 p-10 shadow-3xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                <FileText className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Trener Hisoboti (Kunlik Xulosa)</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">18 yoshli muvaffaqiyating kundaligi</p>
              </div>
            </div>
            <Button onClick={saveNote} className="rounded-2xl h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black gap-3 transition-all shadow-2xl">
              <Save className="h-6 w-6" /> SAQLASH
            </Button>
          </div>
          <Textarea 
            placeholder="Abubakr, bugun nimalar qilding? Qayerda qiynalding? Millionerlik sari qadamlaringni yoz..."
            className="min-h-[250px] rounded-[2.5rem] bg-black/60 border-white/10 text-xl font-medium p-10 focus:ring-4 focus:ring-indigo-500/30 resize-none transition-all shadow-inner custom-scrollbar"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </Card>
      </div>

      {/* Control Center Trigger */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.4)] p-0 z-50 bg-indigo-600 border-4 border-white/20 hover:scale-110 transition-all group overflow-hidden">
            <Settings className="h-8 w-8 text-white group-hover:rotate-180 transition-transform duration-700" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] rounded-[3.5rem] p-10 border border-white/10 shadow-4xl bg-slate-950 text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <CardTitle className="text-3xl font-black uppercase text-white tracking-tighter flex items-center gap-5">
              <Brain className="h-10 w-10 text-indigo-500" /> MILLIONAIRE CONTROL
            </CardTitle>
          </DialogHeader>
          <div className="space-y-10 pt-8">
            <Button onClick={seedDefaultHabits} variant="outline" className="w-full h-16 rounded-3xl font-black border-2 border-indigo-500/20 text-indigo-400 gap-4 hover:bg-indigo-600 hover:text-white transition-all text-xs tracking-[0.2em] uppercase">
              <Download className="h-5 w-5" /> BLUEPRINTNI YUKLASH (EVROPA)
            </Button>
            
            <div className="space-y-6 bg-white/5 p-8 rounded-[3rem] border border-white/10">
              <div className="grid gap-4">
                <Label className="font-black text-[11px] uppercase text-indigo-400 tracking-[0.2em]">Yangi Maqsad Nomi</Label>
                <input type="text" placeholder="e.g. English speaking..." value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/40 h-14 font-black text-lg px-6 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid gap-4">
                <Label className="font-black text-[11px] uppercase text-indigo-400 tracking-[0.2em]">Yo'nalish</Label>
                <Select value={newHabitCategory} onValueChange={(v: any) => setNewHabitCategory(v)}>
                  <SelectTrigger className="rounded-2xl border-white/10 bg-black/40 h-14 font-black text-lg px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl bg-slate-900 border-white/10 text-white">
                    <SelectItem value="namoz">Faith (Imon)</SelectItem>
                    <SelectItem value="learning">Education (Bilim)</SelectItem>
                    <SelectItem value="sport">Physical (Mashq)</SelectItem>
                    <SelectItem value="health">Health (Salomatlik)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleManualAdd} className="w-full h-16 rounded-3xl font-black bg-indigo-600 text-white text-lg shadow-xl hover:bg-indigo-500 transition-all">
                <Plus className="mr-3 h-6 w-6" /> MAQSADNI QO'SHISH
              </Button>
            </div>

            <div className="space-y-4">
              <p className="font-black text-[11px] uppercase text-slate-500 tracking-[0.2em] px-4">Faol Maqsadlar ({habits.length})</p>
              {habits.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl group transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors">{h.name}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{h.category}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-600 hover:text-red-500" onClick={() => deleteHabit(h.id)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Final Motivational Message */}
      <div className="flex flex-col items-center justify-center pt-20 pb-10 space-y-8">
         <div className="text-center max-w-2xl space-y-6 opacity-80">
           <Trophy className="h-16 w-16 mx-auto text-yellow-500/80" />
           <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-white">INSHA'ALLOH, EVROPADA G'OLIB BO'LASAN!</h3>
           <p className="text-[11px] md:text-sm font-black uppercase tracking-[0.3em] leading-relaxed text-slate-400">
             Abubakr, 18 yoshingda O'zbekistondan ketib, butun dunyoga millioner bo'lib tanilishing bugungi harakatingga bog'liq. 
             Allohni unutma, namozingni tashlama!
           </p>
         </div>
         <div className="flex items-center gap-4 text-indigo-500/40 font-black tracking-widest text-xs uppercase">
           <Flag className="h-4 w-4" /> UZBEKISTAN ➔ EUROPE ➔ MILLIONAIRE <Globe className="h-4 w-4" />
         </div>
      </div>
    </div>
  )
}
