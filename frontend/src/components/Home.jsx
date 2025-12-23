import React, { useState, useEffect } from 'react'
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
  const [cachedChannels, setCachedChannels] = useState([])
  const [loadingCached, setLoadingCached] = useState(true)

  // Fetch cached channels on mount
  useEffect(() => {
    fetchCachedChannels()
  }, [])

  const fetchCachedChannels = async () => {
    try {
      console.log('🔍 Fetching cached channels from:', `${API_BASE_URL}/api/cache/channels`)
      const response = await axios.get(`${API_BASE_URL}/api/cache/channels`)
      console.log('📊 Cached channels response:', response.data)
      setCachedChannels(response.data.channels || [])
      console.log(`✅ Found ${response.data.channels?.length || 0} cached channels`)
    } catch (error) {
      console.error('❌ Error fetching cached channels:', error)
      console.error('Error details:', error.response?.data || error.message)
    } finally {
      setLoadingCached(false)
    }
  }

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
        max_results: 100
      })

      if (setupResponse.data.success) {
        console.log('📹 Received videos:', setupResponse.data.recent_videos?.length || 0)
        // Save to app state
        setAppState(prev => ({
          ...prev,
          primaryChannel: {
            id: channel.channel_id,
            name: channel.title,
            thumbnail: channel.thumbnail
          },
          availableVideos: setupResponse.data.recent_videos || []
        }))

        // Navigate to video selection
        navigate('/video-selection')
      } else {
        alert('Error fetching videos. Please try again.')
      }
    } catch (error) {
      console.error('Channel setup error:', error)
      alert('Error setting up channel. Please try again.')
    } finally {
      setSettingUpChannel(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Minimal Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            YouTube Topic Analyzer
          </h1>
          <p className="text-gray-600">
            Analyze any YouTube channel to discover winning content ideas
          </p>
        </div>

        {/* Channel Search Box - Main Focus */}
        <div className="bg-white rounded-lg border border-gray-300 p-6 mb-12 hover:border-gray-400 transition-colors">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Search for a YouTube Channel
          </label>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={channelSearchQuery}
              onChange={(e) => setChannelSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChannelSearch()}
              placeholder="Enter channel name (e.g., Think School, Zero1 by Zerodha)"
              className="flex-1 px-4 py-3 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-400 transition-all"
              disabled={searching}
            />
            <button
              onClick={handleChannelSearch}
              disabled={searching || settingUpChannel || !channelSearchQuery.trim()}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-base flex items-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : settingUpChannel ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
          
          <p className="mt-3 text-sm text-gray-500">
            Fetches top 100 videos for AI-powered topic analysis
          </p>

          {/* Channel Selection Dropdown */}
          {showChannelDropdown && channelResults.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border border-gray-300 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Select a Channel ({channelResults.length} found)
                </h3>
                <button
                  onClick={() => {
                    setShowChannelDropdown(false)
                    setChannelResults([])
                  }}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
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
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">
                        {channel.title}
                      </p>
                      {channel.subscriber_count && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {parseInt(channel.subscriber_count).toLocaleString()} subscribers
                        </p>
                      )}
                    </div>
                    {settingUpChannel && (
                      <Loader2 className="w-4 h-4 text-gray-600 animate-spin flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Popular Channels (Cached) - Keep as is */}
        {!loadingCached && cachedChannels.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-300 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Popular Channels</h2>
                <p className="text-sm text-gray-600 mt-1">Quick access to recently analyzed channels</p>
              </div>
              <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                {cachedChannels.length} {cachedChannels.length === 1 ? 'channel' : 'channels'}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cachedChannels.map((channel) => (
                <button
                  key={channel.channel_id}
                  onClick={() => selectChannel({
                    channel_id: channel.channel_id,
                    title: channel.channel_title,
                    thumbnail: channel.thumbnail_url
                  })}
                  disabled={settingUpChannel}
                  className="group flex flex-col items-center gap-3 p-5 bg-gray-50 rounded-xl hover:shadow-lg hover:bg-white border-2 border-transparent hover:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={channel.channel_title}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-gray-200 group-hover:border-red-500 group-hover:scale-110 transition-all shadow-lg">
                    {channel.thumbnail_url ? (
                      <img 
                        src={channel.thumbnail_url} 
                        alt={channel.channel_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <Youtube className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {channel.channel_title}
                    </p>
                    {channel.video_count > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {channel.video_count} videos cached
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingCached && (
          <div className="bg-white rounded-lg border border-gray-300 p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin inline-block text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Loading popular channels...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home

