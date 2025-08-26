"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Play, CheckCircle, XCircle, Clock, Edit, Share, Sparkles } from "lucide-react"

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  canAutomate?: boolean
  automationSteps?: AutomationStep[]
}

interface AutomationStep {
  id: string
  description: string
  action: string
  status: "pending" | "running" | "completed" | "error"
}

export default function MainInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [automationSteps, setAutomationSteps] = useState<AutomationStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAutomating, setIsAutomating] = useState(false)
  const [showLanding, setShowLanding] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  const automationSuggestions = [
    "Open Notepad and create a new document",
    "Check system performance and memory usage",
    "Create a new folder on Desktop",
    "Launch Chrome and search for cybersecurity",
    "Clean temporary files and optimize system",
    "Take a screenshot and save to Documents",
    "Open Task Manager to check processes",
    "Create a backup of important files",
    "Update Windows system settings",
    "Install software from Microsoft Store",
    "Configure firewall settings",
    "Run disk cleanup utility",
  ]

  if (showLanding) {
    window.location.reload()
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageToSend = currentMessage
    setCurrentMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.userReply,
        timestamp: new Date(),
        canAutomate: data.automationSteps && data.automationSteps.length > 0,
        automationSteps:
          data.automationSteps?.map((step: any) => ({
            ...step,
            status: "pending" as const,
          })) || [],
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutomateTask = (steps: AutomationStep[]) => {
    setAutomationSteps(steps)
  }

  const executeAutomation = async () => {
    if (automationSteps.length === 0) return

    setIsAutomating(true)

    for (let i = 0; i < automationSteps.length; i++) {
      setAutomationSteps((prev) => prev.map((step, index) => (index === i ? { ...step, status: "running" } : step)))

      try {
        // Simulate execution time
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // For now, we'll simulate success
        console.log(`Executing: ${automationSteps[i].action}`)

        setAutomationSteps((prev) => prev.map((step, index) => (index === i ? { ...step, status: "completed" } : step)))
      } catch (error) {
        setAutomationSteps((prev) => prev.map((step, index) => (index === i ? { ...step, status: "error" } : step)))
        break
      }
    }

    setIsAutomating(false)
  }

  const getStatusIcon = (status: AutomationStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />
      case "running":
        return <Clock className="h-4 w-4 text-yellow-400 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const handleEditChat = (chatId: string) => {
    const chat = messages.find((m) => m.id === chatId && m.type === "user")
    if (chat) {
      setCurrentMessage(chat.content)
    }
  }

  const handleShareChat = (chatId: string) => {
    const chat = messages.find((m) => m.id === chatId)
    if (chat) {
      navigator.clipboard.writeText(chat.content)
      // Could add toast notification here
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion)
  }

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* Chat History - Left Panel */}
      <div className="w-1/5 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">Chat History</h2>
        </div>

        {/* Simplified chat history display */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {messages
              .filter((m) => m.type === "user")
              .map((message) => (
                <Card
                  key={message.id}
                  className={`p-3 bg-gray-900 border-gray-700 cursor-pointer hover:bg-gray-800 ${
                    selectedChatId === message.id ? "ring-2 ring-white" : ""
                  }`}
                  onClick={() => setSelectedChatId(selectedChatId === message.id ? null : message.id)}
                >
                  <p className="text-sm text-white truncate">
                    {message.content.length > 40 ? `${message.content.substring(0, 40)}...` : message.content}
                  </p>

                  {selectedChatId === message.id && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditChat(message.id)
                        }}
                        className="text-white hover:bg-gray-700 flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShareChat(message.id)
                        }}
                        className="text-white hover:bg-gray-700 flex-1"
                      >
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Interface - Middle Panel */}
      <div className="w-3/5 flex flex-col">
        <div className="border-b border-gray-800 p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium">Quick Automation Suggestions</span>
          </div>

          <div className="relative mb-2">
            <div className="flex gap-2 animate-scroll-left">
              {[...automationSuggestions.slice(0, 6), ...automationSuggestions.slice(0, 6)].map((suggestion, index) => (
                <Badge
                  key={`row1-${index}`}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-800 whitespace-nowrap border-gray-600 text-gray-300 hover:text-white flex-shrink-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="flex gap-2 animate-scroll-right">
              {[...automationSuggestions.slice(6), ...automationSuggestions.slice(6)].map((suggestion, index) => (
                <Badge
                  key={`row2-${index}`}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-800 whitespace-nowrap border-gray-600 text-gray-300 hover:text-white flex-shrink-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-full">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.type === "user" ? "bg-white text-black" : "bg-gray-900 border-gray-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.canAutomate && message.automationSteps && (
                    <Button
                      onClick={() => handleAutomateTask(message.automationSteps!)}
                      className="mt-3 bg-white text-black hover:bg-gray-200"
                      size="sm"
                    >
                      Automate this task
                    </Button>
                  )}
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-gray-900 border-gray-700 p-4">
                  <p className="text-sm text-gray-400">Thinking...</p>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Describe the task you want to automate..."
              className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Automation Steps - Right Panel */}
      <div className="w-1/5 border-l border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Automation Steps</h2>
            {automationSteps.length > 0 && (
              <Button
                onClick={executeAutomation}
                disabled={isAutomating}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="h-4 w-4 mr-1" />
                Execute
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {automationSteps.map((step) => (
              <Card key={step.id} className="p-3 bg-gray-900 border-gray-700">
                <div className="flex items-start gap-2">
                  {getStatusIcon(step.status)}
                  <div className="flex-1">
                    <p className="text-sm text-white">{step.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{step.action}</p>
                  </div>
                </div>
              </Card>
            ))}
            {automationSteps.length === 0 && (
              <p className="text-gray-400 text-sm">
                No automation steps yet. Send a message and click "Automate this task" to see steps here.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
