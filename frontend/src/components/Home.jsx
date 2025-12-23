import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, Youtube } from 'lucide-react'
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
    <div className="min-h-[calc(100vh-150px)] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            YouTube Topic Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Discover winning content ideas from your channel's top videos
          </p>
        </div>

        {/* Channel Search Box */}
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

        {/* Popular Channels (Cached) */}
        {!loadingCached && cachedChannels.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Channels</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cachedChannels.map((channel) => (
                <button
                  key={channel.channel_id}
                  onClick={() => selectChannel({
                    channel_id: channel.channel_id,
                    title: channel.channel_title,
                    thumbnail: `https://yt3.ggpht.com/ytc/default_${channel.channel_id}`
                  })}
                  disabled={settingUpChannel}
                  className="group flex flex-col items-center gap-3 p-4 bg-white rounded-xl hover:shadow-lg border border-gray-200 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={channel.channel_title}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-500 transition-colors shadow-md">
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <Youtube className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-full">
                      {channel.channel_title}
                    </p>
                    {channel.video_count > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {channel.video_count} videos
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
          <div className="mt-8 text-center text-sm text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
            Loading popular channels...
          </div>
        )}
      </div>
    </div>
  )
}

export default Home

