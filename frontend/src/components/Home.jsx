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
    <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center py-6 px-4">
      {/* Channel Selection/Status */}
      <div className="w-full max-w-2xl mb-6">
        {!showChannelSearch ? (
          <div className="bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-sm text-gray-400">Loading Zero1 by Zerodha...</span>
                  </>
                ) : appState.primaryChannel ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {appState.primaryChannel.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {appState.availableVideos?.length || 0} videos loaded
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                    <span className="text-sm text-gray-400">No channel loaded</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowChannelSearch(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-blue-500/30"
              >
                <Search className="w-4 h-4" />
                Use Another Channel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Search for a Channel</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChannelSearch()}
                placeholder="Enter channel name (e.g., Think School)"
                className="flex-1 px-4 py-2 text-sm bg-[#0a0a0a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                disabled={searching}
              />
              <button
                onClick={handleChannelSearch}
                disabled={searching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 transition-colors font-medium text-sm"
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
                className="px-4 py-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors text-sm"
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

      {/* Circles Container - Made Smaller */}
      <div className="relative w-full max-w-xl aspect-square flex items-center justify-center p-4">
        
        {/* Outer Circle - Outside Niche (Disabled) - Dashed Border */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-gray-700/50 bg-transparent">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-center">
            <Globe className="w-5 h-5 text-gray-600 mx-auto mb-1" />
            <p className="text-gray-500 font-semibold text-xs whitespace-nowrap">Outside Niche</p>
            <p className="text-xs text-gray-600">Coming Soon</p>
          </div>
        </div>

        {/* Middle Circle - Finance Niche */}
        <div 
          onClick={() => handleCircleClick('finance')}
          className="absolute inset-[15%] rounded-full bg-gradient-to-br from-green-500 to-teal-600 shadow-xl cursor-pointer hover:shadow-2xl hover:shadow-green-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center group border-4 border-gray-900"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <p className="text-white font-bold text-sm mb-0.5 whitespace-nowrap">Finance Niche</p>
            <p className="text-gray-300 text-xs whitespace-nowrap">Search & Select Videos</p>
          </div>
        </div>

        {/* Inner Circle - Zero1 */}
        <div 
          onClick={() => handleCircleClick('zero1')}
          className="absolute inset-[32%] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl cursor-pointer hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center group border-4 border-gray-900"
        >
          <div className="text-center px-4">
            <Target className="w-10 h-10 text-white mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <h2 className="text-white font-bold text-base mb-0.5">
              {appState.primaryChannel?.title.split(' ')[0] || 'Your Channel'}
            </h2>
            <p className="text-white/80 text-xs">Your Channel</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center mt-4">
        <p className="text-gray-400 text-sm mb-3">
          Click on a circle to start analyzing videos
        </p>
        
        {/* Legend */}
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm"></div>
            <span className="text-xs text-gray-400">Your Content</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-teal-600 shadow-sm"></div>
            <span className="text-xs text-gray-400">Finance Industry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 opacity-60"></div>
            <span className="text-xs text-gray-600">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

