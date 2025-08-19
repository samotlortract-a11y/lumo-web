import React, { useEffect, useMemo, useState } from 'react'

const tg = window.Telegram?.WebApp

function useTelegramTheme(){
  useEffect(()=>{
    if(!tg) return
    const apply = ()=>{
      const tp = tg.themeParams || {}
      document.documentElement.style.setProperty('--tg-bg', tp.bg_color || '#F3EEF1')
      document.documentElement.style.setProperty('--tg-text', tp.text_color || '#121212')
    }
    tg.ready()
    tg.expand()
    apply()
    tg.onEvent('themeChanged', apply)
    return ()=> tg.offEvent('themeChanged', apply)
  },[])
}

function useLocalState(key, initial){
  const [val,setVal] = useState(()=>{
    try{ const s = localStorage.getItem(key); return s? JSON.parse(s) : initial }catch{ return initial }
  })
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(val)) }catch{} }, [key,val])
  return [val,setVal]
}

function CircleProgress({ value=0, size=180, stroke=16, color="#C2DC80" }){
  const r = (size - stroke)/2
  const c = 2*Math.PI*r
  const dash = Math.max(0, Math.min(1, value)) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#ffffff55" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c-dash}`}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fill="currentColor">
        {Math.round(value*100)}%
      </text>
    </svg>
  )
}

function Bunny({ mood='smile' }){
  // Плейсхолдер: эмодзи вместо картинок. Позже заменим на PNG/WebP в /public/bunny/*
  const map = {
    smile:'🐰', shine:'✨🐰✨', sad:'🥺🐰', chef:'🍳🐰', soup:'🍲🐰', tea:'🫖🐰', thumb:'👍🐰', shock:'😮🐰'
  }
  return <div className="text-5xl">{map[mood] || '🐰'}</div>
}

function TabButton({active,children,onClick}){
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full ${active?'bg-lumoBerry text-white':'bg-white text-black/80'} transition`}>
      {children}
    </button>
  )
}

export default function App(){
  useTelegramTheme()

  // --- Profile (онбординг упрощён в MVP 0) ---
  const [profile,setProfile] = useLocalState('lumo.profile', {
    name:'', sex:'female', age:30, height:170, weight:65, goal:'balance', waterGoalMl: 2000, lang:'ru'
  })

  // --- Water tracker ---
  const [today,setToday] = useLocalState('lumo.water.today', {
    date: new Date().toISOString().slice(0,10), ml: 0, step: 250
  })
  useEffect(()=>{
    const d = new Date().toISOString().slice(0,10)
    if (today.date !== d) setToday({date:d, ml:0, step: today.step})
  }, []) // сброс ежедневно

  const progress = Math.min(1, today.ml / (profile.waterGoalMl||2000))
  const waterMood = progress >= 1 ? 'shine' : (new Date().getHours() >= 19 && progress < 0.6 ? 'sad' : 'smile')

  function addWater(ml){ setToday(t => ({...t, ml: t.ml + ml})) }

  // --- Meals tracker ---
  const [meals,setMeals] = useLocalState('lumo.meals', {
    date: new Date().toISOString().slice(0,10),
    breakfast: false, lunch:false, dinner:false, snack:false
  })
  useEffect(()=>{
    const d = new Date().toISOString().slice(0,10)
    if (meals.date !== d) setMeals({date:d, breakfast:false, lunch:false, dinner:false, snack:false})
  },[])

  const [mood,setMood] = useState('smile')
  function markMeal(type){
    setMeals(m => ({...m, [type]: !m[type]}))
    const map = { breakfast:'chef', lunch:'soup', dinner:'tea', snack:'smile' }
    setMood(map[type] || 'smile')
    setTimeout(()=> setMood(waterMood), 1500)
  }

  // --- Tips (совет дня) ---
  const tips = useMemo(()=>[
    {title:'Совет дня', body:'Начни день со стакана воды — это ускорит пробуждение и поможет контролировать аппетит.'},
    {title:'Совет дня', body:'Не бойся углеводов: цельные крупы и фрукты дают энергию и клетчатку.'},
    {title:'Совет дня', body:'Если отекаешь — проверь соль: уменьшение соли часто даёт быстрый эффект.'}
  ],[])
  const tipIdx = (new Date().getFullYear()*1000 + new Date().getMonth()*50 + new Date().getDate()) % tips.length
  const tip = tips[tipIdx]

  // --- Tabs ---
  const [tab,setTab] = useLocalState('lumo.tab', 'dashboard')

  // --- Telegram MainButton: «Сохранить прогресс» в чат
  useEffect(()=>{
    if(!tg) return
    const text = [
      `🐰 Lumo — отчёт за сегодня`,
      `Вода: ${today.ml} мл / ${profile.waterGoalMl} мл`,
      `Приёмы пищи: 🥣 ${meals.breakfast?'✅':'—'} 🍲 ${meals.lunch?'✅':'—'} 🍽️ ${meals.dinner?'✅':'—'} 🍎 ${meals.snack?'✅':'—'}`
    ].join('\n')
    tg.MainButton.setParams({ text:'Сохранить прогресс', is_active:true, is_visible:true, color:'#EA9CAF' })
    const onClick = ()=> tg.sendData(text)
    tg.onEvent('mainButtonClicked', onClick)
    return ()=> tg.offEvent('mainButtonClicked', onClick)
  }, [today,meals,profile])

  return (
    <div className="min-h-screen px-4 py-3" style={{background:'#F3EEF1'}}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Lumo</div>
        <div className="text-sm text-black/60">Нутри-ассистент</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <TabButton active={tab==='dashboard'} onClick={()=>setTab('dashboard')}>Главная</TabButton>
        <TabButton active={tab==='meals'}     onClick={()=>setTab('meals')}>Питание</TabButton>
        <TabButton active={tab==='knowledge'} onClick={()=>setTab('knowledge')}>Знания</TabButton>
        <TabButton active={tab==='profile'}   onClick={()=>setTab('profile')}>Профиль</TabButton>
      </div>

      {tab==='dashboard' && (
        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="flex flex-col items-center gap-2">
            <Bunny mood={waterMood} />
            <div className="text-black/70">Вода за сегодня</div>
            <CircleProgress value={progress} color="#C2DC80" />
            <div className="text-xl font-semibold">{today.ml} / {profile.waterGoalMl} мл</div>
            <button
              className="mt-3 px-5 py-3 rounded-full text-white font-medium"
              style={{background:'#EA9CAF'}}
              onClick={()=> addWater(today.step)}>
              + Стакан (+{today.step} мл)
            </button>
            <button className="mt-2 text-sm underline text-black/60" onClick={()=> setTab('profile')}>Настроить шаг и цель</button>
          </div>

          <div className="mt-6 p-3 rounded-xl" style={{background:'#C2DC8033'}}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">👍🐰</div>
              <div>
                <div className="text-sm font-semibold">{tip.title}</div>
                <div className="text-sm opacity-80">{tip.body}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='meals' && (
        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="flex flex-col items-center gap-3">
            <Bunny mood={mood} />
            <div className="grid grid-cols-2 gap-3 w-full">
              <button className="p-4 rounded-2xl bg-lumoPink text-white font-semibold" onClick={()=>markMeal('breakfast')}>
                Завтрак {meals.breakfast?'✅':''}
              </button>
              <button className="p-4 rounded-2xl bg-lumoBerry text-white font-semibold" onClick={()=>markMeal('lunch')}>
                Обед {meals.lunch?'✅':''}
              </button>
              <button className="p-4 rounded-2xl bg-lumoGreen text-black font-semibold" onClick={()=>markMeal('dinner')}>
                Ужин {meals.dinner?'✅':''}
              </button>
              <button className="p-4 rounded-2xl bg-white border border-black/10 font-semibold" onClick={()=>markMeal('snack')}>
                Перекус {meals.snack?'✅':''}
              </button>
            </div>
            <div className="text-sm text-black/60">Пропустила приём? Нажми ещё раз, чтобы снять отметку.</div>
          </div>
        </div>
      )}

      {tab==='knowledge' && (
        <div className="bg-white rounded-2xl p-4 shadow grid gap-3">
          {[
            {k:'water', title:'Вода', icon:'💧🐰'},
            {k:'protein', title:'Белки', icon:'🏋️🐰'},
            {k:'fat', title:'Жиры', icon:'🥑🐰'},
            {k:'carb', title:'Углеводы', icon:'🍞🐰'},
            {k:'when', title:'Когда есть', icon:'⏰🐰'},
            {k:'how', title:'Как считать еду', icon:'📏🐰'},
            {k:'cheat', title:'Читмил', icon:'🍔🐰'},
            {k:'edema', title:'Отеки', icon:'🧂🐰'}
          ].map(item=>(
            <details key={item.k} className="rounded-xl border border-black/10 p-3">
              <summary className="cursor-pointer flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.title}</span>
              </summary>
              <div className="mt-2 text-sm text-black/75 leading-relaxed">
                (Тут будет статья: добавим тексты из файлов/бэкенда. Пока — заглушка для MVP 0.)
              </div>
            </details>
          ))}
        </div>
      )}

      {tab==='profile' && (
        <div className="bg-white rounded-2xl p-4 shadow grid gap-3">
          <div className="flex items-center gap-3">
            <Bunny mood="smile" />
            <div className="font-semibold">Профиль</div>
          </div>
          <label className="grid gap-1 text-sm">
            Имя
            <input className="p-3 rounded-xl border" value={profile.name} onChange={e=>setProfile({...profile, name:e.target.value})}/>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">Цель
              <select className="p-3 rounded-xl border" value={profile.goal} onChange={e=>setProfile({...profile, goal:e.target.value})}>
                <option value="loss">Похудение</option>
                <option value="gain">Набор</option>
                <option value="balance">Баланс</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Шаг стакана (мл)
              <input type="number" className="p-3 rounded-xl border" value={today.step}
                onChange={e=>setToday({...today, step: Math.max(50, Number(e.target.value||0))})}/>
            </label>
            <label className="grid gap-1 text-sm">Дневная цель воды (мл)
              <input type="number" className="p-3 rounded-xl border" value={profile.waterGoalMl}
                onChange={e=>setProfile({...profile, waterGoalMl: Math.max(500, Number(e.target.value||0))})}/>
            </label>
            <label className="grid gap-1 text-sm">Язык
              <select className="p-3 rounded-xl border" value={profile.lang} onChange={e=>setProfile({...profile, lang:e.target.value})}>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          <div className="text-sm text-black/60">Пол, возраст, рост, вес добавим в онбординге — сейчас не критично для MVP 0.</div>
        </div>
      )}

      <div className="h-6"></div>
    </div>
  )
}
