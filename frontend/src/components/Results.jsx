import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, BookOpen, MessageCircle, Send, Loader2 } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const Results = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages([...chatMessages, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const endpoint = appState.currentMode === 'suggest-series' ? `${API_BASE_URL}/api/suggest-series` : `${API_BASE_URL}/api/suggest-format`
      
      const requestBody = appState.currentMode === 'suggest-series' 
        ? {
            primary_channel_id: appState.primaryChannel.channel_id,
            selected_video_ids: appState.selectedMyVideos?.map(v => v.video_id) || [],
            has_pdf_data: false,
            additional_prompt: chatInput.trim()
          }
        : {
            my_video_ids: appState.selectedMyVideos?.map(v => v.video_id) || [],
            competitor_video_ids: appState.selectedCompetitorVideos?.map(v => v.video_id) || [],
            additional_prompt: chatInput.trim()
          }

      const response = await axios.post(endpoint, requestBody)

      if (response.data.success && response.data.suggestions) {
        const aiMessage = { 
          role: 'assistant', 
          content: JSON.stringify(response.data.suggestions, null, 2)
        }
        setChatMessages(prev => [...prev, userMessage, aiMessage])
        
        // Update main results
        setAppState(prevState => ({
          ...prevState,
          results: response.data.suggestions
        }))
      }
    } catch (err) {
      const errorMessage = { 
        role: 'error', 
        content: `Failed to get response: ${err.response?.data?.detail || err.message}` 
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  if (!appState.results || !appState.currentMode) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-400">No results available. Please start from the beginning.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Go to Home
        </button>
      </div>
    )
  }

  const renderSeriesResults = () => {
    const { series_suggestions, additional_topics, content_gaps } = appState.results

    return (
      <div className="space-y-8">
        {/* Series Suggestions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <h3 className="text-xl font-bold text-white">Series Suggestions</h3>
          </div>
          <div className="space-y-4">
            {series_suggestions?.map((series, idx) => (
              <div key={idx} className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-800/50">
                <h4 className="text-lg font-semibold text-white mb-2">
                  {series.title}
                </h4>
                <p className="text-gray-300 mb-3">{series.description}</p>
                
                <div className="mb-3">
                  <h5 className="font-medium text-gray-200 mb-2">Episodes:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                    {series.episodes?.map((episode, eIdx) => (
                      <li key={eIdx}>{episode}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#0a0a0a]/50 rounded p-3 mt-3 border border-gray-800">
                  <p className="text-sm text-gray-300">
                    <strong className="text-white">Why this works:</strong> {series.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Topics */}
        {additional_topics && additional_topics.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-xl font-bold text-white">Additional Topics</h3>
            </div>
            <div className="bg-green-900/20 rounded-lg p-6 border border-green-800/50">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {additional_topics.map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-300">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Content Gaps */}
        {content_gaps && content_gaps.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="text-xl font-bold text-white">Content Gaps</h3>
            </div>
            <div className="bg-orange-900/20 rounded-lg p-6 border border-orange-800/50">
              <p className="text-sm text-orange-300 mb-3">
                Topics your audience is asking about but haven't been fully covered yet:
              </p>
              <ul className="space-y-2">
                {content_gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span className="text-gray-300">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    )
  }

  const renderFormatResults = () => {
    const { format_analysis, adaptations, bonus_ideas } = appState.results

    return (
      <div className="space-y-8">
        {/* Format Analysis */}
        {format_analysis && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-white">Format Analysis</h3>
            </div>
            <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Your Channel Style</h4>
                  <p className="text-gray-300 text-sm">{format_analysis.my_channel_style}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Competitor Style</h4>
                  <p className="text-gray-300 text-sm">{format_analysis.competitor_style}</p>
                </div>
              </div>
              
              {format_analysis.key_differences && (
                <div className="mt-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Key Differences</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {format_analysis.key_differences.map((diff, idx) => (
                      <li key={idx}>{diff}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Adaptations */}
        {adaptations && adaptations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-xl font-bold text-white">Adapted Video Ideas</h3>
            </div>
            <div className="space-y-4">
              {adaptations.map((adaptation, idx) => (
                <div key={idx} className="bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-lg p-6 border border-green-800/50">
                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">Original:</p>
                    <p className="text-gray-200 font-medium">{adaptation.original_topic}</p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-1">Adapted Title:</p>
                    <h4 className="text-lg font-semibold text-white">{adaptation.adapted_title}</h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-1">Reframing:</p>
                      <p className="text-sm text-gray-400">{adaptation.reframing}</p>
                    </div>

                    {adaptation.key_points && adaptation.key_points.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-300 mb-1">Key Points:</p>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                          {adaptation.key_points.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-1">Format Changes:</p>
                      <p className="text-sm text-gray-400">{adaptation.format_changes}</p>
                    </div>

                    <div className="bg-[#0a0a0a]/50 rounded p-3 border border-gray-800">
                      <p className="text-sm font-medium text-gray-300 mb-1">Unique Angle:</p>
                      <p className="text-sm text-gray-400">{adaptation.unique_angle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bonus Ideas */}
        {bonus_ideas && bonus_ideas.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="text-xl font-bold text-white">Bonus Ideas</h3>
            </div>
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-800/50">
              <ul className="space-y-2">
                {bonus_ideas.map((idea, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">✨</span>
                    <span className="text-gray-300">{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-6">
        <div className="mb-6 pb-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-2">
            {appState.currentMode === 'suggest-series' ? 'Series Suggestions' : 'Format Suggestions'}
          </h2>
          <p className="text-gray-400">
            {appState.currentMode === 'suggest-series'
              ? 'Based on your channel content and audience engagement'
              : 'Adapting competitor content to your channel format'}
          </p>
        </div>

        {appState.currentMode === 'suggest-series' ? renderSeriesResults() : renderFormatResults()}

        {/* Chat Interface */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="mb-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              {showChat ? 'Hide' : 'Show'} Follow-up Chat
            </button>
          </div>

          {showChat && (
            <div className="bg-[#0a0a0a]/50 rounded-lg p-4 mb-6 border border-gray-800">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  Continue the Conversation
                </h3>
                <p className="text-sm text-gray-400">
                  Ask follow-up questions or request refinements to the suggestions above
                </p>
              </div>

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 max-h-96 overflow-y-auto space-y-3 border border-gray-800">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : msg.role === 'error'
                            ? 'bg-red-900/50 text-red-200 border border-red-800'
                            : 'bg-gray-800 text-gray-200'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {msg.content}
                          </pre>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-lg px-4 py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleChatSubmit()}
                  placeholder="Ask a follow-up question or request refinements..."
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  {isChatLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Your follow-up will use the same videos for context
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setAppState({
                ...appState,
                selectedMyVideos: [],
                selectedCompetitorVideos: [],
                currentMode: null,
                results: null,
                customPrompt: ''
              })
              navigate('/')
            }}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default Results

