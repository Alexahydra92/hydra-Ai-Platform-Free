'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Send,
  Settings,
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  User,
  Sparkles,
  Moon,
  Sun,
  Copy,
  Check,
  Square,
  Menu,
  Key,
  Zap,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  MessageCircle,
  Shield,
  BarChart3,
  Clock,
  Activity,
  Eye,
  EyeOff,
  Paperclip,
  Image as ImageIcon,
  Search,
  Code,
  Brain,
  X,
  FileText,
  Loader2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  dbId?: string
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  model: string
  synced?: boolean
}

interface Settings {
  apiKey: string
  model: string
  baseUrl: string
  systemPrompt: string
  temperature: number
}

interface DashboardStats {
  totalChats: number
  totalMessages: number
  recentChats: number
  modelStats: Record<string, number>
}

// ─── Constants ───────────────────────────────────────────────────────
const BRAND = {
  name: 'Hydra AI',
  tagline: 'Multi-Model Intelligence',
}

const DEFAULT_AI = { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'Default' }

const MODELS = [
  DEFAULT_AI,
  // ─── OpenAI ────────────────────
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  // ─── Anthropic ─────────────────
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'Anthropic' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  // ─── Google ────────────────────
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
  { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
  // ─── DeepSeek ──────────────────
  { value: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'DeepSeek' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', provider: 'DeepSeek' },
  // ─── Groq ──────────────────────
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', provider: 'Groq' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', provider: 'Groq' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', provider: 'Groq' },
  // ─── OpenRouter ────────────────
  { value: 'qwen/qwen3-235b-a22b', label: 'Qwen3 235B', provider: 'OpenRouter' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'OpenRouter' },
  { value: 'google/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash', provider: 'OpenRouter' },
  // ─── Mistral ───────────────────
  { value: 'mistral-large-latest', label: 'Mistral Large', provider: 'Mistral' },
  { value: 'mistral-small-latest', label: 'Mistral Small', provider: 'Mistral' },
  // ─── Together AI ───────────────
  { value: 'meta-llama/Llama-3-70b-chat-hf', label: 'Llama 3 70B', provider: 'Together' },
  { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B', provider: 'Together' },
]

const PROVIDER_BASE_URLS: Record<string, string> = {
  Default: 'https://api.openai.com/v1',
  OpenAI: 'https://api.openai.com/v1',
  Anthropic: 'https://api.anthropic.com/v1',
  DeepSeek: 'https://api.deepseek.com/v1',
  Google: 'https://generativelanguage.googleapis.com/v1beta/openai',
  Groq: 'https://api.groq.com/openai/v1',
  OpenRouter: 'https://openrouter.ai/api/v1',
  Mistral: 'https://api.mistral.ai/v1',
  Together: 'https://api.together.xyz/v1',
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gpt-4o-mini',
  baseUrl: '',
  systemPrompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
}

// ─── Guest limits ────────────────────────────────────────────────────
// Guest mode: unlimited (no message limit)

// ─── Safe JSON parser ──────────────────────────────────────────────
async function safeJsonParse<T = unknown>(response: Response): Promise<T | null> {
  try {
    const text = await response.text()
    if (!text || text.trim().startsWith('<')) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

function getProvider(model: string) {
  return MODELS.find(m => m.value === model)?.provider || 'OpenAI'
}

// ─── Hydra Logo Component ────────────────────────────────────────────
function HydraLogo({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} width={size} height={size}>
      <defs>
        <linearGradient id="hydraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4' }} />
          <stop offset="50%" style={{ stopColor: '#0891b2' }} />
          <stop offset="100%" style={{ stopColor: '#0e7490' }} />
        </linearGradient>
        <linearGradient id="hydraGlow" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#67e8f9', stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      {/* Main head */}
      <circle cx="60" cy="35" r="16" fill="url(#hydraGrad)" />
      <circle cx="60" cy="35" r="12" fill="none" stroke="#67e8f9" strokeWidth="1" opacity="0.6" />
      {/* Left head */}
      <circle cx="35" cy="50" r="12" fill="url(#hydraGrad)" />
      <circle cx="35" cy="50" r="8" fill="none" stroke="#67e8f9" strokeWidth="1" opacity="0.6" />
      {/* Right head */}
      <circle cx="85" cy="50" r="12" fill="url(#hydraGrad)" />
      <circle cx="85" cy="50" r="8" fill="none" stroke="#67e8f9" strokeWidth="1" opacity="0.6" />
      {/* Body connections */}
      <path d="M55 48 Q50 55 40 53" stroke="url(#hydraGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M65 48 Q70 55 80 53" stroke="url(#hydraGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Body */}
      <path d="M45 65 Q60 80 75 65 Q80 90 60 100 Q40 90 45 65Z" fill="url(#hydraGrad)" opacity="0.9" />
      {/* Eyes */}
      <circle cx="55" cy="33" r="2.5" fill="#67e8f9" />
      <circle cx="65" cy="33" r="2.5" fill="#67e8f9" />
      <circle cx="32" cy="48" r="2" fill="#67e8f9" />
      <circle cx="38" cy="48" r="2" fill="#67e8f9" />
      <circle cx="82" cy="48" r="2" fill="#67e8f9" />
      <circle cx="88" cy="48" r="2" fill="#67e8f9" />
      {/* Glow particles */}
      <circle cx="60" cy="20" r="1.5" fill="#67e8f9" opacity="0.6" />
      <circle cx="25" cy="38" r="1" fill="#67e8f9" opacity="0.4" />
      <circle cx="95" cy="38" r="1" fill="#67e8f9" opacity="0.4" />
      <circle cx="50" cy="14" r="1" fill="#67e8f9" opacity="0.5" />
      <circle cx="70" cy="14" r="1" fill="#67e8f9" opacity="0.5" />
    </svg>
  )
}

// ─── Splash Screen ───────────────────────────────────────────────────
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'steady' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('steady'), 400)
    const t2 = setTimeout(() => setPhase('exit'), 2200)
    const t3 = setTimeout(() => onFinish(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0a0f1a]"
      initial={{ opacity: 1 }}
      animate={phase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={phase === 'enter' ? { scale: 0.8, opacity: 0.5 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
          <HydraLogo size={64} />
        </div>

        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={phase !== 'enter' ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        className="mt-8 text-center"
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Hydra <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">AI</span>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={phase === 'steady' ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-sm text-cyan-400/70 mt-2 tracking-wide"
        >
          Multi-Model Intelligence
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={phase !== 'enter' ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-10 w-48 h-1 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.8, delay: 0.3, ease: 'easeInOut' }}
        />
      </motion.div>

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
          style={{
            left: `${45 + Math.random() * 10}%`,
            top: `${40 + Math.random() * 10}%`,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: [0, -40 - Math.random() * 30],
            opacity: [0, 0.6, 0],
            x: [(Math.random() - 0.5) * 20],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: 0.5 + i * 0.3,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  )
}

// ─── Code Block Component ────────────────────────────────────────────
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace('language-', '') || 'text'

  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-muted/80 px-4 py-2 text-xs text-muted-foreground">
        <span>{language}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Tersalin' : 'Salin'}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.85rem' }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────
function MessageBubble({ message, onCopy }: { message: Message; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 py-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <HydraLogo size={18} />}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-left rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card border border-border rounded-bl-md'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const isInline = !className
                    const content = String(children).replace(/\n$/, '')
                    if (isInline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      )
                    }
                    return <CodeBlock className={className}>{content}</CodeBlock>
                  },
                  p({ children }) { return <p className="mb-2 last:mb-0">{children}</p> },
                  ul({ children }) { return <ul className="mb-2 list-disc pl-4">{children}</ul> },
                  ol({ children }) { return <ol className="mb-2 list-decimal pl-4">{children}</ol> },
                  h1({ children }) { return <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1> },
                  h2({ children }) { return <h2 className="text-base font-bold mb-2 mt-3">{children}</h2> },
                  h3({ children }) { return <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3> },
                  blockquote({ children }) { return <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground">{children}</blockquote> },
                  a({ href, children }) { return <a href={href} className="text-cyan-500 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a> },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={handleCopy}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Salin pesan</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Component ─────────────────────────────────────────────
function DashboardView() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chats, setChats] = useState<Array<{ id: string; title: string; model: string; createdAt: string; _count: { messages: number } }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/user')
        if (res.ok) {
          const data = await safeJsonParse<{ stats: DashboardStats; chats: Array<{ id: string; title: string; model: string; createdAt: string; _count: { messages: number } }> }>(res)
          if (data) {
            setStats(data.stats)
            setChats(data.chats || [])
          }
        }
      } catch (err) {
        console.error('Fetch stats error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const modelLabels: Record<string, string> = {}
  MODELS.forEach(m => { modelLabels[m.value] = m.label })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center animate-pulse">
            <HydraLogo size={24} />
          </div>
          <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* User Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-500/20">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4 mr-1" /> Keluar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalChats || 0}</p>
                <p className="text-xs text-muted-foreground">Total Percakapan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
                <p className="text-xs text-muted-foreground">Total Pesan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.recentChats || 0}</p>
                <p className="text-xs text-muted-foreground">Chat 7 Hari Terakhir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage */}
      {stats?.modelStats && Object.keys(stats.modelStats).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-500" /> Penggunaan Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.modelStats).map(([model, count]) => {
                const total = Object.values(stats.modelStats).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={model} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{modelLabels[model] || model}</span>
                      <span className="text-muted-foreground">{count} chat ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-cyan-500" /> Riwayat Percakapan
          </CardTitle>
          <CardDescription>Percakapan Anda yang tersimpan di server</CardDescription>
        </CardHeader>
        <CardContent>
          {chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada percakapan tersimpan
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div key={chat.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {modelLabels[chat.model] || chat.model}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {chat._count.messages} pesan
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(chat.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────
export default function HydraAI() {
  const { user, isLoading, isAuthenticated, isGuest, enterGuest, logout, loginWithGithub } = useAuth()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat')
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const [chatMode, setChatMode] = useState<'chat' | 'coding' | 'analysis' | 'agent'>('chat')
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeChat = chats.find(c => c.id === activeChatId)
  const messages = activeChat?.messages || []

  // Load from localStorage
  useEffect(() => {
    setMounted(true)
    const hasVisited = localStorage.getItem('hydra-ai-visited')
    if (hasVisited) setShowSplash(false)

    const savedSettings = localStorage.getItem('hydra-ai-settings')
    const savedChats = localStorage.getItem('hydra-ai-chats')
    const savedActiveChat = localStorage.getItem('hydra-ai-active-chat')
    const savedGuestCount = localStorage.getItem('hydra-guest-msg-count')
    const savedChatMode = localStorage.getItem('hydra-ai-chat-mode')

    if (savedSettings) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }) } catch { /* ignore */ }
    }
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats)
        setChats(parsed.map((c: Chat) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          messages: c.messages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })),
        })))
      } catch { /* ignore */ }
    }
    if (savedActiveChat) setActiveChatId(savedActiveChat)
    if (savedGuestCount) setGuestMessageCount(parseInt(savedGuestCount))
    if (savedChatMode && ['chat', 'coding', 'analysis', 'agent'].includes(savedChatMode)) {
      setChatMode(savedChatMode as 'chat' | 'coding' | 'analysis' | 'agent')
    }
  }, [])

  // Load DB chats for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/chats')
        .then(async res => res.ok ? (await safeJsonParse(res)) || [] : [])
        .then(dbChats => {
          if (Array.isArray(dbChats) && dbChats.length > 0) {
            const mapped: Chat[] = dbChats.map((c: { id: string; title: string; model: string; createdAt: string; messages: Array<{ id: string; role: string; content: string; createdAt: string }> }) => ({
              id: c.id,
              title: c.title,
              model: c.model,
              createdAt: new Date(c.createdAt),
              synced: true,
              messages: (c.messages || []).map((m: { id: string; role: string; content: string; createdAt: string }) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
                timestamp: new Date(m.createdAt),
                dbId: m.id,
              })),
            }))
            setChats(prev => {
              // Merge: keep local-only chats, add DB chats
              const localOnly = prev.filter(c => !c.synced)
              return [...mapped, ...localOnly]
            })
          }
        })
        .catch(() => {})
    }
  }, [isAuthenticated])

  // Save to localStorage
  useEffect(() => { if (mounted) localStorage.setItem('hydra-ai-settings', JSON.stringify(settings)) }, [settings, mounted])
  useEffect(() => { if (mounted) localStorage.setItem('hydra-ai-chats', JSON.stringify(chats)) }, [chats, mounted])
  useEffect(() => { if (mounted) localStorage.setItem('hydra-ai-active-chat', activeChatId || '') }, [activeChatId, mounted])
  useEffect(() => { if (mounted) localStorage.setItem('hydra-guest-msg-count', guestMessageCount.toString()) }, [guestMessageCount, mounted])
  useEffect(() => { if (mounted) localStorage.setItem('hydra-ai-chat-mode', chatMode) }, [chatMode, mounted])

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Auto-enter as guest if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isGuest && !isLoading) {
      enterGuest()
    }
  }, [isAuthenticated, isGuest, isLoading, enterGuest])

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false)
    localStorage.setItem('hydra-ai-visited', 'true')
  }, [])

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: generateId(),
      title: 'Percakapan Baru',
      messages: [],
      createdAt: new Date(),
      model: settings.model,
    }
    setChats(prev => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setInput('')
    setStreamingContent('')
  }, [settings.model])

  const deleteChat = useCallback(async (chatId: string) => {
    // Delete from DB if authenticated
    if (isAuthenticated) {
      try { await fetch(`/api/chats/${chatId}`, { method: 'DELETE' }) } catch { /* ignore */ }
    }
    setChats(prev => prev.filter(c => c.id !== chatId))
    if (activeChatId === chatId) setActiveChatId(null)
  }, [activeChatId, isAuthenticated])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null }
    setIsSending(false)
    if (streamingContent && activeChatId) {
      const assistantMessage: Message = { id: generateId(), role: 'assistant', content: streamingContent, timestamp: new Date() }
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, assistantMessage] } : c))
      setStreamingContent('')
    }
  }, [streamingContent, activeChatId])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isSending) return

    // No guest limit - free for all users

    let chatId = activeChatId
    let chatsWithNew: Chat[] = chats
    // Create a new chat if no active chat or active chat doesn't exist in chats array
    if (!chatId || !chats.find(c => c.id === chatId)) {
      const newChat: Chat = { id: generateId(), title: 'Percakapan Baru', messages: [], createdAt: new Date(), model: settings.model }
      chatsWithNew = [newChat, ...chats]
      setChats(chatsWithNew)
      chatId = newChat.id
      setActiveChatId(chatId)
    }

    // Build the message content - store only original input in UI messages
    const originalInput = input.trim()
    let messageContent = originalInput
    if (uploadedFileContent) {
      messageContent = `[File: ${uploadedFileName}]\n${uploadedFileContent}\n\n[User]: ${messageContent}`
    }

    // Store the original input in the chat messages (clean UI display)
    const userMessage: Message = { id: generateId(), role: 'user', content: originalInput, timestamp: new Date() }
    const updatedChats = chatsWithNew.map(c => c.id === chatId ? { ...c, messages: [...c.messages, userMessage] } : c)
    setChats(updatedChats)
    setInput('')
    setIsSending(true)
    setStreamingContent('')

    // Agent mode: search first
    let searchResults = null
    if (chatMode === 'agent') {
      setIsSearching(true)
      try {
        const searchRes = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: originalInput }),
        })
        if (searchRes.ok) {
          const searchData = await safeJsonParse<{ results: Array<Record<string, unknown>> }>(searchRes)
          if (searchData) searchResults = searchData.results
        }
      } catch (err) {
        console.error('Search error:', err)
      }
      setIsSearching(false)
    }

    // No guest limit tracking needed

    // Build API messages with the full content (including file prepend) for the last user message
    const apiMessagesRaw = [
      ...(settings.systemPrompt ? [{ role: 'system' as const, content: settings.systemPrompt }] : []),
      ...(updatedChats.find(c => c.id === chatId)?.messages || []).map(m => ({ role: m.role, content: m.content })),
    ]

    // Replace the last user message content with the full content (including file prepend)
    const apiMessages = apiMessagesRaw.map((m, idx) => {
      if (m.role === 'user' && idx === apiMessagesRaw.length - 1) {
        return { role: m.role, content: messageContent }
      }
      return m
    })

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Capture current upload states before clearing
    const currentUploadedImage = uploadedImage

    // Clear uploaded files/images after preparing the message
    setUploadedFileContent(null)
    setUploadedFileName(null)
    setUploadedImage(null)
    setUploadedImageName(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          apiKey: settings.apiKey,
          model: settings.model,
          baseUrl: settings.baseUrl,
          useDefault: !settings.apiKey,
          mode: chatMode,
          imageUrl: currentUploadedImage,
          searchResults: searchResults,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await safeJsonParse<{ error: string }>(response)
        throw new Error(errorData?.error || 'Gagal mendapatkan respons')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) { fullContent += content; setStreamingContent(fullContent) }
              } catch { /* skip */ }
            }
          }
        }
      }

      const assistantMessage: Message = { id: generateId(), role: 'assistant', content: fullContent, timestamp: new Date() }
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          const newMessages = [...c.messages, assistantMessage]
          const title = c.messages.length === 0 ? userMessage.content.substring(0, 40) + (userMessage.content.length > 40 ? '...' : '') : c.title
          return { ...c, messages: newMessages, title }
        }
        return c
      }))

      // Save to DB if authenticated
      if (isAuthenticated) {
        try {
          // Create chat in DB if not synced
          const chat = chats.find(c => c.id === chatId)
          if (!chat?.synced) {
            await fetch('/api/chats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: chat?.title || 'Percakapan Baru', model: settings.model }),
            })
          }
          // Add messages to DB
          await fetch(`/api/chats/${chatId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'user', content: userMessage.content },
                { role: 'assistant', content: fullContent },
              ],
              title: chat?.messages?.length === 0
                ? userMessage.content.substring(0, 40) + (userMessage.content.length > 40 ? '...' : '')
                : undefined,
            }),
          })
        } catch (err) {
          console.error('Save to DB error:', err)
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      const errorMsg: Message = { id: generateId(), role: 'assistant', content: `Error: ${errorMessage}`, timestamp: new Date() }
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, errorMsg] } : c))
    } finally {
      setIsSending(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }, [input, isSending, settings, activeChatId, chats, isAuthenticated, isGuest, guestMessageCount, chatMode, uploadedFileContent, uploadedFileName, uploadedImage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleModelChange = (value: string) => {
    const provider = getProvider(value)
    const baseUrl = PROVIDER_BASE_URLS[provider] || 'https://api.openai.com/v1'
    setSettings(prev => ({ ...prev, model: value, baseUrl }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setUploadedImage(reader.result as string)
        setUploadedImageName(file.name)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
      return
    }

    // Upload document/PDF
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await safeJsonParse<{ text: string; filename: string }>(res)
        if (data) {
          setUploadedFileContent(data.text)
          setUploadedFileName(data.filename)
        }
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
    // Reset the input
    e.target.value = ''
  }

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text) }
  const clearAllChats = async () => {
    if (isAuthenticated) {
      try { await fetch('/api/chats', { method: 'DELETE' }) } catch { /* ignore */ }
    }
    setChats([])
    setActiveChatId(null)
  }
  const currentProvider = getProvider(settings.model)

  const isGuestLimitReached = false // No guest limit - free for all

  // ─── Auth gate ──────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-4">
          <HydraLogo size={48} />
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    )
  }

  // ─── Settings Dialog Content ─────────────────────────────────
  const settingsContent = (
    <div className="space-y-6">
      {/* Default AI Notice */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <HydraLogo size={18} />
        </div>
        <div>
          <p className="text-sm font-medium">AI Default - Siap Digunakan</p>
          <p className="text-xs text-muted-foreground">Powered By @Alexa Hydra</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Key className="h-4 w-4" /> API Key Custom (Opsional)
        </Label>
        <div className="relative">
          <Input
            type={apiKeyVisible ? 'text' : 'password'}
            placeholder="Kosongkan untuk pakai AI default gratis..."
            value={settings.apiKey}
            onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
            className="pr-20"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setApiKeyVisible(!apiKeyVisible)}>
              {apiKeyVisible ? 'Sembunyikan' : 'Lihat'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Opsional: Masukkan API key sendiri untuk menggunakan provider lain (OpenAI, DeepSeek, Groq, Google, dll).
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Model
        </Label>
        <Input placeholder="Cari model..." value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} className="mb-2" />
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
          {MODELS.filter(m => m.label.toLowerCase().includes(modelSearch.toLowerCase()) || m.provider.toLowerCase().includes(modelSearch.toLowerCase())).map((model) => (
            <button
              key={model.value}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${settings.model === model.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => { handleModelChange(model.value); setModelSearch('') }}
            >
              <span>{model.label}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{model.provider}</Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Base URL</Label>
        <Input placeholder="https://api.openai.com/v1" value={settings.baseUrl} onChange={(e) => setSettings(prev => ({ ...prev, baseUrl: e.target.value }))} />
        <p className="text-xs text-muted-foreground">Otomatis disesuaikan berdasarkan provider.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">System Prompt</Label>
        <Textarea placeholder="Anda adalah asisten AI yang membantu..." value={settings.systemPrompt} onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))} rows={3} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Temperature: {settings.temperature.toFixed(1)}</Label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">0</span>
          <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))} className="flex-1" />
          <span className="text-xs text-muted-foreground">2</span>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        <div className={`w-2 h-2 rounded-full ${settings.apiKey ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
        <span className="text-xs text-muted-foreground">
          {settings.apiKey ? `Custom: ${currentProvider} (${settings.model})` : `AI Default (Gratis - Multi-Provider)`}
        </span>
      </div>
    </div>
  )

  // ─── Sidebar Content ─────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { createNewChat(); setSidebarOpen(false) }}>
          <Plus className="h-4 w-4" /> Percakapan Baru
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Belum ada percakapan</div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                onClick={() => { setActiveChatId(chat.id); setSidebarOpen(false) }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{chat.title}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id) }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-3 space-y-2">
        {chats.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={clearAllChats}>
            <Trash2 className="h-4 w-4" /> Hapus Semua
          </Button>
        )}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pengaturan</DialogTitle>
            </DialogHeader>
            {settingsContent}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

  // ─── Main Render ─────────────────────────────────────────────
  return (
    <TooltipProvider>
      <AnimatePresence>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      </AnimatePresence>

      <motion.div
        className="min-h-screen flex bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 border-r border-border flex-col bg-muted/30">
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <HydraLogo size={22} />
            </div>
            <div>
              <h1 className="text-sm font-bold">{BRAND.name}</h1>
              <p className="text-[10px] text-muted-foreground">{BRAND.tagline}</p>
            </div>
          </div>

          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="p-4 pb-0">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                        <HydraLogo size={16} />
                      </div>
                      {BRAND.name}
                    </SheetTitle>
                  </SheetHeader>

                  {sidebarContent}
                </SheetContent>
              </Sheet>

              <div>
                <h2 className="text-sm font-medium">{activeChat?.title || BRAND.name}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Guest badge */}
              {isGuest && !isAuthenticated && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-cyan-500/30 text-cyan-500">
                  Tamu (Gratis)
                </Badge>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ganti tema</TooltipContent>
              </Tooltip>

              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden lg:flex" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={createNewChat}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Percakapan baru</TooltipContent>
              </Tooltip>

              {/* User menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <Separator />
                    <DropdownMenuItem onClick={() => setActiveTab('dashboard')}>
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" /> Pengaturan
                    </DropdownMenuItem>
                    <Separator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Shield className="h-4 w-4 text-amber-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">Mode Tamu</p>
                      <p className="text-xs text-muted-foreground">Login untuk simpan riwayat chat</p>
                    </div>
                    <Separator />
                    <DropdownMenuItem onClick={loginWithGithub}>
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      Login dengan GitHub
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>

          {/* Content Area */}
          {activeTab === 'dashboard' && isAuthenticated ? (
            <div className="flex-1 overflow-y-auto">
              <DashboardView />
            </div>
          ) : (
            <>
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 && !streamingContent ? (
                  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
                    <div className="max-w-md w-full text-center space-y-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-xl shadow-cyan-500/25">
                        <HydraLogo size={36} />
                      </div>
                      <h2 className="text-xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Hydra AI</span>
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Mulai percakapan dengan mengetik pesan di bawah
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto px-4 py-4">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} onCopy={handleCopy} />
                    ))}
                    {streamingContent && (
                      <div className="flex gap-3 py-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                          <HydraLogo size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                              <ReactMarkdown>{streamingContent}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {isSending && !streamingContent && (
                      <div className="flex gap-3 py-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                          <HydraLogo size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-xs text-muted-foreground">Hydra AI sedang berpikir...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
                <div className="max-w-3xl mx-auto">
                  {/* No guest limit - free for all */}

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 mb-2">
                    {[
                      { id: 'chat', icon: MessageCircle, label: 'Chat' },
                      { id: 'coding', icon: Code, label: 'Coding' },
                      { id: 'analysis', icon: Brain, label: 'Analisis' },
                      { id: 'agent', icon: Search, label: 'Agent' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setChatMode(mode.id as 'chat' | 'coding' | 'analysis' | 'agent')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          chatMode === mode.id
                            ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <mode.icon className="h-3 w-3" />
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {/* Searching indicator */}
                  {isSearching && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-cyan-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Mencari informasi...
                    </div>
                  )}

                  {/* Uploading indicator */}
                  {isUploading && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-cyan-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Mengunggah file...
                    </div>
                  )}

                  {/* File/Image Preview */}
                  {(uploadedFileName || uploadedImage) && (
                    <div className="flex gap-2 mb-2">
                      {uploadedFileName && !uploadedImage && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs">
                          <FileText className="h-3.5 w-3.5 text-cyan-500" />
                          <span className="max-w-[150px] truncate">{uploadedFileName}</span>
                          <button onClick={() => { setUploadedFileContent(null); setUploadedFileName(null) }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {uploadedImage && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs">
                          <ImageIcon className="h-3.5 w-3.5 text-cyan-500" />
                          <span className="max-w-[150px] truncate">{uploadedImageName}</span>
                          <button onClick={() => { setUploadedImage(null); setUploadedImageName(null) }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    {/* File Upload Button */}
                    <div className="flex items-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-11 w-11 p-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Upload file</TooltipContent>
                      </Tooltip>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.txt,.md,.js,.ts,.py,.java,.cpp,.c,.html,.css,.json,.csv,.xml,.yaml,.yml,.png,.jpg,.jpeg,.gif,.webp"
                        onChange={handleFileUpload}
                      />
                    </div>

                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder={isGuestLimitReached ? 'Batas tamu tercapai. Login untuk lanjut.' : 'Ketik pesan Anda...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSending || isGuestLimitReached}
                        className="min-h-[44px] max-h-[200px] resize-none pr-2"
                        rows={1}
                      />
                    </div>
                    {isSending ? (
                      <Button variant="destructive" size="sm" className="h-11 w-11 p-0" onClick={stopGeneration}>
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-11 w-11 p-0 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
                        onClick={sendMessage}
                        disabled={!input.trim() || isGuestLimitReached}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Powered By @Alexa Hydra
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Mobile Dashboard FAB */}
          {isAuthenticated && activeTab === 'chat' && (
            <Button
              variant="outline"
              size="sm"
              className="fixed bottom-24 right-4 lg:hidden rounded-full shadow-lg z-20 bg-background"
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
            </Button>
          )}
        </main>
      </motion.div>

      {/* Settings Dialog (desktop) */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pengaturan</DialogTitle>
          </DialogHeader>
          {settingsContent}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
