import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Play, Clock, Eye, Loader2 } from 'lucide-react'

const NewVideoSelection = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [selectedVideos, setSelectedVideos] = useState([])
  const [filter, setFilter] = useState('all') // all, latest, popular
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Redirect if no channel selected
    if (!appState.primaryChannel) {
      navigate('/')
    }
  }, [appState.primaryChannel, navigate])

  const handleVideoToggle = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    )
  }

  const handleSelectAll = () => {
    if (selectedVideos.length === appState.availableVideos?.length) {
      setSelectedVideos([])
    } else {
      setSelectedVideos(appState.availableVideos?.map(v => v.video_id) || [])
    }
  }

  const handleContinue = () => {
    if (selectedVideos.length === 0) {
      alert('Please select at least one video')
      return
    }

    setAppState(prev => ({
      ...prev,
      selectedMyVideos: selectedVideos
    }))

    navigate('/template-runner')
  }

  const getFilteredVideos = () => {
    if (!appState.availableVideos) return []
    
    let videos = [...appState.availableVideos]
    
    if (filter === 'latest') {
      videos.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    } else if (filter === 'popular') {
      videos.sort((a, b) => b.view_count - a.view_count)
    }
    
    return videos
  }

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views
  }

  const formatDuration = (minutes) => {
    const mins = Math.floor(minutes)
    const secs = Math.floor((minutes - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!appState.primaryChannel) {
    return null
  }

  const filteredVideos = getFilteredVideos()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {appState.primaryChannel.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredVideos.length} videos • {selectedVideos.length} selected
                </p>
              </div>
            </div>
            
            <button
              onClick={handleContinue}
              disabled={selectedVideos.length === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Continue with {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('latest')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'latest'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setFilter('popular')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'popular'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Popular
            </button>
          </div>

          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedVideos.length === filteredVideos.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => {
            const isSelected = selectedVideos.includes(video.video_id)
            
            return (
              <div
                key={video.video_id}
                onClick={() => handleVideoToggle(video.video_id)}
                className={`bg-white rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 shadow-lg shadow-blue-100'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full aspect-video object-cover rounded-t-xl"
                  />
                  
                  {/* Checkbox */}
                  <div className="absolute top-2 right-2">
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white/90 border-white backdrop-blur-sm'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration_minutes)}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {formatViews(video.view_count)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default NewVideoSelection

