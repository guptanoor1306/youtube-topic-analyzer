import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

const VideoSelection = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [selectedVideos, setSelectedVideos] = useState(appState.selectedMyVideos || [])
  const [loading, setLoading] = useState(false)
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [showPromptInput, setShowPromptInput] = useState(false)

  useEffect(() => {
    if (!appState.primaryChannel) {
      navigate('/')
    }
  }, [appState.primaryChannel, navigate])

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

  const handleSuggestSeries = async () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least 1 video')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/suggest-series', {
        primary_channel_id: appState.primaryChannel.channel_id,
        selected_video_ids: selectedVideos.map(v => v.video_id),
        has_pdf_data: !!appState.pdfData,
        additional_prompt: additionalPrompt.trim() || null
      })

      setAppState({
        ...appState,
        selectedMyVideos: selectedVideos,
        currentMode: 'suggest-series',
        results: response.data.suggestions
      })

      navigate('/results')
    } catch (err) {
      alert('Failed to generate suggestions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueToCompetitor = () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least 1 video')
      return
    }

    setAppState({
      ...appState,
      selectedMyVideos: selectedVideos
    })

    navigate('/competitor-search')
  }

  if (!appState.primaryChannel) return null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Channel Setup
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-start gap-4 mb-6">
          <img
            src={appState.primaryChannel.thumbnail}
            alt={appState.primaryChannel.title}
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {appState.primaryChannel.title}
            </h2>
            <p className="text-gray-600 mt-1">
              {appState.primaryChannel.subscriber_count} subscribers • {appState.primaryChannel.video_count} videos
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select Your Videos (1-5)
          </h3>
          <p className="text-sm text-gray-600">
            Selected: {selectedVideos.length}/5 • Showing long-form videos (&gt;3 min) sorted by most views
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(video.published_at).toLocaleDateString()}
                    </p>
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

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Choose Your Path
          </h3>

          {/* Additional Prompt Section */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                  placeholder="Add any specific instructions or focus areas for the AI (e.g., 'Focus on beginner-friendly content' or 'Emphasize data-driven insights')"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Provide additional context or specific requirements for better suggestions
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleSuggestSeries}
              disabled={loading || selectedVideos.length === 0}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-1">Suggest Series</h4>
                <p className="text-sm text-gray-600">
                  Generate series ideas based on your selected videos
                </p>
              </div>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              )}
            </button>

            <button
              onClick={handleContinueToCompetitor}
              disabled={selectedVideos.length === 0}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-lg hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowRight className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-1">Suggest Format</h4>
                <p className="text-sm text-gray-600">
                  Search competitor videos and adapt their format
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoSelection

