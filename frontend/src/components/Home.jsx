import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, TrendingUp, Globe, Search, Loader2 } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const Home = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [channelSearchQuery, setChannelSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [showChannelSearch, setShowChannelSearch] = useState(false)

  useEffect(() => {
    // Auto-setup the primary channel in background
    const setupChannel = async () => {
      if (!appState.primaryChannel && !isLoading) {
        setIsLoading(true)
        try {
          console.log('Setting up channel...')
          const response = await fetch(`${API_BASE_URL}/api/channel/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel_id: 'UCUUlw3anBIkbW9W44Y-eURw',
              channel_name: 'Zero1 by Zerodha'
            })
          })
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('Channel setup response:', data)
          
          if (data.success) {
            setAppState(prevState => ({
              ...prevState,
              primaryChannel: data.channel,
              availableVideos: data.recent_videos
            }))
            console.log('Channel setup complete!')
          } else {
            console.error('Channel setup failed:', data)
          }
        } catch (error) {
          console.error('Failed to setup channel:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    setupChannel()
  }, [])

  const handleChannelSearch = async () => {
    if (!channelSearchQuery.trim()) {
      alert('Please enter a channel name or ID')
      return
    }

    setSearching(true)
    try {
      // Search for channel
      const searchResponse = await axios.post(`${API_BASE_URL}/api/search/channel`, {
        query: channelSearchQuery,
        max_results: 1
      })

      if (searchResponse.data.channels && searchResponse.data.channels.length > 0) {
        const channel = searchResponse.data.channels[0]
        
        // Setup this channel as primary
        const setupResponse = await axios.post(`${API_BASE_URL}/api/channel/setup`, {
          channel_id: channel.channel_id,
          channel_name: channel.title
        })

        if (setupResponse.data.success) {
          setAppState(prevState => ({
            ...prevState,
            primaryChannel: setupResponse.data.channel,
            availableVideos: setupResponse.data.recent_videos
          }))
          
          setShowChannelSearch(false)
          setChannelSearchQuery('')
          alert(`Successfully loaded ${channel.title}!`)
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

  const handleCircleClick = (type) => {
    if (!appState.primaryChannel) {
      alert('Please wait for channel to load or search for a channel')
      return
    }
    
    if (type === 'zero1') {
      navigate('/zero1-videos')
    } else if (type === 'finance') {
      navigate('/finance-niche')
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube Topic Analyzer</h1>
        <p className="text-gray-600">Select your analysis scope</p>
      </div>

      {/* Channel Selection/Status */}
      <div className="w-full max-w-2xl mb-8">
        {!showChannelSearch ? (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">Loading channel...</span>
                  </>
                ) : appState.primaryChannel ? (
                  <>
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {appState.primaryChannel.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appState.availableVideos?.length || 0} videos loaded
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">No channel loaded</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowChannelSearch(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
                Change Channel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Search for a Channel</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChannelSearch()}
                placeholder="Enter channel name or ID (e.g., Zero1 by Zerodha)"
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={searching}
              />
              <button
                onClick={handleChannelSearch}
                disabled={searching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
              >
                {searching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
              <button
                onClick={() => {
                  setShowChannelSearch(false)
                  setChannelSearchQuery('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Search for any YouTube channel to analyze
            </p>
          </div>
        )}
      </div>

      {/* Circles Container */}
      <div className="relative w-full max-w-3xl aspect-square flex items-center justify-center p-8">
        
        {/* Outer Circle - Outside Niche (Disabled) */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 opacity-40 border-4 border-gray-300">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-4 text-center">
            <Globe className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            <p className="text-gray-500 font-semibold text-sm">Outside Niche</p>
            <p className="text-xs text-gray-400">Coming Soon</p>
          </div>
        </div>

        {/* Middle Circle - Finance Niche */}
        <div 
          onClick={() => handleCircleClick('finance')}
          className="absolute inset-[12%] rounded-full bg-gradient-to-br from-green-400 to-teal-500 shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center group border-4 border-white"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full text-center pointer-events-none">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <p className="text-gray-900 font-bold text-base mb-0.5">Finance Niche</p>
            <p className="text-gray-600 text-xs">Search & Select Videos</p>
          </div>
        </div>

        {/* Inner Circle - Zero1 */}
        <div 
          onClick={() => handleCircleClick('zero1')}
          className="absolute inset-[30%] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center group border-4 border-white"
        >
          <div className="text-center px-4">
            <Target className="w-12 h-12 text-white mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h2 className="text-white font-bold text-xl mb-1">
              {appState.primaryChannel?.title.split(' ')[0] || 'Your Channel'}
            </h2>
            <p className="text-white/90 text-xs">Your Channel</p>
            <p className="text-white/70 text-xs mt-1">Top 30 Videos</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center mt-4">
        <p className="text-gray-600 text-sm mb-4">
          Click on a circle to start analyzing videos
        </p>
        
        {/* Legend */}
        <div className="flex gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <span className="text-xs text-gray-600">Your Content</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-teal-500"></div>
            <span className="text-xs text-gray-600">Finance Industry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 opacity-60"></div>
            <span className="text-xs text-gray-400">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

