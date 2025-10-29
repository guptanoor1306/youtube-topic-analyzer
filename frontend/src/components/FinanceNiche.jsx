import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Loader2, TrendingUp, Target, CheckCircle, Circle } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const FinanceNiche = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  
  // Left column - Zero1 videos
  const [myVideos, setMyVideos] = useState([])
  const [selectedMyVideos, setSelectedMyVideos] = useState([])
  
  // Right column - Competitor videos
  const [searchType, setSearchType] = useState('keyword')
  const [searchQuery, setSearchQuery] = useState('')
  const [competitorResults, setCompetitorResults] = useState([])
  const [selectedCompetitorVideos, setSelectedCompetitorVideos] = useState([])
  
  const [customPrompt, setCustomPrompt] = useState('')
  const [searching, setSearching] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    // Load Zero1 videos from appState
    if (!appState.availableVideos || !appState.primaryChannel) {
      navigate('/')
    } else {
      setMyVideos(appState.availableVideos)
    }
  }, [appState.availableVideos, appState.primaryChannel, navigate])

  const handleMyVideoToggle = (video) => {
    const isSelected = selectedMyVideos.find(v => v.video_id === video.video_id)
    
    if (isSelected) {
      setSelectedMyVideos(selectedMyVideos.filter(v => v.video_id !== video.video_id))
    } else {
      if (selectedMyVideos.length >= 15) {
        alert('You can select up to 15 Zero1 videos')
        return
      }
      setSelectedMyVideos([...selectedMyVideos, video])
    }
  }

  const handleCompetitorVideoToggle = (video) => {
    const isSelected = selectedCompetitorVideos.find(v => v.video_id === video.video_id)
    
    if (isSelected) {
      setSelectedCompetitorVideos(selectedCompetitorVideos.filter(v => v.video_id !== video.video_id))
    } else {
      if (selectedCompetitorVideos.length >= 15) {
        alert('You can select up to 15 competitor videos')
        return
      }
      setSelectedCompetitorVideos([...selectedCompetitorVideos, video])
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search term')
      return
    }

    setSearching(true)
    try {
      const endpoint = searchType === 'keyword' ? `${API_BASE_URL}/api/search/videos` : `${API_BASE_URL}/api/search/channel`
      const response = await axios.post(endpoint, {
        query: searchQuery,
        max_results: 30
      })

      if (searchType === 'keyword') {
        setCompetitorResults(response.data.results || [])
      } else {
        setCompetitorResults(response.data.videos || [])
      }
    } catch (err) {
      alert('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    if (selectedMyVideos.length === 0) {
      alert('Please select at least 1 Zero1 video from the left column')
      return
    }

    if (selectedCompetitorVideos.length === 0) {
      alert('Please select at least 1 competitor video from the right column')
      return
    }

    if (!customPrompt.trim()) {
      alert('Please enter your custom prompt')
      return
    }

    setGenerating(true)
    try {
      console.log('🚀 Sending format request:', {
        my_video_ids: selectedMyVideos.map(v => v.video_id),
        competitor_video_ids: selectedCompetitorVideos.map(v => v.video_id),
        prompt: customPrompt
      })

      const response = await axios.post(`${API_BASE_URL}/api/suggest-format`, {
        my_video_ids: selectedMyVideos.map(v => v.video_id),
        competitor_video_ids: selectedCompetitorVideos.map(v => v.video_id),
        additional_prompt: customPrompt.trim()
      })

      console.log('✅ API Response:', response.data)

      if (response.data.success && response.data.suggestions) {
        setAppState(prevState => ({
          ...prevState,
          selectedMyVideos: selectedMyVideos,
          selectedCompetitorVideos: selectedCompetitorVideos,
          currentMode: 'suggest-format',
          results: response.data.suggestions,
          customPrompt: customPrompt
        }))

        console.log('📊 Navigating to results with:', response.data.suggestions)
        navigate('/results')
      } else {
        console.error('❌ Unexpected response format:', response.data)
        alert('Received unexpected response format from server')
      }
    } catch (err) {
      console.error('❌ Error generating suggestions:', err)
      const errorMsg = err.response?.data?.detail || err.message
      alert(`Failed to generate suggestions: ${errorMsg}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          <TrendingUp className="w-6 h-6 inline-block mr-2 text-green-500" />
          Finance Niche - Cross Analysis
        </h2>
        <p className="text-gray-400 mb-4">
          Select videos from both your channel and competitors to get format adaptation suggestions
        </p>
        
        {/* Selection Summary */}
        <div className="flex gap-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-300">
              <Target className="w-4 h-4 inline-block mr-1 text-blue-500" />
              Your Videos: <span className="text-blue-400">{selectedMyVideos.length}/15</span>
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-300">
              <TrendingUp className="w-4 h-4 inline-block mr-1 text-green-500" />
              Competitor Videos: <span className="text-green-400">{selectedCompetitorVideos.length}/15</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* LEFT COLUMN - Zero1 Videos */}
        <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-6">
          <div className="mb-4 pb-4 border-b border-gray-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Your Videos
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Select up to 15 videos • Selected: {selectedMyVideos.length}/15
            </p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {myVideos.map((video) => {
              const isSelected = selectedMyVideos.find(v => v.video_id === video.video_id)
              
              return (
                <div
                  key={video.video_id}
                  onClick={() => handleMyVideoToggle(video)}
                  className={`flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-md'
                      : 'border-gray-700 hover:border-gray-600 bg-[#0a0a0a]'
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
                      {video.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {video.view_count?.toLocaleString()} views
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN - Competitor Videos */}
        <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-6">
          <div className="mb-4 pb-4 border-b border-gray-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Competitor Videos
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Search and select up to 15 videos • Selected: {selectedCompetitorVideos.length}/15
            </p>
          </div>

          {/* Search Interface */}
          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType('keyword')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'keyword'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#0a0a0a] text-gray-400 hover:bg-gray-800 border border-gray-700'
                }`}
              >
                Keyword
              </button>
              <button
                onClick={() => setSearchType('channel')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'channel'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#0a0a0a] text-gray-400 hover:bg-gray-800 border border-gray-700'
                }`}
              >
                Channel
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={
                  searchType === 'keyword'
                    ? 'Search by topic...'
                    : 'Search by channel name...'
                }
                className="flex-1 px-3 py-2 text-sm bg-[#0a0a0a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-500"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-700 transition-colors text-sm"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {competitorResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p>Search for competitor videos to compare</p>
              </div>
            ) : (
              competitorResults.map((video) => {
                const isSelected = selectedCompetitorVideos.find(v => v.video_id === video.video_id)
                
                return (
                  <div
                    key={video.video_id}
                    onClick={() => handleCompetitorVideoToggle(video)}
                    className={`flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-500/10 shadow-md'
                        : 'border-gray-700 hover:border-gray-600 bg-[#0a0a0a]'
                    }`}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {video.channel_name}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Prompt and Generate Section */}
      {selectedMyVideos.length > 0 && selectedCompetitorVideos.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Your Custom Prompt *
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Compare the style and format of these videos. Suggest how I can adapt the competitor's topics to match my channel's educational and engaging style..."
                rows={4}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-white placeholder-gray-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Describe how you want to analyze and adapt these videos
              </p>
            </div>

            <button
              onClick={handleGenerateSuggestions}
              disabled={generating || !customPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Format Suggestions...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Generate Format Suggestions
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinanceNiche
