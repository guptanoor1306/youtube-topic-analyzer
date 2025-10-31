import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Search, Loader2, Eye, TrendingUp, Copy, Check } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const TitleGeneration = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [topicEssence, setTopicEssence] = useState('')
  const [keywordsUsed, setKeywordsUsed] = useState([])
  const [useNiche] = useState(false)  // Disabled niche search for now
  const [nicheChannelsCount, setNicheChannelsCount] = useState(0)
  const [totalVideosSearched, setTotalVideosSearched] = useState(0)

  useEffect(() => {
    if (appState.selectedTopic) {
      fetchTitleSuggestions()
    }
  }, [appState.selectedTopic])

  const fetchTitleSuggestions = async () => {
    setLoading(true)
    try {
      const endpoint = useNiche 
        ? `${API_BASE_URL}/api/search-niche-titles`
        : `${API_BASE_URL}/api/search-similar-titles`
      
      const response = await axios.post(endpoint, {
        topic: appState.selectedTopic,
        max_results: 30  // Increased to 30 for better variety
      }, {
        timeout: 30000  // 30 second timeout
      })

      if (response.data.success) {
        setTitleSuggestions(response.data.videos)
        setTopicEssence(response.data.essence || '')
        setKeywordsUsed(response.data.keywords_used || [])
        setNicheChannelsCount(response.data.niche_channels_count || 0)
        setTotalVideosSearched(response.data.total_videos_searched || 0)
      } else if (response.data.error) {
        alert(response.data.error)
      }
    } catch (err) {
      console.error('Error fetching title suggestions:', err)
      alert(`Failed to fetch title suggestions: ${err.response?.data?.detail || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`
    }
    return `${count} views`
  }

  const handleCopyTitle = (title, index) => {
    navigator.clipboard.writeText(title)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleNext = () => {
    setAppState({
      ...appState,
      titleSuggestions: titleSuggestions,
      selectedTitle: selectedTitle
    })
    navigate('/thumbnail-generation')
  }

  if (!appState.selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-400">No topic selected. Please select a topic first.</p>
        <button
          onClick={() => navigate('/topic-selection')}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Go to Topic Selection
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/topic-selection')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Topic Selection
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <h2 className="text-3xl font-bold text-white">Title Suggestions</h2>
          </div>
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">Selected Topic:</p>
            <p className="text-white font-medium mb-3">{appState.selectedTopic}</p>
            
            {topicEssence && (
              <div className="mt-3 pt-3 border-t border-blue-700/50">
                <p className="text-sm text-blue-300 mb-1">🤖 AI-Extracted Essence:</p>
                <p className="text-sm text-gray-300 italic">{topicEssence}</p>
              </div>
            )}
            
            {keywordsUsed.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-700/50">
                <p className="text-sm text-blue-300 mb-2">🔑 Search Keywords Used:</p>
                <div className="flex flex-wrap gap-2">
                  {keywordsUsed.map((keyword, idx) => (
                    <span key={idx} className="text-xs bg-blue-600/30 text-blue-200 px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-gray-400">
            🧠 AI-powered semantic search finds videos ranked by keyword relevance, not just views
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-400">
              Searching YouTube for relevant titles ranked by keyword match...
            </p>
          </div>
        ) : titleSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No title suggestions found</p>
            <button
              onClick={fetchTitleSuggestions}
              className="text-blue-400 hover:text-blue-300"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {titleSuggestions.length} Title Suggestions
                </h3>
                <button
                  onClick={fetchTitleSuggestions}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {titleSuggestions.map((video, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedTitle(video.title)}
                    className={`group relative flex gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTitle === video.title
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-700 bg-[#0a0a0a]/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {video.duration_minutes} min
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatViewCount(video.view_count)}
                        </span>
                        <span className="truncate">{video.channel_name}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyTitle(video.title, idx)
                      }}
                      className="flex-shrink-0 self-start p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                      title="Copy title"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {selectedTitle && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                <p className="text-sm text-green-300 mb-2">Selected Title:</p>
                <p className="text-white font-medium">{selectedTitle}</p>
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Continue to Thumbnail Generation
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TitleGeneration

