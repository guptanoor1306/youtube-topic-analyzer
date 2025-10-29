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
        <p className="text-gray-600">No results available. Please start from the beginning.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Go to Channel Setup
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
            <BookOpen className="w-6 h-6 text-purple-600" />
            <h3 className="text-2xl font-bold text-gray-900">Series Suggestions</h3>
          </div>
          <div className="space-y-4">
            {series_suggestions?.map((series, idx) => (
              <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {series.title}
                </h4>
                <p className="text-gray-700 mb-3">{series.description}</p>
                
                <div className="mb-3">
                  <h5 className="font-medium text-gray-900 mb-2">Episodes:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {series.episodes?.map((episode, eIdx) => (
                      <li key={eIdx}>{episode}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/70 rounded p-3 mt-3">
                  <p className="text-sm text-gray-700">
                    <strong>Why this works:</strong> {series.rationale}
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
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-2xl font-bold text-gray-900">Additional Topics</h3>
            </div>
            <div className="bg-green-50 rounded-lg p-6 border border-green-100">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {additional_topics.map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">{topic}</span>
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
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h3 className="text-2xl font-bold text-gray-900">Content Gaps</h3>
            </div>
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
              <p className="text-sm text-orange-800 mb-3">
                Topics your audience is asking about but haven't been fully covered yet:
              </p>
              <ul className="space-y-2">
                {content_gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">→</span>
                    <span className="text-gray-700">{gap}</span>
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
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Format Analysis</h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Your Channel Style</h4>
                  <p className="text-gray-700 text-sm">{format_analysis.my_channel_style}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Competitor Style</h4>
                  <p className="text-gray-700 text-sm">{format_analysis.competitor_style}</p>
                </div>
              </div>
              
              {format_analysis.key_differences && (
                <div className="mt-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Differences</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
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
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-2xl font-bold text-gray-900">Adapted Video Ideas</h3>
            </div>
            <div className="space-y-4">
              {adaptations.map((adaptation, idx) => (
                <div key={idx} className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-100">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Original:</p>
                    <p className="text-gray-800 font-medium">{adaptation.original_topic}</p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Adapted Title:</p>
                    <h4 className="text-xl font-semibold text-gray-900">{adaptation.adapted_title}</h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Reframing:</p>
                      <p className="text-sm text-gray-600">{adaptation.reframing}</p>
                    </div>

                    {adaptation.key_points && adaptation.key_points.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Key Points:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {adaptation.key_points.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Format Changes:</p>
                      <p className="text-sm text-gray-600">{adaptation.format_changes}</p>
                    </div>

                    <div className="bg-white/70 rounded p-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Unique Angle:</p>
                      <p className="text-sm text-gray-600">{adaptation.unique_angle}</p>
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
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-900">Bonus Ideas</h3>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <ul className="space-y-2">
                {bonus_ideas.map((idea, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">✨</span>
                    <span className="text-gray-700">{idea}</span>
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
          onClick={() => navigate('/select-videos')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {appState.currentMode === 'suggest-series' ? 'Series Suggestions' : 'Format Suggestions'}
          </h2>
          <p className="text-gray-600">
            {appState.currentMode === 'suggest-series'
              ? 'Based on your channel content and audience engagement'
              : 'Adapting competitor content to your channel format'}
          </p>
        </div>

        {appState.currentMode === 'suggest-series' ? renderSeriesResults() : renderFormatResults()}

        {/* Chat Interface */}
        <div className="mt-8 pt-6 border-t">
          <div className="mb-4">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              {showChat ? 'Hide' : 'Show'} Follow-up Chat
            </button>
          </div>

          {showChat && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Continue the Conversation
                </h3>
                <p className="text-sm text-gray-600">
                  Ask follow-up questions or request refinements to the suggestions above
                </p>
              </div>

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="bg-white rounded-lg p-4 mb-4 max-h-96 overflow-y-auto space-y-3">
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
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-200 text-gray-900'
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
                      <div className="bg-gray-200 rounded-lg px-4 py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default Results

