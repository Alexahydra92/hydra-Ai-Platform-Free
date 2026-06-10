'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  RotateCcw,
  Square,
  Menu,
  Key,
  Zap,
  ChevronDown,
  X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'

// ─── Types ───────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  model: string
}

interface Settings {
  apiKey: string
  model: string
  baseUrl: string
  systemPrompt: string
  temperature: number
}

// ─── Constants ───────────────────────────────────────────────────────
const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'DeepSeek' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', provider: 'DeepSeek' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
  { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', provider: 'Groq' },
  { value: 'qwen/qwen3-235b-a22b', label: 'Qwen3 235B', provider: 'OpenRouter' },
]

const PROVIDER_BASE_URLS: Record<string, string> = {
  OpenAI: 'https://api.openai.com/v1',
  Anthropic: 'https://api.anthropic.com/v1',
  DeepSeek: 'https://api.deepseek.com/v1',
  Google: 'https://generativelanguage.googleapis.com/v1beta/openai',
  Groq: 'https://api.groq.com/openai/v1',
  OpenRouter: 'https://openrouter.ai/api/v1',
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
  systemPrompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
}

const SUGGESTIONS = [
  { icon: '✍️', title: 'Tulis sebuah cerita pendek', desc: 'tentang petualangan di luar angkasa' },
  { icon: '💻', title: 'Buatkan kode Python', desc: 'untuk web scraper sederhana' },
  { icon: '🧠', title: 'Jelaskan konsep', desc: 'machine learning dengan analogi sederhana' },
  { icon: '📊', title: 'Buat rencana bisnis', desc: 'untuk startup teknologi' },
]

// ─── Helper ──────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

function getProvider(model: string) {
  return MODELS.find(m => m.value === model)?.provider || 'OpenAI'
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
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Tersalin' : 'Salin'}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.85rem',
        }}
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
          : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
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
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="mb-2 list-disc pl-4">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="mb-2 list-decimal pl-4">{children}</ol>
                  },
                  h1({ children }) {
                    return <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>
                  },
                  h2({ children }) {
                    return <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>
                  },
                  h3({ children }) {
                    return <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>
                  },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground">{children}</blockquote>
                  },
                  a({ href, children }) {
                    return <a href={href} className="text-violet-500 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
                  },
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

// ─── Main App ────────────────────────────────────────────────────────
export default function AIPlatform() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const activeChat = chats.find(c => c.id === activeChatId)
  const messages = activeChat?.messages || []

  // Load from localStorage
  useEffect(() => {
    setMounted(true)
    const savedSettings = localStorage.getItem('ai-platform-settings')
    const savedChats = localStorage.getItem('ai-platform-chats')
    const savedActiveChat = localStorage.getItem('ai-platform-active-chat')

    if (savedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) })
      } catch { /* ignore */ }
    }
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats)
        setChats(parsed.map((c: Chat) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          messages: c.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        })))
      } catch { /* ignore */ }
    }
    if (savedActiveChat) {
      setActiveChatId(savedActiveChat)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('ai-platform-settings', JSON.stringify(settings))
    }
  }, [settings, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('ai-platform-chats', JSON.stringify(chats))
    }
  }, [chats, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('ai-platform-active-chat', activeChatId || '')
    }
  }, [activeChatId, mounted])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

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

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId))
    if (activeChatId === chatId) {
      setActiveChatId(null)
    }
  }, [activeChatId])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    if (streamingContent && activeChatId) {
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date(),
      }
      setChats(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, assistantMessage] }
          : c
      ))
      setStreamingContent('')
    }
  }, [streamingContent, activeChatId])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    if (!settings.apiKey) {
      setSettingsOpen(true)
      return
    }

    let chatId = activeChatId
    if (!chatId) {
      const newChat: Chat = {
        id: generateId(),
        title: 'Percakapan Baru',
        messages: [],
        createdAt: new Date(),
        model: settings.model,
      }
      setChats(prev => [newChat, ...prev])
      chatId = newChat.id
      setActiveChatId(chatId)
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const updatedChats = chats.map(c =>
      c.id === chatId ? { ...c, messages: [...c.messages, userMessage] } : c
    )
    setChats(updatedChats)
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    // Prepare messages for API
    const apiMessages = [
      ...(settings.systemPrompt ? [{ role: 'system' as const, content: settings.systemPrompt }] : []),
      ...(updatedChats.find(c => c.id === chatId)?.messages || []).map(m => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          apiKey: settings.apiKey,
          model: settings.model,
          baseUrl: settings.baseUrl,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal mendapatkan respons')
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
                if (content) {
                  fullContent += content
                  setStreamingContent(fullContent)
                }
              } catch {
                // skip invalid JSON
              }
            }
          }
        }
      }

      // Save assistant message
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
      }

      setChats(prev => {
        const updated = prev.map(c => {
          if (c.id === chatId) {
            const newMessages = [...c.messages, assistantMessage]
            const title = c.messages.length === 0
              ? userMessage.content.substring(0, 40) + (userMessage.content.length > 40 ? '...' : '')
              : c.title
            return { ...c, messages: newMessages, title }
          }
          return c
        })
        return updated
      })
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ Error: ${errorMessage}`,
        timestamp: new Date(),
      }
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...c.messages, errorMsg] } : c
      ))
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }, [input, isLoading, settings, activeChatId, chats])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleModelChange = (value: string) => {
    const provider = getProvider(value)
    const baseUrl = PROVIDER_BASE_URLS[provider] || 'https://api.openai.com/v1'
    setSettings(prev => ({ ...prev, model: value, baseUrl }))
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const clearAllChats = () => {
    setChats([])
    setActiveChatId(null)
  }

  const currentProvider = getProvider(settings.model)

  // ─── Settings Dialog Content ─────────────────────────────────
  const settingsContent = (
    <div className="space-y-6">
      {/* API Key */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Key className="h-4 w-4" /> API Key
        </Label>
        <div className="relative">
          <Input
            type={apiKeyVisible ? 'text' : 'password'}
            placeholder="Masukkan API key Anda..."
            value={settings.apiKey}
            onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
            className="pr-20"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
            >
              {apiKeyVisible ? 'Sembunyikan' : 'Lihat'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          API key Anda disimpan secara lokal di browser dan tidak pernah dikirim ke server kami.
        </p>
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Model
        </Label>
        <Input
          placeholder="Cari model..."
          value={modelSearch}
          onChange={(e) => setModelSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
          {MODELS
            .filter(m =>
              m.label.toLowerCase().includes(modelSearch.toLowerCase()) ||
              m.provider.toLowerCase().includes(modelSearch.toLowerCase())
            )
            .map((model) => (
              <button
                key={model.value}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  settings.model === model.value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  handleModelChange(model.value)
                  setModelSearch('')
                }}
              >
                <span>{model.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {model.provider}
                </Badge>
              </button>
            ))}
        </div>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Base URL</Label>
        <Input
          placeholder="https://api.openai.com/v1"
          value={settings.baseUrl}
          onChange={(e) => setSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          Otomatis disesuaikan berdasarkan provider. Anda juga bisa menggunakan URL custom untuk provider lain.
        </p>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">System Prompt</Label>
        <Textarea
          placeholder="Anda adalah asisten AI yang membantu..."
          value={settings.systemPrompt}
          onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
          rows={3}
        />
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Temperature: {settings.temperature.toFixed(1)}
        </Label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">0</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground">2</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Nilai rendah = lebih fokus, Nilai tinggi = lebih kreatif
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        <div className={`w-2 h-2 rounded-full ${settings.apiKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-xs text-muted-foreground">
          {settings.apiKey
            ? `Terhubung ke ${currentProvider} (${settings.model})`
            : 'Masukkan API key untuk memulai'
          }
        </span>
      </div>
    </div>
  )

  // ─── Sidebar Content ─────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            createNewChat()
            setSidebarOpen(false)
          }}
        >
          <Plus className="h-4 w-4" /> Percakapan Baru
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Belum ada percakapan
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeChatId === chat.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setActiveChatId(chat.id)
                  setSidebarOpen(false)
                }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{chat.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteChat(chat.id)
                  }}
                >
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
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={clearAllChats}
          >
            <Trash2 className="h-4 w-4" /> Hapus Semua
          </Button>
        )}
        {/* Mobile settings */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 lg:hidden">
              <Settings className="h-4 w-4" /> Pengaturan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pengaturan</DialogTitle>
              <DialogDescription>Konfigurasi API dan preferensi Anda</DialogDescription>
            </DialogHeader>
            {settingsContent}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Memuat...</span>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 border-r border-border flex-col bg-muted/30">
          <div className="p-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">AI Platform</h1>
              <p className="text-[10px] text-muted-foreground">Multi-Provider AI Chat</p>
            </div>
          </div>
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {/* Mobile sidebar toggle */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="p-4 pb-0">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      AI Platform
                    </SheetTitle>
                  </SheetHeader>
                  {sidebarContent}
                </SheetContent>
              </Sheet>

              <div>
                <h2 className="text-sm font-medium">
                  {activeChat?.title || 'AI Platform'}
                </h2>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                    <Zap className="h-2.5 w-2.5" /> {MODELS.find(m => m.value === settings.model)?.label || settings.model}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {currentProvider}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ganti tema</TooltipContent>
              </Tooltip>

              {/* Settings - Desktop */}
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden lg:flex">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Pengaturan</DialogTitle>
                    <DialogDescription>Konfigurasi API dan preferensi Anda</DialogDescription>
                  </DialogHeader>
                  {settingsContent}
                </DialogContent>
              </Dialog>

              {/* Quick API Key */}
              {!settings.apiKey && (
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5 h-8 text-xs">
                      <Key className="h-3.5 w-3.5" /> Set API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Pengaturan</DialogTitle>
                      <DialogDescription>Konfigurasi API dan preferensi Anda</DialogDescription>
                    </DialogHeader>
                    {settingsContent}
                  </DialogContent>
                </Dialog>
              )}

              {/* New Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={createNewChat}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Percakapan baru</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4">
                <div className="max-w-2xl w-full text-center space-y-8">
                  {/* Hero */}
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Selamat Datang di AI Platform
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Platform chat AI multi-provider. Masukkan API key Anda, pilih model, dan mulai berbicara dengan AI.
                    </p>
                  </div>

                  {/* Quick Setup */}
                  {!settings.apiKey && (
                    <div className="bg-muted/50 border border-border rounded-xl p-4 max-w-sm mx-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-medium">Mulai dengan API Key</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Masukkan API key dari OpenAI, Anthropic, DeepSeek, Google, Groq, atau OpenRouter.
                      </p>
                      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="w-full gap-2">
                            <Key className="h-3.5 w-3.5" /> Atur API Key
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Pengaturan</DialogTitle>
                            <DialogDescription>Konfigurasi API dan preferensi Anda</DialogDescription>
                          </DialogHeader>
                          {settingsContent}
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setInput(`${s.title} ${s.desc}`)
                          textareaRef.current?.focus()
                        }}
                      >
                        <span className="text-lg">{s.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Supported Providers */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Provider Didukung</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['OpenAI', 'Anthropic', 'DeepSeek', 'Google', 'Groq', 'OpenRouter'].map(p => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-2">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} onCopy={handleCopy} />
                ))}
                {streamingContent && (
                  <MessageBubble
                    message={{
                      id: 'streaming',
                      role: 'assistant',
                      content: streamingContent,
                      timestamp: new Date(),
                    }}
                    onCopy={handleCopy}
                  />
                )}
                {isLoading && !streamingContent && (
                  <div className="flex gap-3 py-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
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
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      !settings.apiKey
                        ? 'Atur API key terlebih dahulu...'
                        : 'Ketik pesan Anda...'
                    }
                    disabled={isLoading}
                    className="resize-none min-h-[44px] max-h-[200px] pr-12 rounded-xl"
                    rows={1}
                  />
                </div>
                {isLoading ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-11 w-11 rounded-xl p-0"
                    onClick={stopGeneration}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-11 w-11 rounded-xl p-0"
                    onClick={sendMessage}
                    disabled={!input.trim() || !settings.apiKey}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        {MODELS.find(m => m.value === settings.model)?.label || settings.model}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
                      {Object.entries(
                        MODELS.reduce((acc, m) => {
                          if (!acc[m.provider]) acc[m.provider] = []
                          acc[m.provider].push(m)
                          return acc
                        }, {} as Record<string, typeof MODELS>)
                      ).map(([provider, models]) => (
                        <div key={provider}>
                          <DropdownMenuSeparator />
                          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{provider}</p>
                          {models.map((model) => (
                            <DropdownMenuItem
                              key={model.value}
                              onClick={() => handleModelChange(model.value)}
                              className={settings.model === model.value ? 'bg-primary/10' : ''}
                            >
                              {model.label}
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Shift + Enter untuk baris baru
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
