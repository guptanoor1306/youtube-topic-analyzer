import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { CheckCircle, Circle, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

const Zero1Videos = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [selectedVideos, setSelectedVideos] = useState([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleVideo = (video) => {
    const isSelected = selectedVideos.find(v => v.video_id === video.video_id)
    
    if (isSelected) {
      setSelectedVideos(selectedVideos.filter(v => v.video_id !== video.video_id))
    } else {
      if (selectedVideos.length >= 15) {
        alert('You can select up to 15 videos')
        return
      }
      setSelectedVideos([...selectedVideos, video])
    }
  }

  const handleGenerateSuggestions = async () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least 1 video')
      return
    }

    if (!customPrompt.trim()) {
      alert('Please enter your custom prompt')
      return
    }

    setLoading(true)
    try {
      console.log('🚀 Sending request:', {
        channel_id: appState.primaryChannel.channel_id,
        video_ids: selectedVideos.map(v => v.video_id),
        prompt: customPrompt
      })

      const response = await axios.post(`${API_BASE_URL}/api/suggest-series`, {
        primary_channel_id: appState.primaryChannel.channel_id,
        selected_video_ids: selectedVideos.map(v => v.video_id),
        has_pdf_data: false,
        additional_prompt: customPrompt.trim()
      })

      console.log('✅ API Response:', response.data)

      if (response.data.success && response.data.suggestions) {
        setAppState(prevState => ({
          ...prevState,
          selectedMyVideos: selectedVideos,
          currentMode: 'suggest-series',
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
      setLoading(false)
    }
  }

  if (!appState.primaryChannel || !appState.availableVideos) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-700 font-medium">Loading Zero1 videos...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <img
            src={appState.primaryChannel.thumbnail}
            alt={appState.primaryChannel.title}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {appState.primaryChannel.title}
            </h2>
            <p className="text-gray-600 text-sm">
              Top {appState.availableVideos.length} long-form videos (sorted by views)
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select Videos (1-5)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Selected: {selectedVideos.length}/15
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appState.availableVideos?.map((video) => {
              const isSelected = selectedVideos.find(v => v.video_id === video.video_id)
              
              return (
                <div
                  key={video.video_id}
                  onClick={() => toggleVideo(video)}
                  className={`flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      {video.duration_minutes && (
                        <span className="text-xs text-blue-600 font-medium">
                          {video.duration_minutes} min
                        </span>
                      )}
                      {video.view_count && (
                        <span className="text-xs text-gray-500">
                          {(video.view_count / 1000).toFixed(0)}K views
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedVideos.length > 0 && (
          <div className="border-t pt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Your Custom Prompt *
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Generate 5 video topic ideas based on these videos that focus on beginner-friendly financial education for millennials..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                Be specific about what you want: topics, format, target audience, style, etc.
              </p>
            </div>

            <button
              onClick={handleGenerateSuggestions}
              disabled={loading || !customPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Suggestions
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Zero1Videos

