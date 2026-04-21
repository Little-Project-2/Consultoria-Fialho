/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║      CONSULTORIA FIALHO — Plataforma Digital de Assessoria v4           ║
 * ║  Login Persistente · Sync 5s · Dieta · RIR · Swap Inteligente           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Users, ChevronLeft, Plus, Trash2, Edit2, Save, X,
  CheckCircle2, AlertCircle, Droplets, Target, Calendar,
  Dumbbell, Leaf, Camera, Link2, TrendingUp, Clock,
  Activity, BarChart3, Settings, Eye, LogOut,
  ChevronRight, Zap, Search, Play,
  PlusCircle, Info, RefreshCcw,
  Utensils, ChevronDown, ChevronUp, Sliders,
  Lock, Copy, ArrowLeftRight, Shield, Flame, Weight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITÁRIOS
   ═══════════════════════════════════════════════════════════════════════════ */

function uid() { return Math.random().toString(36).substring(2, 9); }
const calcHydrationMl = (w) => Math.round(w * 0.45 * 1000);
const calcHydrationL  = (w) => (w * 0.45).toFixed(2);
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 1 — PROTOCOLO DE CUTTING (6 MESES)
   ═══════════════════════════════════════════════════════════════════════════ */

const CUTTING_PHASES = [
  {
    month: 1, name: "Low Fat", tag: "Alto Carboidrato", accent: "#60A5FA",
    tw: { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/25" },
    description: "Fase de adaptação metabólica. Carboidratos altos mantêm a performance enquanto a gordura é minimizada.",
    deficit: 350, macroRatios: { protein: 0.30, carbs: 0.55, fat: 0.15 }, cardioMin: 20, carbCycle: null,
    tips: ["Priorize carboidratos complexos (arroz, batata, aveia)", "Distribua refeições a cada 3h", "Evite gorduras saturadas"],
  },
  {
    month: 2, name: "QPC", tag: "Proteína Alta · Carbo Médio", accent: "#A78BFA",
    tw: { text: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/25" },
    description: "Proteína elevada para preservação muscular durante déficit mais agressivo.",
    deficit: 500, macroRatios: { protein: 0.40, carbs: 0.35, fat: 0.25 }, cardioMin: 30, carbCycle: null,
    tips: ["Aumente fontes de proteína magra (frango, peixe, ovos)", "Cardio em jejum 3×/semana", "BCAA recomendado"],
  },
  {
    month: 3, name: "QPC Avançado", tag: "Proteína Máxima", accent: "#8B5CF6",
    tw: { text: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/25" },
    description: "Intensificação da fase QPC. Proteína no pico para preservação máxima.",
    deficit: 600, macroRatios: { protein: 0.45, carbs: 0.25, fat: 0.30 }, cardioMin: 35, carbCycle: null,
    tips: ["Proteína até 2.5g/kg", "Carbo apenas pré e pós-treino", "Caseína à noite"],
  },
  {
    month: 4, name: "Low Carb", tag: "Foco Total em Cardio", accent: "#FB923C",
    tw: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/25" },
    description: "Redução drástica de carboidratos com intensificação do cardio.",
    deficit: 700, macroRatios: { protein: 0.40, carbs: 0.20, fat: 0.40 }, cardioMin: 45, carbCycle: null,
    tips: ["Carbo apenas pós-treino pesado", "Cardio LISS 45-60min diário", "Gorduras boas (abacate, azeite)"],
  },
  {
    month: 5, name: "Carb Cycling", tag: "5 Dias Baixo / 2 Dias Alto", accent: "#34D399",
    tw: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25" },
    description: "Ciclagem de carboidratos 5/2 para manter o metabolismo ativo.",
    deficit: 500, macroRatios: { protein: 0.38, carbs: 0.32, fat: 0.30 }, cardioMin: 40,
    carbCycle: { lowDays: 5, highDays: 2 },
    lowDayRatios:  { protein: 0.42, carbs: 0.18, fat: 0.40 },
    highDayRatios: { protein: 0.30, carbs: 0.55, fat: 0.15 },
    tips: ["Dias altos: treinos de força pesados", "Dias baixos: cardio e treinos leves"],
  },
  {
    month: 6, name: "Carb Cycling Intenso", tag: "6 Dias Baixo / 1 Dia Alto", accent: "#F87171",
    tw: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/25" },
    description: "Fase final. Apenas 1 dia de recarga semanal para manter o metabolismo.",
    deficit: 650, macroRatios: { protein: 0.40, carbs: 0.28, fat: 0.32 }, cardioMin: 50,
    carbCycle: { lowDays: 6, highDays: 1 },
    lowDayRatios:  { protein: 0.45, carbs: 0.12, fat: 0.43 },
    highDayRatios: { protein: 0.28, carbs: 0.60, fat: 0.12 },
    tips: ["Dia alto no treino mais intenso da semana", "Eletrólitos obrigatórios", "Fotos de progresso semanais"],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 2 — BANCO DE ALIMENTOS (ampliado)
   gpu = gramas por unidade padrão  |  kcal/p/c/f = por 100g
   ═══════════════════════════════════════════════════════════════════════════ */

const FOOD_DB = [
  // ── Proteínas ────────────────────────────────────────────────────────────
  { id:"ovo_inteiro",   name:"Ovo Inteiro",          cat:"Proteína",    unit:"un",    gpu:50,   kcal:155, p:12.6, c:1.1,  f:10.6 },
  { id:"clara_ovo",     name:"Clara de Ovo",          cat:"Proteína",    unit:"un",    gpu:30,   kcal:52,  p:10.9, c:0.7,  f:0.2  },
  { id:"frango_grelh",  name:"Frango Grelhado",       cat:"Proteína",    unit:"100g",  gpu:100,  kcal:165, p:31.0, c:0.0,  f:3.6  },
  { id:"carne_patinho", name:"Carne (Patinho)",        cat:"Proteína",    unit:"100g",  gpu:100,  kcal:137, p:21.5, c:0.0,  f:5.5  },
  { id:"tilapia",       name:"Tilápia Grelhada",       cat:"Proteína",    unit:"100g",  gpu:100,  kcal:128, p:26.0, c:0.0,  f:2.7  },
  { id:"atum_lata",     name:"Atum em Lata",           cat:"Proteína",    unit:"100g",  gpu:100,  kcal:128, p:28.6, c:0.0,  f:1.4  },
  { id:"whey",          name:"Whey Protein",           cat:"Suplemento",  unit:"scoop", gpu:30,   kcal:120, p:24.0, c:3.0,  f:2.0  },
  // ── Carboidratos ─────────────────────────────────────────────────────────
  { id:"pao_frances",   name:"Pão Francês",            cat:"Cereais",     unit:"un",    gpu:50,   kcal:300, p:9.4,  c:58.6, f:1.4  },
  { id:"pao_integral",  name:"Pão Integral",           cat:"Cereais",     unit:"fatia", gpu:25,   kcal:243, p:9.5,  c:48.3, f:2.5  },
  { id:"pao_forma",     name:"Pão de Forma",           cat:"Cereais",     unit:"fatia", gpu:25,   kcal:266, p:8.7,  c:50.0, f:3.1  },
  { id:"arroz_branco",  name:"Arroz Branco Cozido",    cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:130, p:2.5,  c:28.0, f:0.2  },
  { id:"arroz_integral",name:"Arroz Integral Cozido",  cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:124, p:2.6,  c:25.8, f:1.0  },
  { id:"feijao",        name:"Feijão Carioca Cozido",  cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:76,  p:4.8,  c:13.6, f:0.5  },
  { id:"batata_doce",   name:"Batata Doce Cozida",     cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:77,  p:0.6,  c:18.4, f:0.1  },
  { id:"batata_ingl",   name:"Batata Inglesa Cozida",  cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:52,  p:1.2,  c:11.9, f:0.0  },
  { id:"macarrao",      name:"Macarrão Cozido",         cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:158, p:5.8,  c:31.0, f:0.9  },
  { id:"mandioca",      name:"Mandioca Cozida",         cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:125, p:0.6,  c:30.0, f:0.3  },
  { id:"cuscuz",        name:"Cuscuz de Milho",         cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:113, p:2.2,  c:25.0, f:0.6  },
  { id:"aveia",         name:"Aveia em Flocos",         cat:"Carboidrato", unit:"100g",  gpu:100,  kcal:394, p:13.9, c:66.6, f:8.5  },
  { id:"banana_prata",  name:"Banana Prata",            cat:"Carboidrato", unit:"un",    gpu:80,   kcal:98,  p:1.3,  c:25.9, f:0.1  },
  // ── Frutas ───────────────────────────────────────────────────────────────
  { id:"limao",         name:"Limão",                   cat:"Fruta",       unit:"100g",  gpu:100,  kcal:29,  p:1.1,  c:9.3,  f:0.3  },
  { id:"melancia",      name:"Melancia",                cat:"Fruta",       unit:"100g",  gpu:100,  kcal:30,  p:0.6,  c:7.5,  f:0.1  },
  { id:"lima",          name:"Lima da Pérsia",           cat:"Fruta",       unit:"100g",  gpu:100,  kcal:30,  p:0.7,  c:10.5, f:0.2  },
  { id:"acerola",       name:"Acerola",                  cat:"Fruta",       unit:"100g",  gpu:100,  kcal:32,  p:0.4,  c:7.7,  f:0.3  },
  { id:"morango",       name:"Morango",                  cat:"Fruta",       unit:"100g",  gpu:100,  kcal:32,  p:0.7,  c:7.7,  f:0.3  },
  { id:"toranja",       name:"Toranja",                  cat:"Fruta",       unit:"100g",  gpu:100,  kcal:32,  p:0.6,  c:8.1,  f:0.1  },
  { id:"carambola",     name:"Carambola",                cat:"Fruta",       unit:"100g",  gpu:100,  kcal:31,  p:1.0,  c:6.7,  f:0.3  },
  { id:"laranja_pera",  name:"Laranja Pera",             cat:"Fruta",       unit:"100g",  gpu:100,  kcal:37,  p:0.6,  c:9.7,  f:0.1  },
  { id:"ameixa",        name:"Ameixa",                   cat:"Fruta",       unit:"100g",  gpu:100,  kcal:46,  p:0.7,  c:11.4, f:0.3  },
  { id:"abacaxi",       name:"Abacaxi",                  cat:"Fruta",       unit:"100g",  gpu:100,  kcal:48,  p:0.5,  c:12.6, f:0.1  },
  { id:"mamao",         name:"Mamão Papaia",             cat:"Fruta",       unit:"100g",  gpu:100,  kcal:46,  p:0.4,  c:11.6, f:0.1  },
  { id:"nespera",       name:"Nêspera",                  cat:"Fruta",       unit:"100g",  gpu:100,  kcal:47,  p:0.4,  c:12.1, f:0.2  },
  { id:"nectarina",     name:"Nectarina",                cat:"Fruta",       unit:"100g",  gpu:100,  kcal:44,  p:1.1,  c:10.6, f:0.3  },
  { id:"pessego",       name:"Pêssego",                  cat:"Fruta",       unit:"100g",  gpu:100,  kcal:39,  p:0.9,  c:9.5,  f:0.3  },
  { id:"maca",          name:"Maçã",                     cat:"Fruta",       unit:"un",    gpu:150,  kcal:52,  p:0.3,  c:13.8, f:0.2  },
  { id:"framboesa",     name:"Framboesa",                cat:"Fruta",       unit:"100g",  gpu:100,  kcal:52,  p:1.2,  c:11.9, f:0.7  },
  { id:"mexerica",      name:"Mexerica",                 cat:"Fruta",       unit:"100g",  gpu:100,  kcal:52,  p:0.8,  c:13.3, f:0.3  },
  { id:"pitaya",        name:"Pitaya",                   cat:"Fruta",       unit:"100g",  gpu:100,  kcal:51,  p:0.8,  c:12.4, f:0.4  },
  { id:"kiwi",          name:"Kiwi",                     cat:"Fruta",       unit:"100g",  gpu:100,  kcal:61,  p:1.1,  c:14.7, f:0.5  },
  { id:"mirtilo",       name:"Mirtilo (Blueberry)",      cat:"Fruta",       unit:"100g",  gpu:100,  kcal:57,  p:0.7,  c:14.5, f:0.3  },
  { id:"lichia",        name:"Lichia",                   cat:"Fruta",       unit:"100g",  gpu:100,  kcal:66,  p:0.8,  c:16.5, f:0.4  },
  { id:"manga",         name:"Manga",                    cat:"Fruta",       unit:"100g",  gpu:100,  kcal:65,  p:0.5,  c:17.0, f:0.3  },
  { id:"uva_italia",    name:"Uva Itália",               cat:"Fruta",       unit:"100g",  gpu:100,  kcal:68,  p:0.7,  c:17.9, f:0.2  },
  { id:"roma",          name:"Romã",                     cat:"Fruta",       unit:"100g",  gpu:100,  kcal:68,  p:1.0,  c:17.2, f:0.3  },
  { id:"goiaba",        name:"Goiaba",                   cat:"Fruta",       unit:"100g",  gpu:100,  kcal:68,  p:2.6,  c:14.3, f:2.6  },
  { id:"caqui",         name:"Caqui",                    cat:"Fruta",       unit:"100g",  gpu:100,  kcal:70,  p:0.6,  c:18.6, f:0.2  },
  { id:"figo",          name:"Figo",                     cat:"Fruta",       unit:"100g",  gpu:100,  kcal:74,  p:0.8,  c:19.2, f:0.3  },
  { id:"banana_nanica", name:"Banana Nanica",            cat:"Fruta",       unit:"100g",  gpu:100,  kcal:92,  p:1.1,  c:23.6, f:0.3  },
  { id:"maracuja",      name:"Maracujá",                 cat:"Fruta",       unit:"100g",  gpu:100,  kcal:97,  p:2.2,  c:23.4, f:0.7  },
  { id:"abacate",       name:"Abacate",                  cat:"Fruta",       unit:"100g",  gpu:100,  kcal:160, p:2.0,  c:8.5,  f:14.7 },
  { id:"coco",          name:"Coco (Fresco)",            cat:"Fruta",       unit:"100g",  gpu:100,  kcal:354, p:3.3,  c:15.2, f:33.5 },
  // ── Oleaginosas ──────────────────────────────────────────────────────────
  { id:"avela",         name:"Avelã (Seca)",             cat:"Oleaginosa",  unit:"100g",  gpu:100,  kcal:628, p:15.0, c:16.7, f:60.8 },
  { id:"amendoa",       name:"Amêndoa (Seca)",           cat:"Oleaginosa",  unit:"100g",  gpu:100,  kcal:578, p:21.3, c:19.7, f:49.6 },
  { id:"amendoim",      name:"Amendoim",                 cat:"Oleaginosa",  unit:"100g",  gpu:100,  kcal:567, p:25.8, c:16.1, f:49.0 },
  // ── Laticínios ───────────────────────────────────────────────────────────
  { id:"leite_integral",name:"Leite Integral",           cat:"Laticínio",   unit:"100ml", gpu:100,  kcal:61,  p:3.2,  c:4.5,  f:3.3  },
  { id:"iogurte",       name:"Iogurte Natural",          cat:"Laticínio",   unit:"100g",  gpu:100,  kcal:61,  p:3.5,  c:4.7,  f:3.0  },
  { id:"queijo_minas",  name:"Queijo Minas Frescal",     cat:"Laticínio",   unit:"100g",  gpu:100,  kcal:264, p:17.4, c:3.0,  f:20.2 },
  { id:"mussarela",     name:"Mussarela",                cat:"Laticínio",   unit:"fatia", gpu:20,   kcal:280, p:21.0, c:2.2,  f:20.0 },
  // ── Gorduras ─────────────────────────────────────────────────────────────
  { id:"azeite",        name:"Azeite de Oliva",          cat:"Gordura",     unit:"col",   gpu:13.5, kcal:884, p:0.0,  c:0.0,  f:100  },
  // ── Vegetais ─────────────────────────────────────────────────────────────
  { id:"tomate",        name:"Tomate",                   cat:"Vegetal",     unit:"100g",  gpu:100,  kcal:18,  p:0.9,  c:3.9,  f:0.2  },
  { id:"brocolis",      name:"Brócolis Cozido",          cat:"Vegetal",     unit:"100g",  gpu:100,  kcal:35,  p:2.4,  c:5.1,  f:0.4  },
  { id:"alface",        name:"Alface",                   cat:"Vegetal",     unit:"100g",  gpu:100,  kcal:12,  p:1.3,  c:1.7,  f:0.2  },
  // ── Outros ───────────────────────────────────────────────────────────────
  { id:"mel",           name:"Mel",                      cat:"Outros",      unit:"col",   gpu:10,   kcal:304, p:0.3,  c:82.0, f:0.0  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 3 — TEMPLATE DE TREINO Push/Pull/Legs
   ═══════════════════════════════════════════════════════════════════════════ */

const mkExercise = (name, sets, reps) => ({
  id: uid(), name, sets, reps,
  intensity: 0,
  weightUsed: "",
  repsDone: "",
  rirValue: null,                                   // legado
  prescribedRir: Array(Number(sets)).fill(null),    // ADM define por série
  rirPerSet: Array(Number(sets)).fill(null),        // Aluno registra por série
  studentNote: "",
  videoLink: "",
});

const DEFAULT_WORKOUT = [
  { id: uid(), dayName: "Push", subtitle: "Peito · Ombro · Tríceps",
    exercises: [
      mkExercise("Supino Reto com Barra", 4, "8-10"),
      mkExercise("Supino Inclinado com Halteres", 3, "10-12"),
      mkExercise("Desenvolvimento com Halteres", 3, "10-12"),
      mkExercise("Elevação Lateral", 3, "12-15"),
      mkExercise("Tríceps Corda no Pulley", 3, "12-15"),
    ],
  },
  { id: uid(), dayName: "Pull", subtitle: "Costas · Bíceps",
    exercises: [
      mkExercise("Remada Curvada com Barra", 4, "8-10"),
      mkExercise("Puxada Alta (Lat Pulldown)", 3, "10-12"),
      mkExercise("Remada Unilateral com Halter", 3, "10-12"),
      mkExercise("Rosca Direta com Barra", 3, "10-12"),
      mkExercise("Rosca Martelo", 3, "12"),
    ],
  },
  { id: uid(), dayName: "Legs", subtitle: "Quadríceps · Posterior · Panturrilha",
    exercises: [
      mkExercise("Agachamento Livre com Barra", 4, "8-10"),
      mkExercise("Leg Press 45°", 3, "12-15"),
      mkExercise("Cadeira Extensora", 3, "12-15"),
      mkExercise("Stiff com Barra", 3, "10-12"),
      mkExercise("Panturrilha em Pé na Máquina", 4, "15-20"),
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 4 — GERAÇÃO DE DIETA E CRIAÇÃO DE ALUNO
   ═══════════════════════════════════════════════════════════════════════════ */

function generateDiet(weight, tdee) {
  return CUTTING_PHASES.map((phase) => {
    const cal = Math.max(Math.round(tdee - phase.deficit), 1200);
    const p = Math.round((cal * phase.macroRatios.protein) / 4);
    const c = Math.round((cal * phase.macroRatios.carbs) / 4);
    const f = Math.round((cal * phase.macroRatios.fat) / 9);
    let lowDay = null, highDay = null;
    if (phase.lowDayRatios) {
      lowDay  = { calories: Math.round(cal * 0.85), protein: Math.round((cal*0.85*phase.lowDayRatios.protein)/4),  carbs: Math.round((cal*0.85*phase.lowDayRatios.carbs)/4),  fat: Math.round((cal*0.85*phase.lowDayRatios.fat)/9) };
      highDay = { calories: Math.round(cal * 1.15), protein: Math.round((cal*1.15*phase.highDayRatios.protein)/4), carbs: Math.round((cal*1.15*phase.highDayRatios.carbs)/4), fat: Math.round((cal*1.15*phase.highDayRatios.fat)/9) };
    }
    return { month: phase.month, calories: cal, protein: p, carbs: c, fat: f, cardioMin: phase.cardioMin, customNotes: "", isEdited: false, lowDay, highDay };
  });
}

function createStudent(overrides = {}) {
  const weight = overrides.weight || 80;
  const tdee   = overrides.tdee || Math.round(weight * 33);
  const base = {
    id: uid(), name: "Novo Aluno", age: 25, weight, goal: "Definição muscular",
    planMonths: 6, trainingMonths: 0, paymentStatus: "pending",
    currentDietMonth: 1, tdee, gallery: [],
    password: "aluno123",
    lastUpdated: new Date().toISOString(),
    avatarColor: `hsl(${Math.random() * 360 | 0},60%,50%)`,
    workout: JSON.parse(JSON.stringify(DEFAULT_WORKOUT)).map(d => ({
      ...d, id: uid(), exercises: d.exercises.map(e => ({ ...e, id: uid() })),
    })),
    diet: null, mealPlan: {},
  };
  const student = { ...base, ...overrides };
  if (!student.diet) student.diet = generateDiet(student.weight, student.tdee);
  if (!student.mealPlan) student.mealPlan = {};
  return student;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 5 — HOOK useSharedStorage (window.storage com sync automático 5s)
   ═══════════════════════════════════════════════════════════════════════════ */

function useSharedStorage(key, initial) {
  const [state, setState] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(key, true);
        if (result?.value) setState(JSON.parse(result.value));
      } catch {}
      setLoaded(true);
    })();

    // Poll every 5 seconds for real-time sync between admin and student
    const interval = setInterval(async () => {
      try {
        const result = await window.storage.get(key, true);
        if (result?.value) setState(JSON.parse(result.value));
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [key]);

  const set = useCallback((valOrFn) => {
    setState(prev => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      (async () => {
        try { await window.storage.set(key, JSON.stringify(next), true); }
        catch (e) { console.error("Storage error:", e); }
      })();
      return next;
    });
  }, [key]);

  return [state, set, loaded];
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 6 — COMPONENTES REUTILIZÁVEIS
   ═══════════════════════════════════════════════════════════════════════════ */

function PaymentBadge({ status, onToggle }) {
  const paid = status === "paid";
  return (
    <button onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 hover:opacity-80
        ${paid ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30" : "bg-red-400/10 text-red-400 border-red-400/30"}`}>
      {paid ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
      {paid ? "Pago" : "Pendente"}
    </button>
  );
}

function Avatar({ name, color, size = "md" }) {
  const sz = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-sm";
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`${sz} rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0`}
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function MacroBar({ label, value, unit = "g", color, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* RIR Selector — Repetições em Reserva (0 = falha, 4+ = muito fácil) */
function RIRSelector({ value, onChange }) {
  const opts = [
    { v: 0, label: "0",  desc: "Falha",        color: "#F87171" },
    { v: 1, label: "1",  desc: "1 sobrando",   color: "#FB923C" },
    { v: 2, label: "2",  desc: "2 sobrando",   color: "#FBBF24" },
    { v: 3, label: "3",  desc: "3 sobrando",   color: "#A3E635" },
    { v: 4, label: "4+", desc: "Muito fácil",  color: "#34D399" },
  ];
  const selected = opts.find(o => o.v === value);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {opts.map(({ v, label, color }) => (
          <button key={v} onClick={() => onChange(value === v ? null : v)}
            className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all active:scale-95`}
            style={value === v
              ? { backgroundColor: color + "25", borderColor: color + "60", color }
              : { backgroundColor: "rgba(31,41,55,1)", borderColor: "rgba(55,65,81,1)", color: "#6b7280" }}>
            {label}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs font-bold text-center" style={{ color: selected.color }}>
          RIR {selected.v} — {selected.desc}
        </p>
      )}
    </div>
  );
}

function IntensitySelector({ value, onChange, readonly }) {
  const configs = [
    { n: 1, label: "Leve",     bg: "bg-blue-400/20",   border: "border-blue-400/50",   text: "text-blue-400"   },
    { n: 2, label: "Moderado", bg: "bg-amber-400/20",  border: "border-amber-400/50",  text: "text-amber-400"  },
    { n: 3, label: "Intenso",  bg: "bg-red-400/20",    border: "border-red-400/50",    text: "text-red-400"    },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {configs.map(({ n, label, bg, border, text }) => (
        <button key={n} disabled={readonly} onClick={() => !readonly && onChange(value === n ? 0 : n)}
          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all
            ${value >= n ? `${bg} ${border} ${text}` : "bg-gray-900 border-gray-800 text-gray-700"}
            ${!readonly ? "hover:opacity-80 cursor-pointer active:scale-95" : "cursor-default"}`}>
          {n}
        </button>
      ))}
      {value > 0 && <span className={`text-xs font-medium ${configs[value-1]?.text}`}>{configs[value-1]?.label}</span>}
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, min, max, note, step }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>}
      <input type={type} value={value} step={step}
        onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder} min={min} max={max}
        className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600
          focus:outline-none focus:border-cyan-500/50 transition-colors" />
      {note && <p className="text-xs text-gray-700">{note}</p>}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed top-5 left-1/2 z-[200] pointer-events-none"
      style={{ transform: "translateX(-50%)", animation: "toastIn .3s cubic-bezier(.34,1.3,.64,1)" }}>
      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border bg-emerald-950/90 border-emerald-700/40
        text-emerald-300 text-sm font-bold shadow-2xl whitespace-nowrap backdrop-blur-sm">
        <CheckCircle2 size={15} /> {msg}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 7 — TELA DE LOGIN (Consultoria Fialho)
   ═══════════════════════════════════════════════════════════════════════════ */

function LoginScreen({ students, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");
    const u = username.trim();
    if (u === "Diego Fialho" && password === "777") {
      onLogin({ role: "admin" }); return;
    }
    const student = students.find(s =>
      s.name.toLowerCase() === u.toLowerCase() && s.password === password
    );
    if (student) { onLogin({ role: "student", studentId: student.id }); return; }
    setError("Usuário ou senha incorretos.");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,211,238,0.12) 0%, #030712 70%)" }}>

      <div className="mb-10 text-center select-none">
        <div className="relative mx-auto mb-5" style={{ width: 88, height: 88 }}>
          <div className="absolute inset-0 rounded-3xl blur-xl opacity-40"
            style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }} />
          <div className="relative w-full h-full rounded-3xl flex items-center justify-center text-2xl font-black text-white"
            style={{ background: "linear-gradient(135deg,#22D3EE 0%,#34D399 100%)" }}>
            CF
          </div>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight leading-none">Consultoria Fialho</h1>
        <p className="text-gray-500 text-sm mt-2 font-medium">Assessoria Nutricional & Fitness</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          {["🏋️ Treino","🥗 Nutrição","📈 Evolução"].map(t => (
            <span key={t} className="text-xs text-gray-700 px-2 py-1 rounded-full bg-gray-900 border border-gray-800">{t}</span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-7 shadow-2xl backdrop-blur-sm"
          style={{ boxShadow: "0 0 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
              <Lock size={14} className="text-cyan-400" />
            </div>
            <h2 className="text-base font-black text-white">Acessar plataforma</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Usuário</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Seu nome completo"
                className="w-full bg-gray-800/60 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-100
                  placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Senha</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="••••••"
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-100
                    placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 transition-all pr-12" />
                <button onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 text-xs font-bold px-1 py-0.5 rounded">
                  {showPwd ? "ocultar" : "ver"}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-400/10 border border-red-400/20 text-red-400 text-xs font-bold">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <button onClick={handleLogin}
              className="w-full py-4 rounded-2xl font-black text-sm text-gray-950 hover:opacity-90 active:scale-[.98] transition-all mt-1"
              style={{ background: "linear-gradient(135deg,#22D3EE 0%,#34D399 100%)" }}>
              Entrar →
            </button>
          </div>
        </div>

        <p className="text-gray-700 text-xs text-center mt-6">
          Consultoria Fialho · Plataforma Digital © 2025
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 8 — ADMIN APP (wrapper com estado de navegação)
   ═══════════════════════════════════════════════════════════════════════════ */

function AdminApp({ students, setStudents, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedId) || null, [students, selectedId]);

  const showToast = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(null), 3000);
  }, []);

  const handleUpdateStudent = useCallback((updated) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    showToast("Alterações salvas!");
  }, [setStudents, showToast]);

  const handleAddStudent = useCallback((student) => {
    setStudents(prev => [...prev, student]);
    setSelectedId(student.id); setView("profile");
    showToast(`Aluno "${student.name}" criado!`);
  }, [setStudents, showToast]);

  const handleDeleteStudent = useCallback((id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setView("dashboard"); setSelectedId(null);
    showToast("Aluno removido.");
  }, [setStudents, showToast]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Toast msg={toast} />
      {view === "dashboard" && (
        <AdminDashboard students={students} onSelect={(id) => { setSelectedId(id); setView("profile"); }}
          onAddStudent={handleAddStudent} onLogout={onLogout} />
      )}
      {view === "profile" && selectedStudent && (
        <StudentProfile student={selectedStudent} onUpdate={handleUpdateStudent}
          onBack={() => setView("dashboard")}
          onDelete={() => handleDeleteStudent(selectedStudent.id)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 9 — DASHBOARD DO ADMINISTRADOR
   ═══════════════════════════════════════════════════════════════════════════ */

function AdminDashboard({ students, onSelect, onAddStudent, onLogout }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "", age: 25, weight: 80, goal: "Definição muscular",
    tdee: 2640, trainingMonths: 0, planMonths: 6, password: "aluno123",
  });

  const filtered = useMemo(() =>
    students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())), [students, search]);

  const handleAdd = () => {
    if (!newForm.name.trim()) return;
    onAddStudent(createStudent(newForm));
    setShowAdd(false);
    setNewForm({ name: "", age: 25, weight: 80, goal: "Definição muscular", tdee: 2640, trainingMonths: 0, planMonths: 6, password: "aluno123" });
  };

  const getShareableUrl = () => {
    // In artifact/iframe context, try to get the parent URL first
    try {
      if (window.location !== window.parent.location) {
        return document.referrer || window.location.href;
      }
    } catch {}
    return window.location.href;
  };

  const copyLink = () => {
    const url = getShareableUrl();
    // Método 1: Clipboard API moderna
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 3000); })
        .catch(() => fallbackCopy(url));
      return;
    }
    fallbackCopy(url);
  };

  const fallbackCopy = (text) => {
    try {
      // Método 2: execCommand (funciona em iframes e browsers antigos)
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) { setCopied(true); setTimeout(() => setCopied(false), 3000); return; }
    } catch {}
    // Método 3: Seleciona o input visível para o usuário copiar manualmente
    const input = document.getElementById("share-link-input");
    if (input) { input.focus(); input.select(); input.setSelectionRange(0, 99999); }
    setCopied(true); setTimeout(() => setCopied(false), 3000);
  };

  const paid = students.filter(s => s.paymentStatus === "paid").length;

  return (
    <div className="p-5 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <p className="text-xs font-bold tracking-[.2em] uppercase mb-0.5"
            style={{ background: "linear-gradient(90deg,#22D3EE,#34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CONSULTORIA FIALHO
          </p>
          <h1 className="text-2xl font-black text-white leading-none">Dashboard ADM</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLink(v => !v)}
            className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 hover:text-cyan-400 hover:border-cyan-400/30 transition-all">
            <Link2 size={15} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-gray-950 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>
            <Plus size={16} strokeWidth={3} /> Aluno
          </button>
          <button onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-600 hover:text-red-400 hover:border-red-400/30 transition-all">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Share Link Panel */}
      {showLink && (
        <div className="mb-4 bg-gray-900 border border-cyan-400/20 rounded-2xl p-4"
          style={{ boxShadow: "0 0 20px rgba(34,211,238,0.05)" }}>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Link2 size={12} /> Link de Acesso — Consultoria Fialho
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Envie este link para seus alunos. Sempre que você atualizar dieta ou treino, eles verão em até 5 segundos. A conta deles fica salva automaticamente após o primeiro login.
          </p>

          {/* Link visível e selecionável */}
          <div className="relative mb-2">
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-3">
              <Link2 size={12} className="text-cyan-400 flex-shrink-0" />
              <input
                id="share-link-input"
                readOnly
                value={getShareableUrl()}
                onFocus={e => { e.target.select(); e.target.setSelectionRange(0, 99999); }}
                onClick={e => { e.target.select(); e.target.setSelectionRange(0, 99999); }}
                className="text-xs text-cyan-300 flex-1 font-mono bg-transparent outline-none cursor-text"
                style={{ userSelect: "all", WebkitUserSelect: "all", MozUserSelect: "all" }}
              />
            </div>
            <p className="text-[10px] text-gray-700 mt-1 ml-1">↑ Toque no link para selecionar, depois segure e copie manualmente</p>
          </div>

          {/* Botão copiar robusto */}
          <button onClick={copyLink}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 mb-2"
            style={copied
              ? { background: "rgba(52,211,153,0.15)", color: "#34D399", border: "1px solid rgba(52,211,153,0.3)" }
              : { background: "linear-gradient(135deg,#22D3EE,#34D399)", color: "#030712" }}>
            {copied ? <><CheckCircle2 size={14}/> Copiado! Cole no WhatsApp 📲</> : <><Copy size={14}/> Copiar Link do App</>}
          </button>

          {/* Instruções para alunos */}
          <div className="bg-gray-800/60 rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-bold text-gray-400">📋 Como enviar para os alunos:</p>
            <p className="text-[10px] text-gray-600">1. Clique em <span className="text-gray-400 font-bold">Copiar Link</span> acima</p>
            <p className="text-[10px] text-gray-600">2. Cole no WhatsApp para o aluno</p>
            <p className="text-[10px] text-gray-600">3. O aluno abre o link no celular e faz login com o nome e senha que você cadastrou</p>
            <p className="text-[10px] text-gray-600">4. O app fica salvo e sincroniza automaticamente ✅</p>
          </div>
          <p className="text-xs text-gray-700 text-center mt-2">
            💡 Dica: use bit.ly para criar um link personalizado tipo "bit.ly/consultoriafialho"
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Alunos",   value: students.length,       color: "#22D3EE", icon: "👥" },
          { label: "Pagos",    value: paid,                   color: "#34D399", icon: "✅" },
          { label: "Pendente", value: students.length - paid, color: "#F87171", icon: "⚠️" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 rounded-2xl" style={{ background: color }} />
            <p className="text-xs mb-1">{icon}</p>
            <p className="text-2xl font-black leading-none mb-1" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar aluno..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-300
            placeholder-gray-700 focus:outline-none focus:border-gray-600 transition-colors" />
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-700">
            <p className="text-sm font-medium">Nenhum aluno encontrado</p>
          </div>
        )}
        {filtered.map(s => {
          const phase = CUTTING_PHASES[s.currentDietMonth - 1];
          return (
            <button key={s.id} onClick={() => onSelect(s.id)}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4
                hover:border-gray-700 hover:bg-gray-800/60 transition-all active:scale-[.99] text-left group">
              <Avatar name={s.name} color={s.avatarColor} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p className="text-sm font-bold text-gray-100 truncate">{s.name}</p>
                  <PaymentBadge status={s.paymentStatus} onToggle={() => {}} />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-600">{s.age} anos · {s.weight}kg</span>
                  {phase && <span className={`text-xs font-bold ${phase.tw.text}`}>{phase.name}</span>}
                </div>
                <p className="text-xs text-gray-700 mt-1 truncate">{s.goal}</p>
              </div>
              <ChevronRight size={16} className="text-gray-700 group-hover:text-gray-500 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Add Student Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl p-6"
            style={{ animation: "slideUp .3s cubic-bezier(.34,1.3,.64,1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-white mb-5">Novo Aluno</h3>
            <div className="space-y-4">
              <Field label="Nome Completo" value={newForm.name} onChange={v => setNewForm(f => ({ ...f, name: v }))} placeholder="Nome do aluno" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Idade" type="number" value={newForm.age} min={14} onChange={v => setNewForm(f => ({ ...f, age: v }))} />
                <Field label="Peso (kg)" type="number" value={newForm.weight} onChange={v => setNewForm(f => ({ ...f, weight: v, tdee: Math.round(v * 33) }))} />
              </div>
              <Field label="Objetivo" value={newForm.goal} onChange={v => setNewForm(f => ({ ...f, goal: v }))} />
              <Field label="TDEE (kcal/dia)" type="number" value={newForm.tdee} onChange={v => setNewForm(f => ({ ...f, tdee: v }))} />
              <Field label="Senha de Acesso" value={newForm.password} onChange={v => setNewForm(f => ({ ...f, password: v }))} placeholder="aluno123" />
              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-500 font-bold text-sm">Cancelar</button>
                <button onClick={handleAdd} disabled={!newForm.name.trim()}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-gray-950 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>Criar Aluno</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 10 — PERFIL DO ALUNO (Admin View)
   ═══════════════════════════════════════════════════════════════════════════ */

function StudentProfile({ student, onUpdate, onBack, onDelete }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "diet",     label: "Dieta",        icon: Target },
    { id: "meals",    label: "Refeições",     icon: Utensils },
    { id: "workout",  label: "Treino",        icon: Dumbbell },
    { id: "gallery",  label: "Galeria",       icon: Camera },
    { id: "settings", label: "Dados",         icon: Settings },
  ];

  const handleTogglePayment = () => onUpdate({ ...student, paymentStatus: student.paymentStatus === "paid" ? "pending" : "paid", lastUpdated: new Date().toISOString() });

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-950">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 sticky top-0 z-20 bg-gray-950/95 backdrop-blur-sm border-b border-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-all">
            <ChevronLeft size={18} />
          </button>
          <Avatar name={student.name} color={student.avatarColor} />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white leading-none truncate">{student.name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <PaymentBadge status={student.paymentStatus} onToggle={handleTogglePayment} />
              <span className="text-xs text-gray-700">{student.age} anos · {student.weight}kg</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-all
                ${tab === id ? "bg-gray-700 text-gray-100 shadow-sm" : "text-gray-600 hover:text-gray-400"}`}>
              <Icon size={12} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pb-24">
        {tab === "overview"  && <OverviewTab  student={student} onUpdate={onUpdate} />}
        {tab === "diet"      && <DietTab      student={student} onUpdate={onUpdate} />}
        {tab === "meals"     && <MealPlanTab  student={student} onUpdate={onUpdate} isAdmin={true} />}
        {tab === "workout"   && <WorkoutTab   student={student} onUpdate={onUpdate} isAdmin={true} />}
        {tab === "gallery"   && <GalleryTab   student={student} onUpdate={onUpdate} />}
        {tab === "settings"  && <SettingsTab  student={student} onUpdate={onUpdate} onDelete={onDelete} />}
      </div>
    </div>
  );
}

/* ── ABA: VISÃO GERAL ─────────────────────────────────────────────────────── */
function OverviewTab({ student, onUpdate }) {
  const currentPhase = CUTTING_PHASES[student.currentDietMonth - 1];
  const dietData = student.diet?.[student.currentDietMonth - 1];
  const hydrationL = calcHydrationL(student.weight);
  const hydration  = calcHydrationMl(student.weight);

  return (
    <div className="space-y-4 pt-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2"><Zap size={14} className="text-cyan-400" /> Fase Atual</h3>
          <span className="text-xs text-gray-600">{student.currentDietMonth}/6</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {CUTTING_PHASES.map((ph, idx) => (
            <button key={idx} onClick={() => onUpdate({ ...student, currentDietMonth: idx + 1, lastUpdated: new Date().toISOString() })}
              className={`py-2 rounded-xl text-xs font-bold border transition-all
                ${student.currentDietMonth === idx + 1 ? `${ph.tw.bg} ${ph.tw.border} ${ph.tw.text}` : "bg-gray-800 border-gray-700 text-gray-600 hover:border-gray-600"}`}>
              Mês {idx + 1}
            </button>
          ))}
        </div>
        {currentPhase && (
          <div className={`rounded-xl p-3 ${currentPhase.tw.bg} ${currentPhase.tw.border} border`}>
            <p className={`text-sm font-black ${currentPhase.tw.text}`}>{currentPhase.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{currentPhase.description}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><Clock size={14} className="text-gray-500" /> Progresso do Aluno</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Meses no Plano", field: "planMonths", value: student.planMonths, color: "#A78BFA" },
            { label: "Meses Treinando", field: "trainingMonths", value: student.trainingMonths, color: "#34D399" },
          ].map(({ label, field, value, color }) => (
            <div key={field} className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => onUpdate({ ...student, [field]: Math.max(0, value - 1), lastUpdated: new Date().toISOString() })}
                  className="w-7 h-7 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 flex items-center justify-center text-lg font-bold">−</button>
                <p className="text-xl font-black flex-1 text-center" style={{ color }}>{value}</p>
                <button onClick={() => onUpdate({ ...student, [field]: value + 1, lastUpdated: new Date().toISOString() })}
                  className="w-7 h-7 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 flex items-center justify-center text-lg font-bold">+</button>
              </div>
              <p className="text-xs text-gray-600 text-center">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Droplets size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-gray-300">Meta de Hidratação</h3>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-4xl font-black text-cyan-400 font-mono">{hydrationL}L</p>
          <p className="text-gray-600 text-sm pb-1.5">{hydration} ml / dia</p>
        </div>
      </div>

      {dietData && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
            <BarChart3 size={15} className="text-gray-600" /> Macronutrientes · Mês {student.currentDietMonth}
          </h3>
          <MacroBar label="Proteína" value={dietData.protein} max={300} color="#60A5FA" />
          <MacroBar label="Carboidrato" value={dietData.carbs} max={400} color="#34D399" />
          <MacroBar label="Gordura" value={dietData.fat} max={150} color="#FB923C" />
          <div className="pt-1 border-t border-gray-800">
            <p className="text-center text-2xl font-black font-mono text-gray-100">{dietData.calories}<span className="text-sm text-gray-600 font-normal ml-1">kcal/dia</span></p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3">
          <Dumbbell size={15} className="text-gray-600" /> Divisão de Treino
        </h3>
        <div className="space-y-2">
          {student.workout.map(day => (
            <div key={day.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-400 font-medium">{day.dayName}</span>
              <span className="text-xs text-gray-700 bg-gray-800 px-2 py-0.5 rounded-lg">{day.exercises.length} exercícios</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ABA: DIETA ───────────────────────────────────────────────────────────── */
function DietTab({ student, onUpdate }) {
  const [editingMonth, setEditingMonth] = useState(null);
  const [editForm, setEditForm] = useState({});

  const openEdit = (idx) => { setEditForm({ ...student.diet[idx] }); setEditingMonth(idx); };
  const saveEdit = () => {
    const newDiet = student.diet.map((d, i) => i === editingMonth ? { ...editForm, isEdited: true } : d);
    onUpdate({ ...student, diet: newDiet, lastUpdated: new Date().toISOString() });
    setEditingMonth(null);
  };
  const resetMonth = (idx) => {
    const phase = CUTTING_PHASES[idx];
    const cal = Math.max(Math.round(student.tdee - phase.deficit), 1200);
    const newDiet = student.diet.map((d, i) =>
      i === idx ? { ...d, calories: cal, protein: Math.round((cal*phase.macroRatios.protein)/4), carbs: Math.round((cal*phase.macroRatios.carbs)/4), fat: Math.round((cal*phase.macroRatios.fat)/9), isEdited: false, customNotes: "" } : d
    );
    onUpdate({ ...student, diet: newDiet, lastUpdated: new Date().toISOString() });
  };

  return (
    <div className="space-y-4 pt-4">
      <p className="text-xs text-gray-600">Protocolo de 6 meses baseado no TDEE ({student.tdee} kcal). Edite qualquer mês conforme necessário.</p>
      {CUTTING_PHASES.map((phase, idx) => {
        const data = student.diet?.[idx];
        if (!data) return null;
        const isCurrent = student.currentDietMonth === idx + 1;
        return (
          <div key={idx} className={`border rounded-2xl overflow-hidden transition-all ${isCurrent ? `${phase.tw.border} ring-1 ring-offset-1 ring-offset-gray-950` : "border-gray-800"} ${isCurrent ? phase.tw.bg : "bg-gray-900/60"}`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ backgroundColor: phase.accent + "20", color: phase.accent }}>{idx + 1}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-black ${phase.tw.text}`}>{phase.name}</p>
                    {data.isEdited && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/25">Editado</span>}
                    {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">▶ Atual</span>}
                  </div>
                  <p className="text-xs text-gray-600">{phase.tag}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-100 font-mono">{data.calories}</p>
                <p className="text-xs text-gray-600">kcal</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-3">
              {[{label:"Proteína",val:data.protein,col:"#60A5FA"},{label:"Carb",val:data.carbs,col:"#34D399"},{label:"Gordura",val:data.fat,col:"#FB923C"}].map(({label,val,col}) => (
                <div key={label} className="bg-gray-800/50 rounded-xl p-2 text-center">
                  <p className="text-sm font-black font-mono" style={{ color: col }}>{val}g</p>
                  <p className="text-xs text-gray-700">{label}</p>
                </div>
              ))}
            </div>
            {data.customNotes && (
              <div className="mx-4 mb-3 p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                <p className="text-xs text-gray-500 italic">"{data.customNotes}"</p>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
              <button onClick={() => openEdit(idx)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 text-xs font-bold text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-all">
                <Edit2 size={12} /> Editar
              </button>
              {!isCurrent && (
                <button onClick={() => onUpdate({ ...student, currentDietMonth: idx + 1, lastUpdated: new Date().toISOString() })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${phase.tw.bg} ${phase.tw.border} ${phase.tw.text} hover:opacity-80 transition-all`}>
                  <Zap size={12} /> Definir Atual
                </button>
              )}
              {data.isEdited && (
                <button onClick={() => resetMonth(idx)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 text-xs font-bold text-gray-600 hover:text-amber-400 transition-all ml-auto">
                  <RefreshCcw size={12} /> Resetar
                </button>
              )}
            </div>
          </div>
        );
      })}

      {editingMonth !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setEditingMonth(null)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl p-6"
            style={{ animation: "slideUp .3s cubic-bezier(.34,1.3,.64,1)" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white">Editar — Mês {editingMonth + 1}: {CUTTING_PHASES[editingMonth].name}</h3>
              <button onClick={() => setEditingMonth(null)} className="p-2 rounded-xl hover:bg-gray-800 text-gray-600"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <Field label="Calorias (kcal)" type="number" value={editForm.calories} onChange={v => setEditForm(f => ({ ...f, calories: v }))} min={800} />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Proteína (g)" type="number" value={editForm.protein} onChange={v => setEditForm(f => ({ ...f, protein: v }))} />
                <Field label="Carbo (g)" type="number" value={editForm.carbs} onChange={v => setEditForm(f => ({ ...f, carbs: v }))} />
                <Field label="Gordura (g)" type="number" value={editForm.fat} onChange={v => setEditForm(f => ({ ...f, fat: v }))} />
              </div>
              <Field label="Cardio (min/dia)" type="number" value={editForm.cardioMin} onChange={v => setEditForm(f => ({ ...f, cardioMin: v }))} />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Notas do ADM</label>
                <textarea value={editForm.customNotes} onChange={e => setEditForm(f => ({ ...f, customNotes: e.target.value }))}
                  rows={2} placeholder="Instruções, observações específicas..."
                  className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none" />
              </div>
              <button onClick={saveEdit}
                className="w-full py-4 rounded-xl font-black text-sm text-gray-950 transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>
                <Save size={15} className="inline mr-2" />Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ABA: PLANO DE REFEIÇÕES ──────────────────────────────────────────────── */

function calcMealMacros(items) {
  return items.reduce((acc, item) => {
    const food = FOOD_DB.find(f => f.id === item.foodId);
    if (!food) return acc;
    const factor = (food.gpu * item.qty) / 100;
    return { cal: Math.round(acc.cal + food.kcal * factor), p: Math.round((acc.p + food.p * factor) * 10) / 10, c: Math.round((acc.c + food.c * factor) * 10) / 10, f: Math.round((acc.f + food.f * factor) * 10) / 10 };
  }, { cal: 0, p: 0, c: 0, f: 0 });
}

function MealPlanTab({ student, onUpdate, isAdmin = true }) {
  const [activeMonth, setActiveMonth] = useState(student.currentDietMonth - 1);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [showFoodPicker, setShowFoodPicker] = useState(null); // { mealId, replaceItemId? }
  const [foodSearch, setFoodSearch] = useState("");
  const [expandedMeals, setExpandedMeals] = useState({});
  // State for direct gram editing
  const [editingGrams, setEditingGrams] = useState(null); // { mealId, itemId, value }
  const gramInputRef = useRef(null);

  const phase = CUTTING_PHASES[activeMonth];
  const dietData = student.diet?.[activeMonth];
  const monthPlan = student.mealPlan?.[activeMonth] || [];

  const saveMealPlan = useCallback((newPlan) => {
    const mealPlan = { ...(student.mealPlan || {}), [activeMonth]: newPlan };
    onUpdate({ ...student, mealPlan, lastUpdated: new Date().toISOString() });
  }, [student, onUpdate, activeMonth]);

  const addMeal = () => {
    if (!newMealName.trim()) return;
    saveMealPlan([...monthPlan, { id: uid(), name: newMealName, targetCal: 0, items: [] }]);
    setNewMealName(""); setShowAddMeal(false);
  };
  const removeMeal = (mealId) => saveMealPlan(monthPlan.filter(m => m.id !== mealId));

  const handleFoodSelect = (foodId) => {
    const { mealId, replaceItemId } = showFoodPicker;
    if (replaceItemId) {
      // Find the item being replaced
      const origItem = monthPlan.flatMap(m => m.items).find(i => i.id === replaceItemId);
      const origFood = origItem ? FOOD_DB.find(f => f.id === origItem.foodId) : null;
      const newFood = FOOD_DB.find(f => f.id === foodId);

      // Calculate equivalent quantity based on calories
      let newQty = origItem ? origItem.qty : 1;
      if (origFood && newFood && origItem) {
        const origCalTotal = (origFood.kcal * origFood.gpu * origItem.qty) / 100;
        const newCalPer1Qty = (newFood.kcal * newFood.gpu) / 100;
        if (newCalPer1Qty > 0) {
          newQty = Math.max(0.1, Math.round((origCalTotal / newCalPer1Qty) * 10) / 10);
        }
      }

      saveMealPlan(monthPlan.map(m =>
        m.id === mealId
          ? { ...m, items: m.items.map(i => i.id === replaceItemId ? { ...i, foodId, qty: newQty, substituted: true } : i) }
          : m
      ));
    } else {
      // Add new item
      saveMealPlan(monthPlan.map(m =>
        m.id === mealId ? { ...m, items: [...m.items, { id: uid(), foodId, qty: 1 }] } : m
      ));
    }
    setShowFoodPicker(null); setFoodSearch("");
  };

  // Update quantity by delta in grams
  const updateItemQtyGrams = (mealId, itemId, gramDelta) => {
    saveMealPlan(monthPlan.map(m => {
      if (m.id !== mealId) return m;
      return {
        ...m,
        items: m.items.map(i => {
          if (i.id !== itemId) return i;
          const food = FOOD_DB.find(f => f.id === i.foodId);
          if (!food) return i;
          const currentGrams = food.gpu * i.qty;
          const newGrams = Math.max(5, currentGrams + gramDelta);
          const newQty = newGrams / food.gpu;
          return { ...i, qty: Math.round(newQty * 1000) / 1000 };
        })
      };
    }));
  };

  // Set exact quantity in grams
  const setItemGramsDirect = (mealId, itemId, grams) => {
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0) return;
    saveMealPlan(monthPlan.map(m => {
      if (m.id !== mealId) return m;
      return {
        ...m,
        items: m.items.map(i => {
          if (i.id !== itemId) return i;
          const food = FOOD_DB.find(f => f.id === i.foodId);
          if (!food) return i;
          const newQty = Math.max(0.001, g / food.gpu);
          return { ...i, qty: Math.round(newQty * 1000) / 1000 };
        })
      };
    }));
  };

  const removeItem = (mealId, itemId) => {
    saveMealPlan(monthPlan.map(m => m.id === mealId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m));
  };
  const toggleExpand = (mealId) => setExpandedMeals(p => ({ ...p, [mealId]: !p[mealId] }));

  const dayTotal = monthPlan.reduce((acc, meal) => {
    const m = calcMealMacros(meal.items);
    return { cal: acc.cal + m.cal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f };
  }, { cal: 0, p: 0, c: 0, f: 0 });

  const filteredFoods = foodSearch.length > 1
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()) || f.cat.toLowerCase().includes(foodSearch.toLowerCase()))
    : FOOD_DB;
  const foodCategories = [...new Set(filteredFoods.map(f => f.cat))];

  useEffect(() => {
    if (editingGrams && gramInputRef.current) {
      gramInputRef.current.focus();
      gramInputRef.current.select();
    }
  }, [editingGrams]);

  return (
    <div className="pt-4 space-y-4">
      {/* Seletor de mês */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CUTTING_PHASES.map((ph, idx) => (
          <button key={idx} onClick={() => setActiveMonth(idx)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-all
              ${activeMonth === idx ? `${ph.tw.bg} ${ph.tw.border} ${ph.tw.text}` : "bg-gray-900 border-gray-800 text-gray-600 hover:border-gray-600"}`}>
            {idx + 1}. {ph.name}
          </button>
        ))}
      </div>

      {/* Total diário */}
      {dietData && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">Total Diário vs Meta</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Kcal", current: dayTotal.cal, target: dietData.calories, color: "#22D3EE" },
              { label: "Prot", current: dayTotal.p,   target: dietData.protein,  color: "#60A5FA" },
              { label: "Carbo",current: dayTotal.c,   target: dietData.carbs,    color: "#34D399" },
              { label: "Gord", current: dayTotal.f,   target: dietData.fat,      color: "#FB923C" },
            ].map(({ label, current, target, color }) => {
              const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
              const over = target > 0 && current > target;
              return (
                <div key={label} className="text-center">
                  <p className="text-xs font-black font-mono" style={{ color: over ? "#F87171" : color }}>{current}</p>
                  <p className="text-xs text-gray-700">{label}</p>
                  <div className="h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: over ? "#F87171" : color }} />
                  </div>
                  <p className="text-xs text-gray-800 mt-0.5">/{target}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Refeições */}
      {monthPlan.map((meal) => {
        const macros = calcMealMacros(meal.items);
        const isExpanded = expandedMeals[meal.id] !== false;
        return (
          <div key={meal.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleExpand(meal.id)}>
              <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Utensils size={15} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-200">{meal.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-cyan-400">{macros.cal} kcal</span>
                  <span className="text-xs text-gray-700">P:{macros.p}g C:{macros.c}g G:{macros.f}g</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <button onClick={e => { e.stopPropagation(); removeMeal(meal.id); }} className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
                {isExpanded ? <ChevronUp size={15} className="text-gray-600" /> : <ChevronDown size={15} className="text-gray-600" />}
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-2 border-t border-gray-800 pt-3">
                {meal.items.length === 0 && (
                  <p className="text-xs text-gray-700 text-center py-3">Nenhum alimento adicionado.</p>
                )}
                {meal.items.map(item => {
                  const food = FOOD_DB.find(f => f.id === item.foodId);
                  if (!food) return null;
                  const factor = (food.gpu * item.qty) / 100;
                  const itemCal = Math.round(food.kcal * factor);
                  const grams = Math.round(food.gpu * item.qty);
                  const isEditingThis = editingGrams?.mealId === meal.id && editingGrams?.itemId === item.id;

                  return (
                    <div key={item.id} className={`flex items-center gap-2 rounded-xl p-3 transition-all
                      ${item.substituted ? "bg-emerald-400/5 border border-emerald-400/15" : "bg-gray-800/50"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-300 truncate">{food.name}</p>
                          {item.substituted && <span className="text-xs text-emerald-400 font-bold">↔</span>}
                        </div>
                        <p className="text-xs text-gray-600 font-mono">{itemCal} kcal · P:{Math.round(food.p*factor*10)/10}g C:{Math.round(food.c*factor*10)/10}g G:{Math.round(food.f*factor*10)/10}g</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateItemQtyGrams(meal.id, item.id, -5)}
                          className="w-6 h-6 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 flex items-center justify-center text-xs font-black">−</button>
                        {/* Tappable gram display */}
                        {isEditingThis ? (
                          <input
                            ref={gramInputRef}
                            type="number"
                            value={editingGrams.value}
                            onChange={e => setEditingGrams(prev => ({ ...prev, value: e.target.value }))}
                            onBlur={() => {
                              setItemGramsDirect(meal.id, item.id, editingGrams.value);
                              setEditingGrams(null);
                            }}
                            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setEditingGrams(null); }}
                            className="w-14 text-center bg-gray-600 border border-cyan-500/50 rounded-lg text-xs text-gray-100 px-1 py-1 focus:outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingGrams({ mealId: meal.id, itemId: item.id, value: grams })}
                            className="w-14 text-center text-xs font-black text-gray-100 hover:text-cyan-400 transition-colors py-1 rounded-lg hover:bg-gray-700"
                            title="Toque para editar gramas">
                            {grams}g
                          </button>
                        )}
                        <button onClick={() => updateItemQtyGrams(meal.id, item.id, 5)}
                          className="w-6 h-6 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 flex items-center justify-center text-xs font-black">+</button>
                        {/* Swap button — for all users */}
                        <button onClick={() => { setShowFoodPicker({ mealId: meal.id, replaceItemId: item.id }); setFoodSearch(""); }}
                          className="w-6 h-6 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 flex items-center justify-center transition-all"
                          title="Trocar alimento">
                          <ArrowLeftRight size={10} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => removeItem(meal.id, item.id)} className="text-gray-700 hover:text-red-400 transition-colors p-0.5">
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isAdmin && (
                  <button onClick={() => { setShowFoodPicker({ mealId: meal.id }); setFoodSearch(""); }}
                    className="w-full py-3 rounded-xl border border-dashed border-gray-700 text-xs font-bold text-gray-600 hover:border-gray-500 hover:text-gray-400 transition-all flex items-center justify-center gap-1.5">
                    <Plus size={13} /> Adicionar Alimento
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <button onClick={() => setShowAddMeal(true)}
          className="w-full py-4 rounded-2xl border border-dashed border-gray-700 text-sm font-bold text-gray-600 hover:border-gray-500 hover:text-gray-400 transition-all flex items-center justify-center gap-2">
          <Plus size={16} /> Nova Refeição
        </button>
      )}

      {/* Modal: Adicionar refeição */}
      {showAddMeal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowAddMeal(false)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl p-6"
            style={{ animation: "slideUp .3s cubic-bezier(.34,1.3,.64,1)" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-white mb-4">Nova Refeição</h3>
            <div className="space-y-3">
              <Field label="Nome da Refeição" value={newMealName} onChange={setNewMealName} placeholder="Ex: Café da Manhã, Almoço..." />
              <div className="flex flex-wrap gap-2">
                {["Café da Manhã","Lanche Manhã","Almoço","Lanche Tarde","Jantar","Ceia","Pré-treino","Pós-treino"].map(s => (
                  <button key={s} onClick={() => setNewMealName(s)}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-800 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-all border border-gray-700">{s}</button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddMeal(false)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-500 font-bold text-sm">Cancelar</button>
                <button onClick={addMeal} disabled={!newMealName.trim()}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-gray-950 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>Criar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Seletor de alimento (add ou substituir) */}
      {showFoodPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowFoodPicker(null)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl p-6"
            style={{ animation: "slideUp .3s cubic-bezier(.34,1.3,.64,1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white">
                {showFoodPicker.replaceItemId ? "🔄 Substituir Alimento" : "Adicionar Alimento"}
              </h3>
              <button onClick={() => setShowFoodPicker(null)} className="p-2 rounded-xl hover:bg-gray-800 text-gray-600"><X size={16} /></button>
            </div>
            {showFoodPicker.replaceItemId && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-cyan-400/5 border border-cyan-400/15 text-xs text-cyan-400">
                A quantidade será recalculada automaticamente para manter o mesmo total calórico da refeição.
              </div>
            )}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder="Buscar alimento..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500" />
            </div>
            <div className="space-y-4">
              {foodCategories.map(cat => (
                <div key={cat}>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">{cat}</p>
                  <div className="space-y-1">
                    {filteredFoods.filter(f => f.cat === cat).map(food => (
                      <button key={food.id} onClick={() => handleFoodSelect(food.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800/50 hover:bg-gray-700/60 transition-all text-left border border-transparent hover:border-gray-700">
                        <div>
                          <p className="text-sm font-bold text-gray-200">{food.name}</p>
                          <p className="text-xs text-gray-600 font-mono">
                            {food.gpu}g/unid · {Math.round(food.kcal * food.gpu / 100)} kcal · P:{Math.round(food.p * food.gpu / 100)}g · C:{Math.round(food.c * food.gpu / 100)}g
                          </p>
                        </div>
                        {showFoodPicker.replaceItemId
                          ? <ArrowLeftRight size={14} className="text-cyan-500 flex-shrink-0" />
                          : <Plus size={15} className="text-gray-600 flex-shrink-0" />
                        }
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ABA: TREINO ──────────────────────────────────────────────────────────── */
function WorkoutTab({ student, onUpdate, isAdmin }) {
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [addingDay, setAddingDay] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);
  const [newExForm, setNewExForm] = useState({ name: "", sets: 3, reps: "10-12" });
  // Admin: inline editing of sets/reps per exercise
  const [editingExId, setEditingExId] = useState(null);
  const [editExForm, setEditExForm] = useState({ sets: 3, reps: "", prescribedRir: [] });

  const day = student.workout[activeDayIdx];
  const updateWorkout = (nw) => onUpdate({ ...student, workout: nw, lastUpdated: new Date().toISOString() });
  const addDay = () => {
    if (!newDayName.trim()) return;
    updateWorkout([...student.workout, { id: uid(), dayName: newDayName, subtitle: "", exercises: [] }]);
    setActiveDayIdx(student.workout.length); setAddingDay(false); setNewDayName("");
  };
  const removeDay = (idx) => { updateWorkout(student.workout.filter((_, i) => i !== idx)); setActiveDayIdx(Math.max(0, idx - 1)); };
  const addExercise = () => {
    if (!newExForm.name.trim()) return;
    const nw = student.workout.map((d, i) => i === activeDayIdx ? { ...d, exercises: [...d.exercises, mkExercise(newExForm.name, newExForm.sets, newExForm.reps)] } : d);
    updateWorkout(nw); setAddingExercise(false); setNewExForm({ name: "", sets: 3, reps: "10-12" });
  };
  const removeExercise = (exId) => updateWorkout(student.workout.map((d, i) => i === activeDayIdx ? { ...d, exercises: d.exercises.filter(e => e.id !== exId) } : d));
  const updateExercise = (exId, changes) => updateWorkout(student.workout.map((d, i) => i === activeDayIdx ? { ...d, exercises: d.exercises.map(e => e.id === exId ? { ...e, ...changes } : e) } : d));

  const startEditEx = (ex) => {
    setEditingExId(ex.id);
    const n = Number(ex.sets) || 1;
    const base = ex.prescribedRir && ex.prescribedRir.length === n
      ? [...ex.prescribedRir]
      : Array(n).fill(null);
    setEditExForm({ sets: n, reps: ex.reps, prescribedRir: base });
  };
  const saveEditEx = (exId) => {
    const newSets = Number(editExForm.sets) || 1;
    // Adjust prescribedRir length to match new sets count
    const oldPr = editExForm.prescribedRir || [];
    const prescribedRir = Array.from({ length: newSets }, (_, i) => oldPr[i] ?? null);
    // Adjust student rirPerSet too
    const ex = day.exercises.find(e => e.id === exId);
    const oldRps = ex?.rirPerSet || [];
    const rirPerSet = Array.from({ length: newSets }, (_, i) => oldRps[i] ?? null);
    updateExercise(exId, { sets: newSets, reps: editExForm.reps, prescribedRir, rirPerSet });
    setEditingExId(null);
  };

  if (!day) return (
    <div className="pt-4 text-center py-12 text-gray-700">
      <Dumbbell size={32} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">Nenhum dia de treino</p>
      {isAdmin && <button onClick={() => setAddingDay(true)} className="mt-4 px-4 py-2 rounded-xl bg-gray-800 text-sm text-gray-400 border border-gray-700"><Plus size={14} className="inline mr-1" />Adicionar dia</button>}
    </div>
  );

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {student.workout.map((d, idx) => (
          <button key={d.id} onClick={() => setActiveDayIdx(idx)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap
              ${activeDayIdx === idx ? "bg-gray-100 text-gray-900 border-transparent" : "bg-gray-900 text-gray-600 border-gray-800 hover:border-gray-600 hover:text-gray-400"}`}>
            {d.dayName}
          </button>
        ))}
        {isAdmin && (
          <button onClick={() => setAddingDay(true)}
            className="flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold border border-dashed border-gray-700 text-gray-700 hover:border-gray-500 hover:text-gray-500 transition-all">
            <Plus size={13} />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-gray-100">{day.dayName}</h3>
          {day.subtitle && <p className="text-xs text-gray-600">{day.subtitle}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => removeDay(activeDayIdx)} className="p-2 rounded-xl text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {day.exercises.map((ex) => (
          <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            {/* Exercise header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-100">{ex.name}</p>
                {/* Sets/reps display with admin inline edit */}
                {isAdmin && editingExId === ex.id ? (
                  <div className="flex flex-col gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={editExForm.sets}
                        min={1} max={20}
                        onChange={e => {
                          const n = Number(e.target.value) || 1;
                          const old = editExForm.prescribedRir || [];
                          setEditExForm(f => ({
                            ...f,
                            sets: n,
                            prescribedRir: Array.from({ length: n }, (_, i) => old[i] ?? null),
                          }));
                        }}
                        className="w-12 text-center bg-gray-800 border border-cyan-500/40 rounded-lg px-1 py-1 text-xs text-gray-100 focus:outline-none"
                      />
                      <span className="text-gray-600 text-xs font-bold">×</span>
                      <input
                        value={editExForm.reps}
                        onChange={e => setEditExForm(f => ({ ...f, reps: e.target.value }))}
                        placeholder="10-12"
                        className="w-20 text-center bg-gray-800 border border-cyan-500/40 rounded-lg px-1 py-1 text-xs text-gray-100 focus:outline-none"
                      />
                      <button onClick={() => saveEditEx(ex.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all">
                        ✓
                      </button>
                      <button onClick={() => setEditingExId(null)}
                        className="px-2 py-1 rounded-lg bg-gray-800 text-gray-600 text-xs hover:text-gray-400 transition-all">
                        ✕
                      </button>
                    </div>
                    {/* RIR por série (admin prescreve) */}
                    {Number(editExForm.sets) > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                          <Flame size={10} className="text-orange-400" /> RIR prescrito por série
                        </p>
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(Number(editExForm.sets), 4)}, 1fr)` }}>
                          {Array.from({ length: Number(editExForm.sets) }, (_, si) => {
                            const RIR_OPTS = [
                              { v: null, label: "—", color: "#6b7280" },
                              { v: 0, label: "Falha", color: "#F87171" },
                              { v: 1, label: "1", color: "#FB923C" },
                              { v: 2, label: "2", color: "#FBBF24" },
                              { v: 3, label: "3", color: "#A3E635" },
                              { v: 4, label: "4+", color: "#34D399" },
                            ];
                            const cur = (editExForm.prescribedRir || [])[si] ?? null;
                            return (
                              <div key={si} className="bg-gray-800/60 rounded-xl p-2">
                                <p className="text-xs text-gray-600 font-bold text-center mb-1.5">S{si + 1}</p>
                                <div className="flex gap-0.5 flex-wrap justify-center">
                                  {RIR_OPTS.map(({ v, label, color }) => (
                                    <button key={String(v)} onClick={() => {
                                      const arr = [...(editExForm.prescribedRir || [])];
                                      arr[si] = v;
                                      setEditExForm(f => ({ ...f, prescribedRir: arr }));
                                    }}
                                      className="px-1.5 py-0.5 rounded-md text-xs font-bold border transition-all"
                                      style={cur === v
                                        ? { backgroundColor: color + "30", borderColor: color + "70", color }
                                        : { backgroundColor: "rgba(31,41,55,0.8)", borderColor: "rgba(55,65,81,1)", color: "#6b7280" }}>
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-600 font-mono">{ex.sets} × {ex.reps}</span>
                    {/* Mostrar RIR prescrito por série */}
                    {ex.prescribedRir && ex.prescribedRir.some(r => r !== null) && (
                      <span className="flex items-center gap-0.5">
                        {ex.prescribedRir.slice(0, ex.sets).map((r, si) => {
                          const colors = ["#F87171","#FB923C","#FBBF24","#A3E635","#34D399"];
                          const c = r !== null ? (colors[r] || "#34D399") : "#374151";
                          return (
                            <span key={si} className="text-xs font-bold px-1 rounded"
                              style={{ color: c, backgroundColor: c + "18" }}>
                              {r === null ? "—" : r === 0 ? "F" : r >= 4 ? "4+" : r}
                            </span>
                          );
                        })}
                      </span>
                    )}
                    {isAdmin && (
                      <button onClick={() => startEditEx(ex)}
                        className="p-0.5 rounded text-gray-700 hover:text-cyan-400 transition-colors"
                        title="Editar séries/reps/RIR">
                        <Edit2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isAdmin && (
                <button onClick={() => removeExercise(ex.id)} className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* STUDENT: RIR + Weight + Reps Done */}
            {!isAdmin && (
              <div className="space-y-3">
                {/* Weight + Reps Done */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">⚖️ Peso utilizado</p>
                    <input
                      value={ex.weightUsed || ""}
                      onChange={e => updateExercise(ex.id, { weightUsed: e.target.value })}
                      placeholder="ex: 80kg"
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">🔄 Reps realizadas</p>
                    <input
                      value={ex.repsDone || ""}
                      onChange={e => updateExercise(ex.id, { repsDone: e.target.value })}
                      placeholder="ex: 10,10,8"
                      className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-cyan-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* RIR por Série */}
                <div>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                    <Flame size={11} className="text-orange-400" />
                    RIR por Série — Repetições em Reserva
                  </p>
                  {(() => {
                    const n = Number(ex.sets) || 1;
                    const rirPerSet = ex.rirPerSet && ex.rirPerSet.length === n
                      ? ex.rirPerSet
                      : Array.from({ length: n }, (_, i) => ex.rirPerSet?.[i] ?? null);
                    const prescribed = ex.prescribedRir || [];
                    const RIR_OPTS = [
                      { v: 0, label: "0", desc: "Falha", color: "#F87171" },
                      { v: 1, label: "1", desc: "1 rest.", color: "#FB923C" },
                      { v: 2, label: "2", desc: "2 rest.", color: "#FBBF24" },
                      { v: 3, label: "3", desc: "3 rest.", color: "#A3E635" },
                      { v: 4, label: "4+", desc: "Fácil", color: "#34D399" },
                    ];
                    return (
                      <div className="space-y-2">
                        {Array.from({ length: n }, (_, si) => {
                          const curVal = rirPerSet[si];
                          const pRes = prescribed[si];
                          return (
                            <div key={si} className="bg-gray-800/60 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-gray-400">Série {si + 1}</span>
                                {pRes !== null && pRes !== undefined && (
                                  <span className="text-xs text-gray-600">
                                    Meta ADM: <span className="font-bold" style={{ color: ["#F87171","#FB923C","#FBBF24","#A3E635","#34D399"][pRes] }}>
                                      {pRes === 0 ? "Falha" : pRes >= 4 ? "4+" : pRes}
                                    </span>
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1.5">
                                {RIR_OPTS.map(({ v, label, color }) => (
                                  <button key={v}
                                    onClick={() => {
                                      const arr = Array.from({ length: n }, (_, i) => rirPerSet[i] ?? null);
                                      arr[si] = arr[si] === v ? null : v;
                                      updateExercise(ex.id, { rirPerSet: arr, rirValue: arr[0] });
                                    }}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-black border transition-all active:scale-95"
                                    style={curVal === v
                                      ? { backgroundColor: color + "25", borderColor: color + "60", color }
                                      : { backgroundColor: "rgba(31,41,55,1)", borderColor: "rgba(55,65,81,1)", color: "#6b7280" }}>
                                    {label}
                                  </button>
                                ))}
                              </div>
                              {curVal !== null && curVal !== undefined && (
                                <p className="text-xs font-bold text-center mt-1.5"
                                  style={{ color: ["#F87171","#FB923C","#FBBF24","#A3E635","#34D399"][curVal] }}>
                                  {curVal === 0 ? "Falha" : curVal >= 4 ? "4+ — Muito fácil" : `${curVal} sobrando`}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Student note */}
                <div>
                  <p className="text-xs text-gray-600 mb-1.5">📝 Observações do treino:</p>
                  <textarea value={ex.studentNote || ""} onChange={e => updateExercise(ex.id, { studentNote: e.target.value })}
                    placeholder="Como foi? Dificuldade, sensações..." rows={2}
                    className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 placeholder-gray-700 focus:outline-none focus:border-gray-600 resize-none" />
                </div>

                {/* Video link */}
                <div className="flex items-center gap-2">
                  <Link2 size={12} className="text-gray-700 flex-shrink-0" />
                  <input value={ex.videoLink || ""} onChange={e => updateExercise(ex.id, { videoLink: e.target.value })}
                    placeholder="Link do vídeo demonstrativo..."
                    className="flex-1 bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-400 placeholder-gray-700 focus:outline-none focus:border-gray-600" />
                </div>
              </div>
            )}

            {/* ADMIN: show student's logged data */}
            {isAdmin && (
              <div className="space-y-2">
                {(ex.weightUsed || ex.repsDone || ex.rirValue !== null) && (
                  <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700">
                    <p className="text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                      <Activity size={11} className="text-cyan-400" /> Registro do aluno
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {ex.weightUsed && (
                        <div>
                          <p className="text-xs text-gray-600">⚖️ Peso</p>
                          <p className="text-xs font-bold text-gray-200 mt-0.5">{ex.weightUsed}</p>
                        </div>
                      )}
                      {ex.repsDone && (
                        <div>
                          <p className="text-xs text-gray-600">🔄 Reps</p>
                          <p className="text-xs font-bold text-gray-200 mt-0.5">{ex.repsDone}</p>
                        </div>
                      )}
                      {(ex.rirPerSet?.some(r => r !== null)) || ex.rirValue !== null ? (
                        <div>
                          <p className="text-xs text-gray-600">🔥 RIR (por série)</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(ex.rirPerSet && ex.rirPerSet.length > 0
                              ? ex.rirPerSet.slice(0, ex.sets)
                              : [ex.rirValue]
                            ).map((r, si) => {
                              if (r === null || r === undefined) return null;
                              const colors = ["#F87171","#FB923C","#FBBF24","#A3E635","#34D399"];
                              return (
                                <span key={si} className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                                  style={{ color: colors[r] || "#34D399", backgroundColor: (colors[r] || "#34D399") + "20" }}>
                                  S{si + 1}: {r === 0 ? "Falha" : r >= 4 ? "4+" : r}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
                {ex.studentNote && (
                  <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700">
                    <p className="text-xs text-gray-600 mb-1">Nota do aluno:</p>
                    <p className="text-xs text-gray-400 italic">"{ex.studentNote}"</p>
                  </div>
                )}
                {ex.videoLink && (
                  <a href={ex.videoLink} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    <Play size={12} /> {ex.videoLink.length > 40 ? ex.videoLink.substring(0, 40) + "…" : ex.videoLink}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        {isAdmin && (
          <button onClick={() => setAddingExercise(true)}
            className="w-full py-4 rounded-2xl border border-dashed border-gray-700 text-gray-700 hover:border-gray-600 hover:text-gray-500 transition-all flex items-center justify-center gap-2 text-sm font-bold">
            <Plus size={16} /> Adicionar Exercício
          </button>
        )}
      </div>

      {addingExercise && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setAddingExercise(false)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl p-6"
            style={{ animation: "slideUp .3s cubic-bezier(.34,1.3,.64,1)" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-white mb-5">Adicionar Exercício</h3>
            <div className="space-y-4">
              <Field label="Nome do Exercício" value={newExForm.name} onChange={v => setNewExForm(f => ({ ...f, name: v }))} placeholder="Ex: Supino Reto com Barra" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Séries" type="number" value={newExForm.sets} min={1} max={10} onChange={v => setNewExForm(f => ({ ...f, sets: v }))} />
                <Field label="Repetições" value={newExForm.reps} onChange={v => setNewExForm(f => ({ ...f, reps: v }))} placeholder="Ex: 10-12" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAddingExercise(false)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-500 font-bold text-sm">Cancelar</button>
                <button onClick={addExercise} disabled={!newExForm.name.trim()}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-gray-950 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addingDay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setAddingDay(false)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl p-6"
            style={{ animation: "slideUp .3s cubic-bezier(.34,1.3,.64,1)" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-white mb-5">Novo Dia de Treino</h3>
            <div className="space-y-4">
              <Field label="Nome do dia" value={newDayName} onChange={setNewDayName} placeholder="Ex: Push, Pernas, Full Body..." />
              <div className="flex flex-wrap gap-2">
                {["Push","Pull","Legs","Full Body","HIIT","Cardio","Descanso Ativo"].map(s => (
                  <button key={s} onClick={() => setNewDayName(s)}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-800 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700 transition-all border border-gray-700">{s}</button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAddingDay(false)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-500 font-bold text-sm">Cancelar</button>
                <button onClick={addDay} disabled={!newDayName.trim()}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-gray-950 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>Criar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ABA: GALERIA ─────────────────────────────────────────────────────────── */
function GalleryTab({ student, onUpdate }) {
  const [form, setForm] = useState({ url: "", date: new Date().toISOString().split("T")[0], desc: "" });
  const [showForm, setShowForm] = useState(false);

  const addPhoto = () => {
    if (!form.url.trim()) return;
    onUpdate({ ...student, gallery: [...student.gallery, { id: uid(), ...form }], lastUpdated: new Date().toISOString() });
    setForm({ url: "", date: new Date().toISOString().split("T")[0], desc: "" }); setShowForm(false);
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{student.gallery.length} foto(s)</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-950 active:scale-95"
          style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>
          <Plus size={14} strokeWidth={3} /> Adicionar Foto
        </button>
      </div>
      {student.gallery.length === 0 && (
        <div className="text-center py-12 text-gray-700">
          <Camera size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhuma foto ainda</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {[...student.gallery].sort((a, b) => new Date(b.date) - new Date(a.date)).map(photo => (
          <div key={photo.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden group">
            <div className="aspect-[3/4] overflow-hidden bg-gray-800">
              <img src={photo.url} alt={photo.desc} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={e => { e.target.style.display = "none"; }} />
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 font-medium truncate">{photo.desc || "Sem descrição"}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-700 font-mono">{fmtDate(photo.date)}</span>
                <button onClick={() => onUpdate({ ...student, gallery: student.gallery.filter(p => p.id !== photo.id), lastUpdated: new Date().toISOString() })}
                  className="text-gray-700 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 border-b-0 rounded-t-3xl p-6"
            style={{ animation: "slideUp .3s cubic-bezier(.34,1.3,.64,1)" }}>
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
            <h3 className="font-black text-white mb-5">Adicionar Foto de Progresso</h3>
            <div className="space-y-4">
              <Field label="URL da Foto" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." />
              <Field label="Data" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
              <Field label="Descrição" value={form.desc} onChange={v => setForm(f => ({ ...f, desc: v }))} placeholder="Ex: Início, Mês 2..." />
              {form.url && <div className="rounded-xl overflow-hidden aspect-video bg-gray-800"><img src={form.url} alt="preview" className="w-full h-full object-cover" /></div>}
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-500 font-bold text-sm">Cancelar</button>
                <button onClick={addPhoto} disabled={!form.url.trim()}
                  className="flex-1 py-3 rounded-xl font-black text-sm text-gray-950 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ABA: DADOS / SETTINGS ────────────────────────────────────────────────── */
function SettingsTab({ student, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    name: student.name, age: student.age, weight: student.weight,
    goal: student.goal, planMonths: student.planMonths,
    trainingMonths: student.trainingMonths, tdee: student.tdee,
    avatarColor: student.avatarColor, currentDietMonth: student.currentDietMonth,
    password: student.password || "aluno123",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const newDiet = generateDiet(form.weight, form.tdee);
    onUpdate({
      ...student, ...form,
      diet: student.diet.map((d, i) => d.isEdited ? d : newDiet[i]),
      lastUpdated: new Date().toISOString(),
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const presetColors = ["#3B82F6","#EC4899","#F59E0B","#10B981","#8B5CF6","#F87171","#22D3EE","#A78BFA"];

  return (
    <div className="pt-4 space-y-5">
      <div className="space-y-4">
        <Field label="Nome Completo" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Idade" type="number" value={form.age} min={14} onChange={v => setForm(f => ({ ...f, age: v }))} />
          <Field label="Peso (kg)" type="number" value={form.weight} onChange={v => setForm(f => ({ ...f, weight: v, tdee: Math.round(v * 33) }))} />
        </div>
        <Field label="Objetivo" value={form.goal} onChange={v => setForm(f => ({ ...f, goal: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Meses no Plano" type="number" value={form.planMonths} min={1} onChange={v => setForm(f => ({ ...f, planMonths: v }))} />
          <Field label="Meses Treinando" type="number" value={form.trainingMonths} min={0} onChange={v => setForm(f => ({ ...f, trainingMonths: v }))} />
        </div>
        <Field label="TDEE (kcal/dia)" type="number" value={form.tdee}
          onChange={v => setForm(f => ({ ...f, tdee: v }))}
          note="Editar o TDEE recalculará os meses não editados da dieta." />

        {/* Senha de acesso */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
            <Lock size={10} /> Senha de Acesso do Aluno
          </label>
          <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full bg-gray-800/80 border border-cyan-400/20 rounded-xl px-3 py-2.5 text-sm text-gray-100
              placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 font-mono tracking-widest" />
          <p className="text-xs text-gray-700">O aluno usa o próprio nome + esta senha para fazer login.</p>
        </div>

        {/* Fase atual */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Fase Atual</label>
          <div className="grid grid-cols-3 gap-2">
            {CUTTING_PHASES.map((ph, idx) => (
              <button key={idx} onClick={() => setForm(f => ({ ...f, currentDietMonth: idx + 1 }))}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all
                  ${form.currentDietMonth === idx + 1 ? `${ph.tw.bg} ${ph.tw.border} ${ph.tw.text}` : "bg-gray-800 border-gray-700 text-gray-600 hover:border-gray-600"}`}>
                Mês {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Cor do Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {presetColors.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                className={`w-9 h-9 rounded-xl border-2 transition-all ${form.avatarColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div className="bg-cyan-400/5 border border-cyan-400/15 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1"><Droplets size={14} className="text-cyan-400" /><p className="text-xs font-bold text-cyan-400">Hidratação Calculada</p></div>
          <p className="text-2xl font-black text-gray-100 font-mono">{calcHydrationL(form.weight)}L
            <span className="text-sm text-gray-600 font-normal ml-2">({calcHydrationMl(form.weight)} ml)</span></p>
          <p className="text-xs text-gray-700 mt-1">Fórmula: {form.weight}kg × 0.45</p>
        </div>
      </div>

      <button onClick={handleSave}
        className={`w-full py-4 rounded-xl font-black text-sm transition-all active:scale-95 ${saved ? "bg-emerald-500 text-white" : "text-gray-950 hover:opacity-90"}`}
        style={!saved ? { background: "linear-gradient(135deg,#22D3EE,#34D399)" } : {}}>
        {saved ? <><CheckCircle2 size={15} className="inline mr-2" />Salvo!</> : <><Save size={15} className="inline mr-2" />Salvar Alterações</>}
      </button>

      {onDelete && (
        <button onClick={() => { if (window.confirm("Remover este aluno?")) onDelete(); }}
          className="w-full py-3 rounded-xl font-bold text-sm text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all">
          <Trash2 size={14} className="inline mr-2" />Remover Aluno
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 11 — STUDENT APP (visão autenticada do aluno)
   ═══════════════════════════════════════════════════════════════════════════ */

function StudentApp({ student, onUpdate, onLogout }) {
  const [activeTab, setActiveTab] = useState("workout");
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [hydrationMl, setHydrationMl] = useState(0);

  const meta      = calcHydrationMl(student.weight);
  const dietData  = student.diet?.[student.currentDietMonth - 1];
  const phase     = CUTTING_PHASES[student.currentDietMonth - 1];
  const hydrPct   = Math.min((hydrationMl / meta) * 100, 100);
  const monthPlan = student.mealPlan?.[student.currentDietMonth - 1] || [];

  const completedExercises = useMemo(() => {
    if (!student.workout[activeDayIdx]) return 0;
    return student.workout[activeDayIdx].exercises.filter(e =>
      (e.rirPerSet && e.rirPerSet.some(r => r !== null)) ||
      e.rirValue !== null && e.rirValue !== undefined ||
      e.weightUsed || e.intensity > 0
    ).length;
  }, [student.workout, activeDayIdx]);
  const totalExercises = student.workout[activeDayIdx]?.exercises.length || 0;

  return (
    <div className="max-w-lg mx-auto min-h-screen"
      style={{ background: "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 70%)" }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-gray-950/95 sticky top-0 z-20 backdrop-blur-sm border-b border-gray-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white"
              style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>CF</div>
            <span className="text-xs font-bold text-gray-500">Consultoria Fialho</span>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800">
            <LogOut size={13} /> Sair
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Avatar name={student.name} color={student.avatarColor} size="lg" />
          <div>
            <h1 className="text-xl font-black text-white">Olá, {student.name.split(" ")[0]}! 👋</h1>
            <p className="text-sm text-gray-500">{student.goal}</p>
            {phase && (
              <span className={`text-xs font-bold ${phase.tw.text} mt-0.5 inline-block`}>
                📍 {phase.name} — Mês {student.currentDietMonth}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
          {[
            { id: "workout", label: "Treino",    icon: Dumbbell },
            { id: "diet",    label: "Dieta",     icon: Leaf },
            { id: "meals",   label: "Refeições", icon: Utensils },
            { id: "water",   label: "Água",      icon: Droplets },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all
                ${activeTab === id ? "bg-gray-700 text-gray-100 shadow-sm" : "text-gray-600 hover:text-gray-400"}`}>
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-24 space-y-4 pt-4">

        {/* TAB: TREINO */}
        {activeTab === "workout" && (
          <>
            {student.workout[activeDayIdx] && totalExercises > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" /> Progresso
                  </h2>
                  <span className="text-xs text-gray-600">{completedExercises}/{totalExercises} registrados</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(completedExercises/totalExercises)*100}%`, background: "linear-gradient(90deg,#22D3EE,#34D399)" }} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {[
                      { v: 0, c: "#F87171" }, { v: 1, c: "#FB923C" }, { v: 2, c: "#FBBF24" },
                      { v: 3, c: "#A3E635" }, { v: 4, c: "#34D399" },
                    ].map(({ v, c }) => (
                      <div key={v} className="flex items-center gap-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                        <span className="text-xs text-gray-700">{v === 4 ? "4+" : v}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-700">= RIR</span>
                </div>
              </div>
            )}
            <WorkoutTab student={student} onUpdate={onUpdate} isAdmin={false} />
          </>
        )}

        {/* TAB: DIETA */}
        {activeTab === "diet" && dietData && phase && (
          <>
            <div className={`border rounded-2xl p-5 ${phase.tw.bg} ${phase.tw.border}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-bold ${phase.tw.text} flex items-center gap-2`}>
                  <Leaf size={15} /> {phase.name}
                </h2>
                <span className="text-2xl font-black text-gray-100 font-mono">{dietData.calories}<span className="text-sm text-gray-500 font-normal ml-1">kcal</span></span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[{l:"Proteína",v:dietData.protein,c:"#60A5FA"},{l:"Carbo",v:dietData.carbs,c:"#34D399"},{l:"Gordura",v:dietData.fat,c:"#FB923C"}].map(({l,v,c}) => (
                  <div key={l} className="bg-gray-900/40 rounded-xl p-3 text-center">
                    <p className="text-lg font-black font-mono" style={{ color: c }}>{v}g</p>
                    <p className="text-xs text-gray-600">{l}</p>
                  </div>
                ))}
              </div>
              {dietData.customNotes && (
                <div className="bg-gray-900/30 rounded-xl p-3 border border-gray-700/40">
                  <p className="text-xs text-gray-400 italic">📋 "{dietData.customNotes}"</p>
                </div>
              )}
              {phase.carbCycle && (
                <div className="mt-2 pt-2 border-t border-gray-700/40">
                  <p className={`text-xs font-bold ${phase.tw.text}`}>
                    ↺ Ciclo: {phase.carbCycle.lowDays} dias baixo / {phase.carbCycle.highDays} dia(s) alto
                  </p>
                </div>
              )}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3">
                <Info size={14} className="text-gray-600" /> Dicas da Semana
              </h2>
              <ul className="space-y-2">
                {phase.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-cyan-500 mt-0.5 flex-shrink-0">✦</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* TAB: REFEIÇÕES */}
        {activeTab === "meals" && (
          <div className="space-y-3">
            {phase && dietData && (
              <div className={`border rounded-2xl p-3.5 ${phase.tw.bg} ${phase.tw.border}`}>
                <p className={`text-xs font-bold ${phase.tw.text}`}>{phase.name} — {dietData.calories} kcal / dia</p>
                <p className="text-xs text-gray-500 mt-0.5">P:{dietData.protein}g · C:{dietData.carbs}g · G:{dietData.fat}g</p>
              </div>
            )}
            {monthPlan.length === 0 ? (
              <div className="text-center py-12 text-gray-700">
                <Utensils size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhuma refeição definida</p>
                <p className="text-xs mt-1">Aguarde seu coach montar seu plano alimentar.</p>
              </div>
            ) : (
              <>
                <div className="px-1 py-2">
                  <p className="text-xs text-gray-600 flex items-center gap-1.5">
                    <ArrowLeftRight size={11} className="text-cyan-500" />
                    Toque nos gramas para digitar a quantidade exata. Use <span className="text-cyan-400 font-bold">↔</span> para trocar alimentos com macros equivalentes.
                  </p>
                </div>
                <MealPlanTab student={student} onUpdate={onUpdate} isAdmin={false} />
              </>
            )}
          </div>
        )}

        {/* TAB: ÁGUA */}
        {activeTab === "water" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Droplets size={15} className="text-cyan-400" /> Hidratação
              </h2>
              <span className="font-mono text-sm font-bold text-cyan-400">{hydrationMl}ml / {meta}ml</span>
            </div>

            <div className="relative">
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${hydrPct}%`, background: hydrPct >= 100 ? "linear-gradient(90deg,#34D399,#22D3EE)" : "linear-gradient(90deg,#22D3EE,#60A5FA)" }} />
              </div>
              <p className="text-xs text-gray-600 text-right mt-1">{Math.round(hydrPct)}% da meta diária</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[200, 300, 500, 1000].map(ml => (
                <button key={ml} onClick={() => setHydrationMl(h => Math.min(h + ml, meta + 500))}
                  className="py-3 rounded-xl bg-gray-800 border border-gray-700 text-xs font-bold text-gray-400
                    hover:bg-cyan-400/10 hover:border-cyan-400/30 hover:text-cyan-400 transition-all active:scale-95">
                  +{ml >= 1000 ? "1L" : `${ml}ml`}
                </button>
              ))}
            </div>

            {hydrationMl >= meta && (
              <div className="text-center py-3 bg-emerald-400/10 rounded-2xl border border-emerald-400/20">
                <p className="text-emerald-400 text-sm font-black">🎉 Meta atingida! Ótimo trabalho!</p>
              </div>
            )}
            <button onClick={() => setHydrationMl(0)}
              className="w-full py-2.5 rounded-xl bg-gray-800 text-xs text-gray-600 hover:text-gray-400 font-bold">
              Zerar contador
            </button>

            <div className="bg-gray-800/50 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Meta recomendada para <span className="text-gray-300 font-bold">{student.weight}kg</span></p>
              <p className="text-3xl font-black text-cyan-400 font-mono">{calcHydrationL(student.weight)}L</p>
              <p className="text-xs text-gray-600 mt-1">Fórmula: {student.weight}kg × 0.45</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEÇÃO 12 — ROOT COMPONENT (com login persistente)
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "cf_fialho_v1";
const AUTH_KEY    = "cf_auth_session_v1";

const INITIAL_STUDENTS = [
  createStudent({
    name: "Carlos Mendes", password: "carlos123", age: 28, weight: 85, tdee: 2800,
    goal: "Definição muscular para o verão", planMonths: 6, trainingMonths: 3,
    paymentStatus: "paid", currentDietMonth: 2, avatarColor: "#3B82F6",
    gallery: [
      { id: "g1", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", date: "2024-11-01", desc: "Início do protocolo" },
      { id: "g2", url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400", date: "2025-01-15", desc: "Mês 2 — Progresso visível" },
    ],
  }),
  createStudent({
    name: "Mariana Souza", password: "mariana456", age: 24, weight: 62, tdee: 2100,
    goal: "Emagrecimento e tonificação", planMonths: 4, trainingMonths: 1,
    paymentStatus: "pending", currentDietMonth: 1, avatarColor: "#EC4899",
  }),
];

export default function App() {
  const [auth, setAuth] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [students, setStudents, loaded] = useSharedStorage(STORAGE_KEY, INITIAL_STUDENTS);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(AUTH_KEY, false);
        if (result?.value) {
          const saved = JSON.parse(result.value);
          setAuth(saved);
        }
      } catch {}
      setAuthLoaded(true);
    })();
  }, []);

  const handleLogin = useCallback((authData) => {
    setAuth(authData);
    window.storage.set(AUTH_KEY, JSON.stringify(authData), false).catch(() => {});
  }, []);

  const handleLogout = useCallback(() => {
    setAuth(null);
    window.storage.delete(AUTH_KEY, false).catch(() => {});
  }, []);

  const handleUpdateStudent = useCallback((updated) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  }, [setStudents]);

  // Loading screen
  if (!loaded || !authLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.08) 0%, #030712 70%)" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&family=DM+Mono:wght@500&display=swap');
          * { font-family: 'DM Sans', system-ui, sans-serif; }
          .font-mono { font-family: 'DM Mono', monospace !important; }
          @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
          .pulse { animation: pulse 1.5s ease-in-out infinite; }
          @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
          input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.5); }
        `}</style>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black text-white pulse"
          style={{ background: "linear-gradient(135deg,#22D3EE,#34D399)" }}>CF</div>
        <p className="text-gray-600 text-sm">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&family=DM+Mono:wght@500&display=swap');
        * { font-family: 'DM Sans', system-ui, sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace !important; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.5); }
      `}</style>

      {!auth && (
        <LoginScreen students={students} onLogin={handleLogin} />
      )}

      {auth?.role === "admin" && (
        <AdminApp
          students={students}
          setStudents={setStudents}
          onLogout={handleLogout}
        />
      )}

      {auth?.role === "student" && (() => {
        const student = students.find(s => s.id === auth.studentId);
        if (!student) { handleLogout(); return null; }
        return <StudentApp student={student} onUpdate={handleUpdateStudent} onLogout={handleLogout} />;
      })()}
    </div>
  );
}
