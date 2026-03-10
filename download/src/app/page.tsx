
"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  Trophy, 
  Settings, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Zap,
  Quote,
  Target,
  ShieldCheck,
  UserCheck,
  BarChart3,
  Clock,
  XCircle,
  Activity,
  TrendingUp,
  Loader2,
  Flame,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection } from "firebase/firestore"
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login"
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

const MOTIVATIONS = [
  { en: "Without Allah, I am nothing.", uz: "Allohning yordamisiz men hech kimman." },
  { en: "Hard work beats talent when talent doesn't work hard.", uz: "Mehnat talantni yengadi, agar talant mehnat qilmasa." },
  { en: "Champions don't make excuses, they make history.", uz: "Chempionlar bahona izlamaydilar, ular tarix yaratadilar." },
  { en: "Discipline is doing what needs to be done, even if you don't want to.", uz: "Intizom - bu xohlamasang ham, kerakli ishni qilishdir." },
  { en: "Cristiano Ronaldo works harder than everyone. That's why he is the best.", uz: "Ronaldo hamma kishidan ko'p mehnat qiladi. Shuning uchun u eng zo'ri." },
  { en: "Allah is with the patient and the hard-working.", uz: "Alloh sabrli va mehnatsevarlar bilan birgadir." },
  { en: "Success is earned, not given.", uz: "Muvaffaqiyat mehnat bilan qozoniladi, berilmaydi." },
  { en: "Your only limit is you.", uz: "Sening yagona to'sig'ing - bu o'zing." },
  { en: "Don't stop when you're tired, stop when you're done.", uz: "Charchaganda emas, ishni bitirganda to'xta." },
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

export default function KunRejaApp() {
  const db = useFirestore()
  const { user, isUserLoading, auth } = useUser()
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [isManageOpen, setIsManageOpen] = React.useState(false)
  const [newHabitName, setNewHabitName] = React.useState("")
  const [newHabitCategory, setNewHabitCategory] = React.useState<Habit['category']>('other')
  const { toast } = useToast()

  // Sign in anonymously if not logged in
  React.useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth)
    }
  }, [user, isUserLoading, auth])

  // Fetch habits from Firestore
  const habitsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'habits')
  }, [db, user])
  
  const { data: habitsRaw, isLoading: isHabitsLoading } = useCollection<Habit>(habitsQuery)
  const habits = habitsRaw || []

  // Fetch daily notes from Firestore
  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const notesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'dailyNotes')
  }, [db, user])
  
  const { data: allNotesRaw } = useCollection<{ content: string, date: string }>(notesQuery)
  const allNotes = allNotesRaw || []
  
  const currentNote = allNotes?.find(n => n.date === dateStr)?.content || ""

  const toggleHabit = (id: string, date: string) => {
    if (!user || !db) return
    const habit = habits.find(h => h.id === id)
    if (!habit) return

    const habitRef = doc(db, 'users', user.uid, 'habits', id)
    
    if (habit.category === 'namoz') {
      const currentStatus = (habit.prayerHistory?.[date] || 'todo') as PrayerStatus
      let nextStatus: PrayerStatus = 'todo'
      if (currentStatus === 'todo') nextStatus = 'ontime'
      else if (currentStatus === 'ontime') nextStatus = 'late'
      else if (currentStatus === 'late') nextStatus = 'missed'
      else nextStatus = 'todo'
      
      updateDocumentNonBlocking(habitRef, {
        prayerHistory: { ...(habit.prayerHistory || {}), [date]: nextStatus }
      })
    } else {
      const isCompleted = (habit.completedDates || []).includes(date)
      const newDates = isCompleted 
        ? (habit.completedDates || []).filter(d => d !== date)
        : [...(habit.completedDates || []), date]
      
      updateDocumentNonBlocking(habitRef, { completedDates: newDates })
    }
  }

  const updateNote = (val: string) => {
    if (!user || !db) return
    const noteRef = doc(db, 'users', user.uid, 'dailyNotes', dateStr)
    setDocumentNonBlocking(noteRef, { content: val, date: dateStr }, { merge: true })
  }

  const addHabit = (name: string, category: Habit['category']) => {
    if (!name.trim() || !user || !db) return
    const id = crypto.randomUUID()
    const newHabit: Habit = {
      id,
      name,
      category,
      completedDates: [],
      prayerHistory: category === 'namoz' ? {} : undefined
    }
    const habitRef = doc(db, 'users', user.uid, 'habits', id)
    setDocumentNonBlocking(habitRef, newHabit, { merge: true })
  }

  const seedDefaultHabits = () => {
    if (!user || !db) return
    DEFAULT_HABITS.forEach(h => {
      const exists = habits.some(existing => existing.name === h.name)
      if (!exists) {
        addHabit(h.name, h.category as Habit['category'])
      }
    })
    toast({ title: "Muvaffaqiyat", description: "Barcha standart vazifalar yuklandi!" })
  }

  const handleManualAdd = () => {
    if (!newHabitName.trim()) return
    addHabit(newHabitName, newHabitCategory)
    setNewHabitName("")
    toast({ title: "Muvaffaqiyat", description: "Yangi vazifa qo'shildi!" })
  }

  const deleteHabit = (id: string) => {
    if (!user || !db) return
    const habitRef = doc(db, 'users', user.uid, 'habits', id)
    deleteDocumentNonBlocking(habitRef)
    toast({ title: "O'chirildi", description: "Vazifa olib tashlandi." })
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
    return eachDayOfInterval({ start: subDays(today, 11), end: today }).map(date => {
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

  if (isUserLoading || isHabitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="font-black text-slate-900 uppercase tracking-widest">Akademiya yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()))

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-32 font-body">
      
      {/* 🚀 ELITE CHAMPION BANNER */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-[#020617] via-[#1e1b4b] to-[#020617] text-white overflow-hidden rounded-[3.5rem] relative group border-b-[15px] border-primary/40">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:scale-125 transition-transform duration-1000">
          <Trophy className="h-64 w-64" />
        </div>
        <CardContent className="p-10 md:p-14 relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="bg-indigo-500/20 p-8 rounded-[2.8rem] shadow-2xl backdrop-blur-3xl border-2 border-white/10 ring-12 ring-white/5">
            <UserCheck className="h-20 w-20 text-indigo-400" />
          </div>
          <div className="space-y-6 text-center md:text-left flex-1">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.8] bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-blue-300">
              ABUBAKR ACADEMY: <br/> ELITE CONTROL
            </h2>
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-inner">
              <p className="text-xl md:text-2xl font-bold text-white/95 italic leading-tight">
                "Abubakr, kelajaging o'z qo'lingda! Har bir belgilayotgan ishing kelajakdagi chempionliging asosi bo'ladi. Alloh sening harakatlaringni ko'rib turibdi!"
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5">
               <div className="bg-primary text-white px-8 py-3 rounded-2xl text-base font-black border-2 border-white/20 flex items-center gap-3 shadow-xl">
                 <Zap className="h-5 w-5 fill-current animate-pulse" /> PERFORMANCE: {selectedDayStats.percent}%
               </div>
               <div className="bg-white/10 px-8 py-3 rounded-2xl text-base font-black border border-white/20 flex items-center gap-3 backdrop-blur-xl">
                 <ShieldCheck className="h-5 w-5 text-green-400" /> DISCIPLINE: {selectedDayStats.done}/{habits.length}
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🧠 TOP MOTIVATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOTIVATIONS.slice(0, 3).map((m, i) => (
          <Card key={i} className="bg-white border-none shadow-2xl rounded-[2.5rem] hover:-translate-y-3 transition-all duration-500 overflow-hidden group">
            <div className="h-3 w-full bg-primary" />
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <Quote className="h-8 w-8 text-primary opacity-30 group-hover:scale-125 transition-transform" />
              <p className="text-xl font-black text-slate-900 leading-tight">"{m.en}"</p>
              <div className="h-1.5 w-16 bg-slate-100 rounded-full" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em]">{m.uz}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[3rem] shadow-2xl border-b-8 border-slate-100 gap-8">
            <div className="flex items-center gap-8">
              <div className="bg-primary/10 p-4 rounded-3xl">
                <CalendarIcon className="h-10 w-10 text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {format(selectedDate, 'd-MMMM', { locale: uz })} HISOBOTI
                 </h2>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Academy Training Log History</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="bg-indigo-600 px-6 py-3 rounded-[1.5rem] text-xs font-black text-white uppercase shadow-xl flex items-center gap-2">
                 <CheckCircle2 className="h-4 w-4" /> {selectedDayStats.done} DONE
               </div>
               <div className="bg-red-500 px-6 py-3 rounded-[1.5rem] text-xs font-black text-white uppercase shadow-xl flex items-center gap-2">
                 <XCircle className="h-4 w-4" /> {selectedDayStats.missed} QAZO
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {habits.map((h) => {
              const isNamoz = h.category === 'namoz'
              const rawStatus = isNamoz 
                ? (h.prayerHistory?.[dateStr] || 'todo') 
                : ((h.completedDates || []).includes(dateStr) ? 'done' : 'todo')
              
              const isAutoMissed = isPastDate && rawStatus === 'todo'
              const status = isAutoMissed ? 'missed' : rawStatus

              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id, dateStr)}
                  className={cn(
                    "flex items-center justify-between p-7 rounded-[2.5rem] border-4 transition-all text-left shadow-2xl hover:scale-[1.03] active:scale-95 group",
                    status === 'ontime' || status === 'done' ? "bg-green-50 border-green-200" : 
                    status === 'late' ? "bg-yellow-50 border-yellow-200" :
                    status === 'missed' ? "bg-red-50 border-red-200" : "bg-white border-slate-100"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        h.category === 'namoz' ? "bg-indigo-600 text-white" :
                        h.category === 'sport' ? "bg-orange-500 text-white" : 
                        h.category === 'learning' ? "bg-purple-600 text-white" : "bg-slate-600 text-white"
                      )}>
                        {h.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors">{h.name}</h3>
                  </div>
                  
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center border-4 transition-all shadow-xl",
                    status === 'ontime' || status === 'done' ? "bg-green-500 border-green-600 text-white" :
                    status === 'late' ? "bg-yellow-500 border-yellow-600 text-white" :
                    status === 'missed' ? "bg-red-500 border-red-600 text-white" : "bg-slate-50 border-slate-200"
                  )}>
                    {status === 'ontime' || status === 'done' ? <ShieldCheck className="h-7 w-7" /> :
                     status === 'late' ? <Clock className="h-7 w-7" /> :
                     status === 'missed' ? <XCircle className="h-7 w-7" /> : <div className="h-3 w-3 rounded-full bg-slate-200" />}
                  </div>
                </button>
              )
            })}
          </div>

          <Card className="rounded-[4rem] border-none shadow-3xl bg-white p-10">
            <CardHeader className="p-0 pb-10 flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-black flex items-center gap-5 uppercase tracking-tighter text-slate-900">
                <BarChart3 className="h-8 w-8 text-primary" />
                CHAMPION PERFORMANCE LOG (Done vs Missed)
              </CardTitle>
            </CardHeader>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: '900', fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc', radius: 15}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 p-5 rounded-[2rem] shadow-3xl border border-white/10 text-white min-w-[180px]">
                            <p className="font-black text-[12px] border-b border-white/10 pb-2 mb-3 uppercase tracking-widest text-indigo-400">{data.fullDate}</p>
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold text-white flex justify-between uppercase">DONE <span className="text-indigo-400">{data.done}</span></p>
                              <p className="text-[11px] font-bold text-white flex justify-between uppercase">MISSED <span className="text-red-400">{data.missed}</span></p>
                              <div className="mt-3 pt-3 border-t border-white/10 text-center">
                                <p className="text-2xl font-black text-white">{data.percent}%</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="done" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="missed" stackId="a" fill="#ef4444" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-[4rem] border-none shadow-3xl bg-white overflow-hidden border-l-[15px] border-indigo-600">
            <CardHeader className="p-8 pb-3">
              <CardTitle className="text-2xl font-black flex items-center gap-4 uppercase text-slate-900 tracking-tighter">
                <Activity className="h-8 w-8 text-primary" />
                TRENER HISOBOTI (XULOSA)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Textarea 
                placeholder="Rostgo'y bo'l! Foydali nima qilding? Qayerda xato qilding? Alloh hammasini ko'rib turibdi..."
                className="min-h-[180px] rounded-[2rem] border-slate-100 bg-slate-50 font-bold text-lg p-8 focus:ring-8 focus:ring-indigo-500/10 transition-all resize-none shadow-inner border-2"
                value={currentNote}
                onChange={(e) => updateNote(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <Card className={cn(
            "rounded-[3.5rem] border-none shadow-3xl transition-all duration-700 overflow-hidden relative group",
            selectedDayStats.percent === 100 ? "bg-indigo-600 text-white" : "bg-white text-slate-900"
          )}>
            {selectedDayStats.percent === 100 && (
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <Flame className="h-20 w-20 animate-bounce" />
              </div>
            )}
            <CardHeader className="p-8 pb-3">
              <CardTitle className="text-[11px] flex items-center gap-3 font-black uppercase tracking-[0.25em] opacity-60">
                <Target className="h-5 w-5" /> DAILY ACADEMY SUMMARY
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="flex items-end justify-between">
                <div className="text-7xl font-black tracking-tighter leading-none">{selectedDayStats.percent}%</div>
                <div className="text-[11px] font-black opacity-50 uppercase tracking-widest">
                  {selectedDayStats.done}/{habits.length} COMPLETED
                </div>
              </div>
              <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border-2 border-slate-50">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${selectedDayStats.percent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-500/5 p-5 rounded-[2rem] text-center border-2 border-slate-500/5 shadow-sm">
                   <p className="text-[10px] font-black uppercase opacity-60 mb-2">DONE</p>
                   <p className="text-3xl font-black text-indigo-600">{selectedDayStats.done}</p>
                </div>
                <div className="bg-slate-500/5 p-5 rounded-[2rem] text-center border-2 border-slate-500/5 shadow-sm">
                   <p className="text-[10px] font-black uppercase opacity-60 mb-2">MISSED</p>
                   <p className="text-3xl font-black text-red-500">{selectedDayStats.missed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3.5rem] border-none shadow-3xl bg-white p-6 relative group overflow-hidden border-t-8 border-primary/20">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="w-full scale-105 origin-top"
              locale={uz}
              showOutsideDays={false}
              classNames={{
                day_selected: "bg-indigo-600 text-white font-black rounded-2xl shadow-2xl scale-125 z-10",
                day_today: "border-4 border-indigo-100 text-indigo-600 font-black rounded-2xl",
                day: "h-12 w-12 font-black text-slate-700 hover:bg-indigo-50 rounded-2xl text-[12px] transition-all",
                nav_button: "hover:bg-slate-50 rounded-xl p-3 transition-all",
                caption_label: "font-black text-base uppercase tracking-tighter text-slate-900"
              }}
            />
          </Card>

          <div className="space-y-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-6">Elite Academy Motivation</p>
            {MOTIVATIONS.slice(3, 10).map((m, i) => (
              <Card key={i} className="bg-white border-none shadow-xl rounded-[2rem] hover:scale-[1.05] transition-all cursor-default group border-l-8 border-indigo-50 hover:border-indigo-600 hover:shadow-indigo-100">
                <CardContent className="p-7 flex items-start gap-5">
                  <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 leading-tight">"{m.en}"</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">{m.uz}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-10 right-10 h-20 w-20 rounded-[2.5rem] shadow-3xl p-0 z-50 bg-slate-950 border-4 border-white hover:scale-110 transition-all hover:rotate-90 group">
            <Settings className="h-10 w-10 text-primary group-hover:animate-spin-slow" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] rounded-[3.5rem] p-10 border-none shadow-3xl bg-white animate-in zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase text-slate-950 tracking-tighter flex items-center gap-4">
              <Activity className="h-8 w-8 text-indigo-600" /> ACADEMY CONTROL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 pt-6">
            <Button onClick={seedDefaultHabits} variant="outline" className="w-full h-14 rounded-2xl font-black border-2 border-indigo-100 text-indigo-600 gap-3 hover:bg-indigo-50">
              <Download className="h-5 w-5" /> STANDART VAZIFALARNI YUKLASH
            </Button>
            <div className="space-y-6 bg-slate-50 p-8 rounded-[3rem] shadow-inner border-2 border-slate-100">
              <div className="grid gap-3">
                <Label className="font-black text-[11px] uppercase text-slate-500 tracking-widest px-1">Vazifa Nomi</Label>
                <Input placeholder="Masalan: 50 ta push-up..." value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className="rounded-2xl border-slate-200 h-14 font-bold text-lg px-5 shadow-sm" />
              </div>
              <div className="grid gap-3">
                <Label className="font-black text-[11px] uppercase text-slate-500 tracking-widest px-1">Yo'nalish (Category)</Label>
                <Select value={newHabitCategory} onValueChange={(v: any) => setNewHabitCategory(v)}>
                  <SelectTrigger className="rounded-2xl border-slate-200 h-14 font-bold text-lg px-5 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="namoz">Namoz (Faith)</SelectItem>
                    <SelectItem value="learning">Ta'lim (Mental)</SelectItem>
                    <SelectItem value="sport">Sport (Physical)</SelectItem>
                    <SelectItem value="health">Salomatlik (Health)</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleManualAdd} className="w-full h-16 rounded-2xl font-black bg-indigo-600 text-white text-lg shadow-2xl hover:shadow-indigo-300 transition-all hover:scale-[1.02]">
                <Plus className="mr-3 h-6 w-6" /> QO'SHISH
              </Button>
            </div>
            <div className="space-y-4">
              <p className="font-black text-[11px] uppercase text-slate-500 tracking-widest px-4">Joriy Vazifalar ({habits.length})</p>
              <div className="max-h-[250px] overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                {habits.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-3xl shadow-sm hover:border-red-100 transition-all group">
                    <div className="flex flex-col">
                      <span className="font-black text-base text-slate-800">{h.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{h.category}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" onClick={() => deleteHabit(h.id)}>
                      <Trash2 className="h-5 w-5" />
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
