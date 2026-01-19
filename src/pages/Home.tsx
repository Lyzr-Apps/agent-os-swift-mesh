import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Send, Loader2, User, Users, GraduationCap, Shield,
  MessageSquare, TrendingUp, Calendar, Clock, CheckCircle,
  XCircle, AlertCircle, AlertTriangle, BarChart, FileText,
  Settings, ChevronDown, ChevronUp, Sparkles, Bot, RefreshCw,
  Mail, Bell, Database, Activity, Target, Info
} from 'lucide-react'
import { callAIAgent, type NormalizedAgentResponse } from '@/utils/aiAgent'
import { cn } from '@/lib/utils'

// Agent IDs from workflow.json
const AGENT_IDS = {
  semanticRouter: '696e415ee1e4c42b224b252d',
  orchestrator: '696e4142c3a33af8ef0633c3',
  broadcastComposer: '696e4179e1e4c42b224b2534',
  broadcastSender: '696e4197e1e4c42b224b2535',
}

// TypeScript interfaces from ACTUAL response schemas
interface SemanticRouterResult {
  normalized_query: string
  original_query: string
  intent: string
  confidence: number
  entities: Array<{ type: string; value: string }>
  requires_feedback: boolean
  suggested_clarification: string | null
  routing_recommendation: string
}

interface OrchestratorResult {
  final_answer: string
  agents_invoked: any[]
  routing_hops: number
  confidence_score: number
  sources: any[]
  conversation_state: string
  follow_up_suggestions: string[]
}

interface SchedulerSlot {
  start: string
  end: string
  participants_available: number
}

interface SchedulerConflict {
  participant: string
  time: string
  reason: string
}

interface SchedulerResult {
  available_slots: SchedulerSlot[]
  recommended_slot: {
    start: string
    end: string
    reason: string
  }
  conflicts: SchedulerConflict[]
  participants_checked: string[]
  alternative_dates: string[]
  scheduling_notes: string
}

interface AnalyticsResult {
  trends_identified: any[]
  correlations: any[]
  hypotheses: any[]
  what_if_scenarios: any[]
  anomalies: any[]
  recommendations: any[]
}

interface BroadcastComposerResult {
  draft_message: string
  subject: string
  audience_filter: { role: string }
  estimated_recipients: number
  urgency: string
  scheduled_time: string
  approval_required: boolean
  approval_card_id: string
  preview_text: string
  compliance_check: string
}

interface BroadcastSenderResult {
  broadcast_id: string
  delivery_status: string
  total_recipients: number
  delivered: number
  failed: number
  pending: number
  failed_recipients: Array<{
    recipient_id: string
    reason: string
    retry_count: number
  }>
  delivery_start_time: string
  delivery_end_time: string
  log_entry_id: string
  retry_scheduled: boolean
}

type UserRole = 'student' | 'faculty' | 'admin' | 'principal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  response?: NormalizedAgentResponse
  confidence?: number
  intent?: string
}

interface BroadcastDraft {
  id: string
  result: BroadcastComposerResult
  status: 'draft' | 'approved' | 'sent' | 'failed'
  created_at: Date
}

// Generative UI Components
function ConfidenceBadge({ score }: { score: number }) {
  const getVariant = (score: number) => {
    if (score >= 0.8) return 'default'
    if (score >= 0.5) return 'secondary'
    return 'destructive'
  }

  const getLabel = (score: number) => {
    if (score >= 0.8) return 'High'
    if (score >= 0.5) return 'Medium'
    return 'Low'
  }

  return (
    <Badge variant={getVariant(score)} className="text-xs">
      {getLabel(score)} ({Math.round(score * 100)}%)
    </Badge>
  )
}

function ClarificationCard({
  query,
  entities,
  clarification,
  onClarify
}: {
  query: string
  entities: Array<{ type: string; value: string }>
  clarification: string | null
  onClarify: (clarified: string) => void
}) {
  const [input, setInput] = useState('')

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 text-base">
          <AlertCircle className="h-4 w-4" />
          Need Clarification
        </CardTitle>
        <CardDescription className="text-amber-700">
          {clarification || 'Your query is ambiguous. Please provide more details.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="font-medium text-amber-900 mb-2">Detected entities:</p>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, i) => (
              <Badge key={i} variant="outline" className="text-amber-700">
                {entity.type}: {entity.value}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Clarify your request..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input && onClarify(input)}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => input && onClarify(input)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ApprovalCard({
  draft,
  onApprove,
  onReject,
  loading
}: {
  draft: BroadcastComposerResult
  onApprove: () => void
  onReject: () => void
  loading: boolean
}) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
          <Bell className="h-4 w-4" />
          Broadcast Draft - Approval Required
        </CardTitle>
        <CardDescription className="text-blue-700">
          Review and approve before sending to {draft.estimated_recipients} recipients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium text-blue-900">Subject:</span>
            <p className="mt-1 text-blue-800">{draft.subject}</p>
          </div>
          <div className="text-sm">
            <span className="font-medium text-blue-900">Message:</span>
            <p className="mt-1 text-blue-800 whitespace-pre-wrap">{draft.draft_message}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-blue-700">
              <Users className="h-3 w-3 mr-1" />
              {draft.audience_filter.role}
            </Badge>
            <Badge variant="outline" className="text-blue-700">
              <Target className="h-3 w-3 mr-1" />
              {draft.estimated_recipients} recipients
            </Badge>
            <Badge variant="outline" className="text-blue-700">
              <Clock className="h-3 w-3 mr-1" />
              {draft.urgency}
            </Badge>
            <Badge
              variant={draft.compliance_check === 'passed' ? 'default' : 'destructive'}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {draft.compliance_check}
            </Badge>
          </div>
        </div>
        <Separator />
        <div className="flex gap-2">
          <Button
            onClick={onApprove}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Approve & Send
          </Button>
          <Button
            onClick={onReject}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsCard({ result }: { result: AnalyticsResult }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900 text-base">
          <BarChart className="h-4 w-4" />
          Analytics Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.trends_identified && result.trends_identified.length > 0 && (
          <div className="text-sm">
            <p className="font-medium text-purple-900 mb-2">Trends Identified:</p>
            <ul className="space-y-1 text-purple-800">
              {result.trends_identified.map((trend, i) => (
                <li key={i} className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{typeof trend === 'string' ? trend : JSON.stringify(trend)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendations && result.recommendations.length > 0 && (
          <div className="text-sm">
            <p className="font-medium text-purple-900 mb-2">Recommendations:</p>
            <ul className="space-y-1 text-purple-800">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{typeof rec === 'string' ? rec : JSON.stringify(rec)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(result.correlations?.length > 0 || result.what_if_scenarios?.length > 0) && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-purple-700"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show More
                </>
              )}
            </Button>

            {expanded && (
              <div className="space-y-3 text-sm">
                {result.correlations && result.correlations.length > 0 && (
                  <div>
                    <p className="font-medium text-purple-900 mb-2">Correlations:</p>
                    <ul className="space-y-1 text-purple-800">
                      {result.correlations.map((corr, i) => (
                        <li key={i}>{JSON.stringify(corr)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.what_if_scenarios && result.what_if_scenarios.length > 0 && (
                  <div>
                    <p className="font-medium text-purple-900 mb-2">What-If Scenarios:</p>
                    <ul className="space-y-1 text-purple-800">
                      {result.what_if_scenarios.map((scenario, i) => (
                        <li key={i}>{JSON.stringify(scenario)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ScheduleCard({ result }: { result: SchedulerResult }) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900 text-base">
          <Calendar className="h-4 w-4" />
          Meeting Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.recommended_slot && (
          <Alert className="bg-green-100 border-green-300">
            <CheckCircle className="h-4 w-4 text-green-700" />
            <AlertTitle className="text-green-900">Recommended Slot</AlertTitle>
            <AlertDescription className="text-green-800">
              <div className="mt-2">
                <p className="font-medium">
                  {new Date(result.recommended_slot.start).toLocaleString()} - {new Date(result.recommended_slot.end).toLocaleTimeString()}
                </p>
                <p className="text-sm mt-1">{result.recommended_slot.reason}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {result.available_slots && result.available_slots.length > 0 && (
          <div>
            <p className="font-medium text-green-900 mb-2 text-sm">Available Slots:</p>
            <div className="space-y-2">
              {result.available_slots.map((slot, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-green-200 text-sm">
                  <div>
                    <p className="font-medium text-green-900">
                      {new Date(slot.start).toLocaleTimeString()} - {new Date(slot.end).toLocaleTimeString()}
                    </p>
                    <p className="text-green-700 text-xs">
                      {slot.participants_available} participants available
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.conflicts && result.conflicts.length > 0 && (
          <div>
            <p className="font-medium text-green-900 mb-2 text-sm">Conflicts:</p>
            <div className="space-y-1 text-sm">
              {result.conflicts.map((conflict, i) => (
                <div key={i} className="flex items-start gap-2 text-red-700">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{conflict.participant} - {conflict.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.scheduling_notes && (
          <p className="text-sm text-green-800 italic">{result.scheduling_notes}</p>
        )}
      </CardContent>
    </Card>
  )
}

function AttendanceCard({ data }: { data: any }) {
  return (
    <Card className="border-indigo-200 bg-indigo-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900 text-base">
          <Activity className="h-4 w-4" />
          Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-indigo-800">
          <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  )
}

function DeliveryStatusCard({ result }: { result: BroadcastSenderResult }) {
  const successRate = (result.delivered / result.total_recipients) * 100

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900 text-base">
          <Mail className="h-4 w-4" />
          Broadcast Delivery Status
        </CardTitle>
        <CardDescription className="text-green-700">
          Broadcast ID: {result.broadcast_id}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-green-900">Success Rate</span>
            <span className="font-medium text-green-900">{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded border border-green-200">
            <p className="text-2xl font-bold text-green-700">{result.delivered}</p>
            <p className="text-xs text-green-600">Delivered</p>
          </div>
          <div className="p-3 bg-white rounded border border-red-200">
            <p className="text-2xl font-bold text-red-700">{result.failed}</p>
            <p className="text-xs text-red-600">Failed</p>
          </div>
          <div className="p-3 bg-white rounded border border-amber-200">
            <p className="text-2xl font-bold text-amber-700">{result.pending}</p>
            <p className="text-xs text-amber-600">Pending</p>
          </div>
        </div>

        {result.failed_recipients && result.failed_recipients.length > 0 && (
          <div>
            <p className="font-medium text-green-900 mb-2 text-sm">Failed Recipients:</p>
            <ScrollArea className="h-32 rounded border border-green-200 bg-white p-2">
              <div className="space-y-1 text-xs">
                {result.failed_recipients.map((recipient, i) => (
                  <div key={i} className="flex items-start gap-2 text-red-700">
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{recipient.recipient_id}: {recipient.reason}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-green-700">
          <span>Started: {new Date(result.delivery_start_time).toLocaleString()}</span>
          <span>Ended: {new Date(result.delivery_end_time).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Page Component
export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('student')
  const [activeView, setActiveView] = useState<'chat' | 'admin' | 'analytics'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(`session-${Date.now()}`)
  const [broadcasts, setBroadcasts] = useState<BroadcastDraft[]>([])
  const [broadcastInput, setBroadcastInput] = useState('')
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Step 1: Route through Semantic Router (optional normalization)
      const routerResult = await callAIAgent(text, AGENT_IDS.semanticRouter, {
        session_id: sessionId,
        user_id: `user-${currentRole}`,
      })

      let intent = 'general'
      let confidence = 0
      let entities: Array<{ type: string; value: string }> = []

      if (routerResult.success && routerResult.response.status === 'success') {
        const routerData = routerResult.response.result as SemanticRouterResult
        intent = routerData.intent || 'general'
        confidence = routerData.confidence || 0
        entities = routerData.entities || []
      }

      // Step 2: Send to Orchestrator for processing
      const orchestratorResult = await callAIAgent(text, AGENT_IDS.orchestrator, {
        session_id: sessionId,
        user_id: `user-${currentRole}`,
      })

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: orchestratorResult.response.result.final_answer ||
                orchestratorResult.response.message ||
                'I processed your request.',
        timestamp: new Date(),
        response: orchestratorResult.response,
        confidence,
        intent,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (input.trim() && !loading) {
      sendMessage(input.trim())
    }
  }

  const createBroadcastDraft = async () => {
    if (!broadcastInput.trim()) return

    setBroadcastLoading(true)
    try {
      const result = await callAIAgent(broadcastInput, AGENT_IDS.broadcastComposer, {
        user_id: `user-${currentRole}`,
      })

      if (result.success && result.response.status === 'success') {
        const draft: BroadcastDraft = {
          id: `broadcast-${Date.now()}`,
          result: result.response.result as BroadcastComposerResult,
          status: 'draft',
          created_at: new Date(),
        }
        setBroadcasts(prev => [...prev, draft])
        setBroadcastInput('')
      }
    } catch (error) {
      console.error('Broadcast draft error:', error)
    } finally {
      setBroadcastLoading(false)
    }
  }

  const approveBroadcast = async (draftId: string) => {
    const draft = broadcasts.find(b => b.id === draftId)
    if (!draft) return

    setBroadcastLoading(true)
    try {
      const result = await callAIAgent(
        `Send approved broadcast: ${draft.result.subject}`,
        AGENT_IDS.broadcastSender,
        { user_id: `user-${currentRole}` }
      )

      if (result.success) {
        setBroadcasts(prev =>
          prev.map(b =>
            b.id === draftId ? { ...b, status: 'sent' } : b
          )
        )

        // Show delivery status in chat
        const statusMessage: Message = {
          id: `msg-${Date.now()}-status`,
          role: 'assistant',
          content: 'Broadcast sent successfully!',
          timestamp: new Date(),
          response: result.response,
        }
        setMessages(prev => [...prev, statusMessage])
      }
    } catch (error) {
      setBroadcasts(prev =>
        prev.map(b =>
          b.id === draftId ? { ...b, status: 'failed' } : b
        )
      )
    } finally {
      setBroadcastLoading(false)
    }
  }

  const rejectBroadcast = (draftId: string) => {
    setBroadcasts(prev => prev.filter(b => b.id !== draftId))
  }

  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return <p className="text-sm text-gray-800">{message.content}</p>
    }

    const response = message.response
    if (!response) {
      return <p className="text-sm text-gray-800">{message.content}</p>
    }

    // Render based on response type
    const result = response.result

    // Check for scheduler response
    if (result.available_slots || result.recommended_slot) {
      return <ScheduleCard result={result as SchedulerResult} />
    }

    // Check for analytics response
    if (result.trends_identified || result.recommendations || result.correlations) {
      return <AnalyticsCard result={result as AnalyticsResult} />
    }

    // Check for broadcast delivery status
    if (result.broadcast_id && result.delivery_status) {
      return <DeliveryStatusCard result={result as BroadcastSenderResult} />
    }

    // Check for orchestrator with follow-up suggestions
    if (result.final_answer) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-800">{result.final_answer}</p>

          {result.follow_up_suggestions && result.follow_up_suggestions.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-gray-600">Suggestions:</p>
              <div className="space-y-1">
                {result.follow_up_suggestions.map((suggestion: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    className="block w-full text-left px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Default text response
    return <p className="text-sm text-gray-800">{message.content}</p>
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-4 w-4" />
      case 'faculty': return <Users className="h-4 w-4" />
      case 'admin': return <Settings className="h-4 w-4" />
      case 'principal': return <Shield className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'student': return 'bg-blue-500'
      case 'faculty': return 'bg-green-500'
      case 'admin': return 'bg-purple-500'
      case 'principal': return 'bg-red-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OrgCopilot v2</h1>
                <p className="text-xs text-gray-500">Intelligent Educational Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Role:</span>
                <Select value={currentRole} onValueChange={(value) => setCurrentRole(value as UserRole)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Student
                      </div>
                    </SelectItem>
                    <SelectItem value="faculty">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Faculty
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="principal">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Principal
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={cn(
                "w-2 h-2 rounded-full",
                getRoleColor(currentRole)
              )} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Chat View */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversation
                </CardTitle>
                <CardDescription>
                  Ask questions in English or Hinglish. Try: "Kal ka kya scene hai?" or "CS walon ka attendance dikhao"
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Bot className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Welcome to OrgCopilot!
                        </h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          I can help you with attendance, schedules, policies, analytics, and more.
                          Start a conversation below.
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}

                        <div className={cn(
                          "flex-1 max-w-[80%] space-y-2",
                          message.role === 'user' && 'flex flex-col items-end'
                        )}>
                          <div className={cn(
                            "rounded-lg p-3",
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-200'
                          )}>
                            {renderMessageContent(message)}
                          </div>

                          <div className="flex items-center gap-2 px-1">
                            <span className="text-xs text-gray-400">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.confidence !== undefined && message.role === 'assistant' && (
                              <ConfidenceBadge score={message.confidence} />
                            )}
                            {message.intent && message.role === 'assistant' && (
                              <Badge variant="outline" className="text-xs">
                                {message.intent}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {message.role === 'user' && (
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-white",
                              getRoleColor(currentRole)
                            )}>
                              {getRoleIcon(currentRole)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-sm text-gray-600">Processing...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="border-t bg-gray-50 p-4">
                <div className="flex gap-2 w-full">
                  <Input
                    placeholder="Type your message... (Hinglish supported)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Admin/Broadcast View */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Broadcast Management
                </CardTitle>
                <CardDescription>
                  Create and manage mass communications with approval workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Compose Broadcast
                  </label>
                  <Textarea
                    placeholder="Describe the broadcast you want to send... AI will compose the message."
                    value={broadcastInput}
                    onChange={(e) => setBroadcastInput(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <Button
                    onClick={createBroadcastDraft}
                    disabled={!broadcastInput.trim() || broadcastLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {broadcastLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating Draft...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Draft
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Pending Approvals ({broadcasts.filter(b => b.status === 'draft').length})
                  </h3>

                  {broadcasts.filter(b => b.status === 'draft').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No pending broadcasts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {broadcasts
                        .filter(b => b.status === 'draft')
                        .map(broadcast => (
                          <ApprovalCard
                            key={broadcast.id}
                            draft={broadcast.result}
                            onApprove={() => approveBroadcast(broadcast.id)}
                            onReject={() => rejectBroadcast(broadcast.id)}
                            loading={broadcastLoading}
                          />
                        ))}
                    </div>
                  )}
                </div>

                {broadcasts.filter(b => b.status !== 'draft').length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-700">
                        Broadcast History
                      </h3>
                      <div className="space-y-2">
                        {broadcasts
                          .filter(b => b.status !== 'draft')
                          .map(broadcast => (
                            <div
                              key={broadcast.id}
                              className="p-3 bg-gray-50 rounded border border-gray-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900">
                                    {broadcast.result.subject}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {broadcast.created_at.toLocaleString()}
                                  </p>
                                </div>
                                <Badge
                                  variant={broadcast.status === 'sent' ? 'default' : 'destructive'}
                                >
                                  {broadcast.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  View insights, trends, and counterfactual analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Analytics Insights
                  </h3>
                  <p className="text-sm max-w-md mx-auto">
                    Ask questions in the chat to generate analytics.
                    Try: "Show CS department attendance trends" or "What-if scenarios for improving pass rates"
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 py-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Hinglish Support</h4>
                  <p className="text-xs text-blue-700">
                    Ask in English or Hinglish. The system normalizes your queries automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-900 mb-1">Multi-Agent System</h4>
                  <p className="text-xs text-green-700">
                    Powered by 9 specialized agents for SQL, RAG, scheduling, analytics, and more.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">Human-in-the-Loop</h4>
                  <p className="text-xs text-purple-700">
                    Critical actions like broadcasts require approval before execution.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </footer>
    </div>
  )
}
