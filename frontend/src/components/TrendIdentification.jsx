import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  ArrowLeft, 
  Calendar, 
  Video, 
  Filter,
  TrendingUp,
  Loader2,
  Eye,
  Clock,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Search,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:8000'

const TrendIdentification = () => {
  const navigate = useNavigate()
  
  // State
  const [selectedNiche, setSelectedNiche] = useState('indian') // 'indian' or 'global'
  const [videoType, setVideoType] = useState('all') // 'all', 'videos', 'shorts'
  const [dateRange, setDateRange] = useState('15') // '3', '7', '15', '30' days
  const [loading, setLoading] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [videos, setVideos] = useState([])
  const [nicheChannels, setNicheChannels] = useState({ indian: [], global: [] })
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzingTopics, setAnalyzingTopics] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0, channelName: '', videosFound: 0 })

  // Fetch niche channel lists on mount
  useEffect(() => {
    fetchNicheChannels()
  }, [])

  const fetchNicheChannels = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/trends/niche-channels`)
      setNicheChannels(response.data)
    } catch (error) {
      console.error('Error fetching niche channels:', error)
    }
  }

  const handleFetchVideos = async () => {
    setLoadingVideos(true)
    setVideos([])
    setAnalysisResult(null)
    
    try {
      const channels = selectedNiche === 'indian' ? nicheChannels.indian : nicheChannels.global
      
      console.log(`🔍 Fetching videos from ${channels.length} channels...`)
      console.log(`📅 Date range: Last ${dateRange} days`)
      console.log(`🎬 Video type: ${videoType}`)
      
      // Initialize progress
      setFetchProgress({ current: 0, total: channels.length, channelName: 'Preparing...', videosFound: 0 })
      
      // Simulate progress updates (since backend processes all at once)
      const estimatedTimePerChannel = 2000 // 2 seconds per channel
      const progressInterval = setInterval(() => {
        setFetchProgress(prev => {
          if (prev.current < prev.total) {
            const nextIndex = prev.current
            return {
              ...prev,
              current: nextIndex + 1,
              channelName: channels[nextIndex]?.channel_name || 'Processing...'
            }
          }
          return prev
        })
      }, estimatedTimePerChannel)
      
      const response = await axios.post(`${API_URL}/api/trends/fetch-videos`, {
        channel_ids: channels.map(c => c.channel_id),
        days: parseInt(dateRange),
        video_type: videoType
      })
      
      clearInterval(progressInterval)
      
      console.log(`✅ Received ${response.data.videos.length} videos`)
      
      // Final progress update
      setFetchProgress({
        current: channels.length,
        total: channels.length,
        channelName: 'Complete!',
        videosFound: response.data.videos.length
      })
      
      if (response.data.videos.length === 0) {
        alert(`No videos found in the last ${dateRange} days matching your filters. Try:\n- Increasing the time period\n- Selecting "All Content" instead of just videos\n- Trying the other niche`)
      }
      
      setVideos(response.data.videos)
      
      // Clear progress after a delay
      setTimeout(() => {
        setFetchProgress({ current: 0, total: 0, channelName: '', videosFound: 0 })
      }, 3000)
    } catch (error) {
      console.error('❌ Error fetching videos:', error)
      console.error('Error details:', error.response?.data || error.message)
      alert(`Failed to fetch videos: ${error.response?.data?.detail || error.message}`)
      setFetchProgress({ current: 0, total: 0, channelName: '', videosFound: 0 })
    } finally {
      setLoadingVideos(false)
    }
  }

  const handleAnalyzeTopics = async () => {
    if (videos.length === 0) {
      alert('Please fetch videos first')
      return
    }

    setAnalyzingTopics(true)
    
    try {
      const response = await axios.post(`${API_URL}/api/trends/analyze-topics`, {
        videos: videos,
        niche_type: selectedNiche,
        days: parseInt(dateRange)
      })
      
      setAnalysisResult(response.data.analysis)
    } catch (error) {
      console.error('Error analyzing topics:', error)
      alert('Failed to analyze topics. Please try again.')
    } finally {
      setAnalyzingTopics(false)
    }
  }

  const channels = selectedNiche === 'indian' ? nicheChannels.indian : nicheChannels.global

  const formatDuration = (duration) => {
    if (!duration) return 'N/A'
    // Parse ISO 8601 duration (e.g., PT4M13S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return duration
    
    const hours = parseInt(match[1] || 0)
    const minutes = parseInt(match[2] || 0)
    const seconds = parseInt(match[3] || 0)
    
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getVideoType = (duration) => {
    if (!duration) return 'Unknown'
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 'Unknown'
    
    const hours = parseInt(match[1] || 0)
    const minutes = parseInt(match[2] || 0)
    const seconds = parseInt(match[3] || 0)
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    return totalSeconds >= 180 ? 'Video' : 'Short'
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                Identify Trends
              </h1>
              <p className="text-gray-400 mt-1">
                Discover what channels in your niche are creating recently
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Niche Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Niche
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedNiche('indian')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedNiche === 'indian'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Indian Niche</span>
                    <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">
                      {nicheChannels.indian.length} channels
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedNiche('global')}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedNiche === 'global'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Global Niche</span>
                    <span className="text-xs bg-purple-500/20 px-2 py-1 rounded">
                      {nicheChannels.global.length} channels
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Video Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Content Type
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Content', desc: 'Videos + Shorts' },
                  { value: 'videos', label: 'Videos Only', desc: '≥3 minutes' },
                  { value: 'shorts', label: 'Shorts Only', desc: '<3 minutes' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setVideoType(type.value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      videoType === type.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-xs text-gray-400">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Time Period
              </label>
              <div className="space-y-2">
                {[
                  { value: '3', label: 'Last 3 Days' },
                  { value: '7', label: 'Last 7 Days' },
                  { value: '15', label: 'Last 15 Days' },
                  { value: '30', label: 'Last 30 Days' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range.value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all ${
                      dateRange === range.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {range.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Channel List */}
          {channels.length > 0 && (
            <div className="mt-6 bg-[#0a0a0a] rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                📺 {selectedNiche === 'indian' ? 'Indian' : 'Global'} Niche Channels ({channels.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {channels.map((channel, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1a1a1a] border border-gray-800 rounded px-3 py-2 text-xs text-gray-300 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span className="truncate">{channel.channel_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleFetchVideos}
              disabled={loadingVideos || channels.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              {loadingVideos ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fetching Videos...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Fetch Videos
                </>
              )}
            </button>

            {videos.length > 0 && (
              <button
                onClick={handleAnalyzeTopics}
                disabled={analyzingTopics}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                {analyzingTopics ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Topics...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Topic Suggestions
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress Display */}
        {loadingVideos && fetchProgress.total > 0 && (
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  Fetching Videos from {selectedNiche === 'indian' ? 'Indian' : 'Global'} Niche Channels
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Processing {fetchProgress.current} of {fetchProgress.total} channels • {fetchProgress.videosFound} videos found so far
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                <span>Progress: {Math.round((fetchProgress.current / fetchProgress.total) * 100)}%</span>
                <span>Est. {Math.ceil((fetchProgress.total - fetchProgress.current) * 2)}s remaining</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(fetchProgress.current / fetchProgress.total) * 100}%` }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Current Channel */}
            {fetchProgress.channelName && (
              <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Currently fetching from:</p>
                    <p className="text-sm font-semibold text-white">{fetchProgress.channelName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Time Info */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              <span>This may take {Math.ceil(fetchProgress.total * 2)} seconds for {fetchProgress.total} channels</span>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-[#1a1a1a] rounded-xl border border-green-500/30 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Topic Suggestions for Zero1</h2>
            </div>

            <div className="space-y-4">
              {analysisResult.summary && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h3 className="font-semibold text-green-400 mb-2">Summary</h3>
                  <p className="text-gray-300">{analysisResult.summary}</p>
                </div>
              )}

              {analysisResult.trending_topics && analysisResult.trending_topics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-300 mb-3">🔥 Trending Topics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysisResult.trending_topics.map((topic, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4">
                        <div className="font-semibold text-white mb-2">{typeof topic === 'string' ? topic : topic.title || JSON.stringify(topic)}</div>
                        {typeof topic === 'object' && topic.description && (
                          <p className="text-sm text-gray-400">{topic.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.content_suggestions && analysisResult.content_suggestions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-300 mb-3">💡 Content Suggestions</h3>
                  <div className="space-y-2">
                    {analysisResult.content_suggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3">
                        <p className="text-gray-300">{typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.insights && analysisResult.insights.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-300 mb-3">🎯 Key Insights</h3>
                  <div className="space-y-2">
                    {analysisResult.insights.map((insight, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3">
                        <p className="text-gray-300">{typeof insight === 'string' ? insight : JSON.stringify(insight)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Videos List */}
        {videos.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Found {videos.length} videos
              </h2>
              <div className="text-sm text-gray-400">
                From {channels.length} channels • Last {dateRange} days
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {videos.map((video, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                      <div className="mt-1 text-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          getVideoType(video.duration) === 'Short'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {getVideoType(video.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Video Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-white line-clamp-2 flex-1">
                          {video.title}
                        </h3>
                        <a
                          href={`https://youtube.com/watch?v=${video.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      <p className="text-sm text-gray-400 mb-3">{video.channel_title}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.view_count?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {video.like_count?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {video.comment_count?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(video.duration)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(video.published_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loadingVideos && videos.length === 0 && (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Videos Yet</h3>
            <p className="text-gray-500">
              Select your filters and click "Fetch Videos" to discover trending content
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendIdentification

