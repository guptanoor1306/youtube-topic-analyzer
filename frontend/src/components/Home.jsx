import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, Youtube, TrendingUp } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const Home = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [channelSearchQuery, setChannelSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [channelResults, setChannelResults] = useState([])
  const [showChannelDropdown, setShowChannelDropdown] = useState(false)
  const [settingUpChannel, setSettingUpChannel] = useState(false)

  // No auto-setup needed - user will search and select

  const handleChannelSearch = async () => {
    if (!channelSearchQuery.trim()) {
      alert('Please enter a channel name or ID')
      return
    }

    setSearching(true)
    try {
      // Search for channels - get up to 5 results
      const searchResponse = await axios.post(`${API_BASE_URL}/api/search/channel`, {
        query: channelSearchQuery,
        max_results: 5
      })

      if (searchResponse.data.channels && searchResponse.data.channels.length > 0) {
        const channels = searchResponse.data.channels
        
        if (channels.length === 1) {
          // Only one result, proceed directly
          await selectChannel(channels[0])
        } else {
          // Multiple results, show dropdown
          setChannelResults(channels)
          setShowChannelDropdown(true)
        }
      } else {
        alert('No channels found. Try a different search term.')
      }
    } catch (error) {
      console.error('Channel search error:', error)
      alert('Error searching for channel. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const selectChannel = async (channel) => {
    setSettingUpChannel(true)
    setShowChannelDropdown(false)
    try {
        
        // Setup channel and fetch top 100 videos
        const setupResponse = await axios.post(`${API_BASE_URL}/api/channel/setup`, {
          channel_id: channel.channel_id,
          channel_name: channel.title,
          max_videos: 100
        })

        if (setupResponse.data.success) {
          setAppState(prevState => ({
            ...prevState,
            primaryChannel: setupResponse.data.channel,
            availableVideos: setupResponse.data.recent_videos
          }))
          
          // Navigate to video selection
          navigate('/video-selection')
        }
      } else {
        alert('No channel found. Please try a different search term.')
      }
    } catch (err) {
      console.error('Channel search error:', err)
      alert('Failed to search channel. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center py-12 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-2xl mb-6 shadow-lg">
          <Youtube className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          YouTube Topic Analyzer
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover winning content ideas from your channel's top videos
        </p>
      </div>

      {/* Channel Search Box */}
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Search for a YouTube Channel</h2>
          </div>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={channelSearchQuery}
              onChange={(e) => setChannelSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChannelSearch()}
              placeholder="Enter channel name (e.g., Think School, Zero1 by Zerodha)"
              className="flex-1 px-4 py-3 text-base bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              disabled={searching}
            />
            <button
              onClick={handleChannelSearch}
              disabled={searching || settingUpChannel || !channelSearchQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-base flex items-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : settingUpChannel ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading videos...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
          
          <p className="mt-3 text-sm text-gray-500">
            We'll fetch the top 100 videos from this channel for analysis
          </p>

          {/* Channel Selection Dropdown */}
          {showChannelDropdown && channelResults.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border-2 border-blue-500 shadow-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select a Channel ({channelResults.length} found)
                </h3>
                <button
                  onClick={() => {
                    setShowChannelDropdown(false)
                    setChannelResults([])
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {channelResults.map((channel) => (
                  <button
                    key={channel.channel_id}
                    onClick={() => selectChannel(channel)}
                    disabled={settingUpChannel}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {channel.title}
                      </p>
                      {channel.description && (
                        <p className="text-sm text-gray-500 truncate">
                          {channel.description}
                        </p>
                      )}
                      {channel.subscriber_count && (
                        <p className="text-xs text-gray-400 mt-1">
                          {parseInt(channel.subscriber_count).toLocaleString()} subscribers
                        </p>
                      )}
                    </div>
                    {settingUpChannel && (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
            <Youtube className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Select Videos</h3>
          <p className="text-sm text-gray-600">Choose from top 100 videos to analyze</p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Run Templates</h3>
          <p className="text-sm text-gray-600">Apply AI templates to find patterns</p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
            <Search className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Get Insights</h3>
          <p className="text-sm text-gray-600">Discover trending topics and gaps</p>
        </div>
      </div>
    </div>
  )
}

export default Home

