import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, CheckCircle, Circle, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

const CompetitorSearch = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [searchType, setSearchType] = useState('keyword') // 'keyword' or 'channel'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedVideos, setSelectedVideos] = useState(appState.selectedCompetitorVideos || [])
  const [searching, setSearching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const endpoint = searchType === 'keyword' ? '/api/search/videos' : '/api/search/channel'
      const response = await axios.post(endpoint, {
        query: searchQuery,
        max_results: 10
      })

      if (searchType === 'keyword') {
        setSearchResults(response.data.results)
      } else {
        setSearchResults(response.data.videos)
      }
    } catch (err) {
      alert('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const toggleVideo = (video) => {
    const isSelected = selectedVideos.find(v => v.video_id === video.video_id)
    
    if (isSelected) {
      setSelectedVideos(selectedVideos.filter(v => v.video_id !== video.video_id))
    } else {
      if (selectedVideos.length >= 5) {
        alert('You can select up to 5 videos')
        return
      }
      setSelectedVideos([...selectedVideos, video])
    }
  }

  const handleGenerateSuggestions = async () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least 1 competitor video')
      return
    }

    setGenerating(true)
    try {
      const response = await axios.post('/api/suggest-format', {
        my_video_ids: appState.selectedMyVideos.map(v => v.video_id),
        competitor_video_ids: selectedVideos.map(v => v.video_id),
        additional_prompt: additionalPrompt.trim() || null
      })

      setAppState({
        ...appState,
        selectedCompetitorVideos: selectedVideos,
        currentMode: 'suggest-format',
        results: response.data.suggestions
      })

      navigate('/results')
    } catch (err) {
      alert('Failed to generate suggestions. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/select-videos')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Video Selection
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Search Competitor Videos
        </h2>

        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setSearchType('keyword')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchType === 'keyword'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Keyword Search
            </button>
            <button
              onClick={() => setSearchType('channel')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchType === 'channel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Channel Search
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
                  ? 'Search by keyword (e.g., "stock market basics")'
                  : 'Search by channel name (e.g., "Finance Channel")'
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {searching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results - Select Videos (Max 5)
              </h3>
              <p className="text-sm text-gray-600">
                Selected: {selectedVideos.length}/5
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {searchResults.map((video) => {
                const isSelected = selectedVideos.find(v => v.video_id === video.video_id)
                
                return (
                  <div
                    key={video.video_id}
                    onClick={() => toggleVideo(video)}
                    className={`flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {video.channel_name}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {selectedVideos.length > 0 && (
          <div className="border-t pt-6 space-y-4">
            {/* Additional Prompt Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <button
                onClick={() => setShowPromptInput(!showPromptInput)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Sparkles className="w-4 h-4" />
                {showPromptInput ? '− Hide' : '+ Add'} Custom Instructions
              </button>
              
              {showPromptInput && (
                <div className="mt-3">
                  <textarea
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    placeholder="Add any specific instructions (e.g., 'Make it more educational' or 'Focus on practical examples')"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Provide additional context for format adaptation
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateSuggestions}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-md font-medium hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Format Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Format Suggestions
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {appState.selectedMyVideos && appState.selectedMyVideos.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">
            Your Selected Videos ({appState.selectedMyVideos.length})
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            {appState.selectedMyVideos.map((video) => (
              <li key={video.video_id} className="truncate">
                {video.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CompetitorSearch

