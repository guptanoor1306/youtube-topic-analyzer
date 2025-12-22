import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Flame, Zap, RefreshCw, Target, TrendingUp, Sparkles, Loader2, Home, Info, X } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const TEMPLATES = [
  { 
    id: 'trending', 
    name: 'Most Trending', 
    icon: Flame,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    metadata: { comments: 50, views: 20, title: 20, thumbnail: 10 },
    description: 'Identify topics currently resonating at scale — high views + discussion',
    prompt: `You are a senior content strategist for Zero1 — a YouTube channel that explains personal finance and money psychology to India's young salaried audience (22–35). 

Your task is to identify *high-potential new video topics* using a structured weighted analysis across these dimensions: 

INPUT DATA (provided for each of the top 12–40 Zero1 videos): - Video title - Thumbnail screenshot - View count - Top comments (with like counts) 

WEIGHTED ANALYSIS: Use the following weights to guide your selection of promising patterns: - View count → 20% weight: Look for unusually high-performing videos - Comment quality & volume → 50%: Prioritize recurring requests, emotional reactions, or insightful objections (esp. >30 likes) - Title phrasing → 20%: Note which phrases or formats (e.g., "vs", "What no one tells you…") consistently drive clicks - Thumbnail cues → 10%: Observe repeated color schemes, comparisons, or visual gimmicks that correlate with performance 

OBJECTIVE: Find new topics based on your above analysis which have the potential of doing well on Zero1 and should not be those which are already covered by Zero1. These topics should be most trending as per Zero1's audience preferences 

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Why it's trending with weighted evidence"}]`
  },
  { 
    id: 'antithesis', 
    name: 'Anti-Thesis', 
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    metadata: { comments: 90, title: 10 },
    description: 'Spot where audiences are pushing back or misinterpreting — to flip perspective',
    prompt: `You are a senior content strategist at Zero1 — a YouTube channel that demystifies personal finance and money psychology for India's young salaried professionals (ages 22–35). Your task is to extract high-potential *anti-thesis* topics — content ideas that arise from audience disagreement, misinterpretation, or pushback against existing videos. 

INPUT: You are provided with metadata from Zero1's video library: - Video title - Top comments (with like counts) 

OBJECTIVE: Identify high-engagement **contrarian themes** by analyzing: - Comments (90% weight): Look for replies that express disagreement, confusion, sarcasm, pushback, or "but what about..." arguments. Prioritize comments with 50+ likes, long discussions, or repeated objections across multiple videos. - Title (10% weight): Spot provocative framings that might have triggered emotional or polarizing responses. 

Your job is to: 1. Detect **anti-thesis cues** — misunderstandings, disagreements, or inverted takes from the audience 2. Translate those into **new content topics** that address, challenge, or flip the original message 3. Ensure the new topics remain aligned with Zero1's tone: clear, curious, psychologically grounded — not fear-based, scam-focused, or sensational 

CONSTRAINTS - Focus strictly on **topics**, not formats or structure - Avoid recycling past topics unless offering a *fresh reversal or clarification* - Do not use clickbait or negative framing — the anti-thesis must be *insightful*, not inflammatory 

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Audience contradiction and why this needs a response"}]`
  },
  { 
    id: 'pain_points', 
    name: 'Pain Points', 
    icon: Target,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    metadata: { comments: 60, transcript: 40 },
    description: 'Discover recurring problems users share — lifestyle, money stress, confusion',
    prompt: `You are a senior strategist at Zero1 — a YouTube channel that demystifies personal finance and money psychology for India's young salaried audience (ages 22–35). Your goal is to uncover *real money-related pain points* — struggles, frustrations, or life-stage dilemmas — that deeply resonate with the audience.

INPUT: You have access to the following metadata for each video: - Top comments (with like counts) - Transcript (or intro for Shorts)

OBJECTIVE: Surface **specific, high-emotion user struggles** using this weighted framework: - Comments (60%): Prioritize emotionally charged, high-like-count comments that highlight dilemmas, stress triggers, or pleas for clarity. Look for phrases like "I'm going through this," "this is so confusing," "any tips for…," or repeated frustrations across multiple videos. - Transcript (40%): Pinpoint which parts of the video triggered these reactions. Focus on stories, questions, or facts that provoked emotional responses or showed clear audience identification.

Your job is to: 1. Identify **repeat emotional or practical problems** 2. Translate them into **new, resonant topic ideas** that provide clarity, solutions, or simply emotional validation 3. Ensure each topic maintains Zero1's calm, clear tone — avoid clickbait, fear, or cringe

CONSTRAINTS - Focus strictly on **topics**, not formats or structure - Avoid recycling past topics unless offering a *genuinely new lens or emotional entry point* - Do not use scam-based or fear-driven framing

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Real audience struggle and why this topic offers value"}]`
  },
  { 
    id: 'format_recyclers', 
    name: 'Format Recyclers', 
    icon: RefreshCw,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    metadata: { title: 35, thumbnail: 25, transcript: 40 },
    description: 'Identify formats or structures that worked, not just topics',
    prompt: `You are a senior strategist at Zero1 — a YouTube channel that demystifies personal finance and money psychology for India's young salaried audience (ages 22–35). Your task is to identify **repeatable content formats** that consistently perform well and apply them to **completely new topics** that Zero1 has not yet explored.

INPUT: For each video, you are given: - Title - Thumbnail screenshot - Transcript

OBJECTIVE: Your goal is to identify **format patterns**, not topics. Use the following weighted analysis: - Transcript (40%): Study narrative flow — e.g., before–after contrast, personal challenge → resolution, myth → truth, checklists, frameworks, psychological story arcs, or reveal-based builds. - Title (35%): Extract title structures that imply formats — e.g., "X vs Y," "How I did X," "X things no one tells you…," "You're doing X wrong." - Thumbnail (25%): Observe structural visual cues — checklist blocks, item reveals, head-to-head labels, transformation cues, etc.

Then, propose **new topics** that: - Use one of these high-performing formats - Have **not been covered yet** on the Zero1 channel - Still match Zero1's calm, sharp, psychologically grounded tone

CONSTRAINTS - Focus strictly on topic suggestions — not visual thumbnails or title rewrites - ❌ Strictly exclude topics already explored on Zero1 - ❌ Avoid cringe, scam-busting, or fear-based hooks

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Repeatable format used and why this topic is fresh"}]`
  },
  { 
    id: 'viral_potential', 
    name: 'Viral Potential', 
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    metadata: { views: 40, comments: 30, title: 20, thumbnail: 10 },
    description: 'Identify topics with shareability, intrigue, or relatability',
    prompt: `You are a senior strategist at Zero1 — a YouTube channel that explores personal finance and money psychology for India's young salaried professionals (ages 22–35). Your job is to identify **new video topics with high viral potential**, using a combination of emotional response, curiosity triggers, and mass relatability — without relying on drama or fear.

INPUT: Each video contains: - View count - Top comments (with like counts) - Title - Thumbnail screenshot

OBJECTIVE: Use the following weighted signals to identify patterns behind viral performance: - Views (40%): Prioritize videos with unusually high view counts for the channel (especially within first 7–14 days), suggesting a breakout topic. - Comments (30%): Find high-like comments that say "I needed this," "why don't people talk about this?", or prompt mass tagging/sharing behavior. - Title (20%): Identify curiosity-first framings that might have boosted CTR (e.g. "versus," "hidden," "no one tells you," etc.). - Thumbnail (10%): Spot thumbnails that use emotional contrast, sharp comparisons, or striking visuals to stand out.

Use these patterns to propose **new, never-before-covered topics** with similar viral signals — especially ones that evoke strong reactions, curiosity, or "everyone should know this" behavior.

CONSTRAINTS - ✅ Suggest new topics only (no repeats of existing Zero1 videos) - ✅ Avoid scammy, cringe, or fear-based angles - ✅ Focus on *topic ideas* — not content formats or thumbnail design

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Viral trigger and why it's likely to go viral"}]`
  },
  { 
    id: 'custom', 
    name: 'Custom Template', 
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    metadata: {},
    description: 'Create your own analysis with custom metadata and prompt',
    prompt: '',
    isCustom: true
  }
]

const TemplateRunner = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [activeTemplate, setActiveTemplate] = useState('trending')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [favoritedTopics, setFavoritedTopics] = useState([]) // Store actual topic objects, not indices
  
  // Custom template state
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customMetadata, setCustomMetadata] = useState({
    title: false,
    thumbnail: false,
    thumbnail_text: false,
    views: false,
    comments: false,
    transcript: false
  })
  const [customPrompt, setCustomPrompt] = useState('')

  useEffect(() => {
    // Redirect if no videos selected
    if (!appState.selectedMyVideos || appState.selectedMyVideos.length === 0) {
      navigate('/')
    }
  }, [appState.selectedMyVideos, navigate])

  const selectedVideos = appState.availableVideos?.filter(
    v => appState.selectedMyVideos?.includes(v.video_id)
  ) || []

  const currentTemplate = TEMPLATES.find(t => t.id === activeTemplate)
  
  // Handle custom template click
  useEffect(() => {
    if (activeTemplate === 'custom') {
      setShowCustomModal(true)
    }
  }, [activeTemplate])

  const handleRunAnalysis = async (promptOverride = null, isRegeneration = false) => {
    // Validate
    if (!appState.selectedMyVideos || appState.selectedMyVideos.length === 0) {
      alert('No videos selected. Please go back and select videos first.')
      return
    }
    
    // Always clear current results before starting (but keep favorites)
    setResults([])
    setLoading(true)
    
    try {
      // Make sure promptOverride is a string, not an event object
      let promptToUse = currentTemplate.prompt
      if (promptOverride && typeof promptOverride === 'string') {
        promptToUse = promptOverride
      }
      
      console.log('🔍 Starting analysis:', {
        template: activeTemplate,
        videoCount: appState.selectedMyVideos.length,
        videoIds: appState.selectedMyVideos,
        isRegeneration
      })
      
      // Fetch transcripts and comments for selected videos
      const response = await axios.post(`${API_BASE_URL}/api/analyze/template`, {
        video_ids: appState.selectedMyVideos,
        template_id: activeTemplate,
        custom_prompt: promptToUse,
        metadata: activeTemplate === 'custom' ? customMetadata : currentTemplate.metadata
      })

      console.log('✅ Analysis response:', response.data)
      
      if (response.data.success) {
        // Parse results - expect array of objects with {topic, reason}
        const parsedResults = response.data.topics || []
        console.log('📊 Parsed results:', parsedResults)
        setResults(parsedResults)
        // Favorites are kept as separate objects, not affected by new results
      } else {
        throw new Error('Analysis failed: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Analysis error:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error'
      alert(`Failed to run analysis: ${errorMessage}\n\nPlease try again.`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCustomTemplateSubmit = (e) => {
    if (e) e.preventDefault()
    
    if (!customPrompt.trim()) {
      alert('Please enter a prompt')
      return
    }
    
    const selectedMetadata = Object.keys(customMetadata).filter(key => customMetadata[key])
    if (selectedMetadata.length === 0) {
      alert('Please select at least one metadata field')
      return
    }
    
    setShowCustomModal(false)
    // Pass just the prompt string, not the event
    handleRunAnalysis(customPrompt, false)
  }

  const handleRegenerate = (e) => {
    if (e) e.preventDefault()
    handleRunAnalysis(null, true) // Pass true for isRegeneration
  }

  const toggleFavorite = (result) => {
    const topic = typeof result === 'string' ? result : result.topic
    const reason = typeof result === 'object' && result.reason ? result.reason : 'This topic was identified based on the selected template analysis.'
    
    const topicObj = { topic, reason }
    
    // Check if already favorited by comparing topic text
    const existingIndex = favoritedTopics.findIndex(fav => fav.topic === topic)
    
    if (existingIndex >= 0) {
      // Remove from favorites
      setFavoritedTopics(prev => prev.filter((_, idx) => idx !== existingIndex))
    } else {
      // Add to favorites
      setFavoritedTopics(prev => [...prev, topicObj])
    }
  }
  
  const isTopicFavorited = (result) => {
    const topic = typeof result === 'string' ? result : result.topic
    return favoritedTopics.some(fav => fav.topic === topic)
  }

  if (!appState.selectedMyVideos || appState.selectedMyVideos.length === 0) {
    return null
  }

  const displayedResults = showFavorites 
    ? favoritedTopics
    : results

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Topic Analyser</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Within {appState.primaryChannel?.title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Selected Videos */}
          <div className="col-span-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              {/* Channel Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <img
                  src={appState.primaryChannel?.thumbnail}
                  alt={appState.primaryChannel?.title}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">
                    {appState.primaryChannel?.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedVideos.length} videos selected
                  </p>
                </div>
                <button
                  onClick={() => navigate('/video-selection')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  Edit
                </button>
              </div>


              {/* Video List */}
              <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                {selectedVideos.map((video) => (
                  <div
                    key={video.video_id}
                    className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {Math.floor(video.duration_minutes)}:{String(Math.floor((video.duration_minutes % 1) * 60)).padStart(2, '0')}
                      </div>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          type="checkbox"
                          checked
                          className="w-5 h-5 rounded border-2 border-white"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{(video.view_count / 1000).toFixed(0)}K views</span>
                        <span>•</span>
                        <span>{new Date(video.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {video.view_count >= 100000 ? '2.1x' : '1.5x'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Templates & Results */}
          <div className="col-span-7">
            {/* Template Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 mb-4">
              <div className="flex items-center gap-1 p-2 overflow-x-auto">
                {TEMPLATES.map((template) => {
                  const Icon = template.icon
                  const isActive = activeTemplate === template.id
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => setActiveTemplate(template.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? template.color : ''}`} />
                      {template.name}
                    </button>
                  )
                })}
              </div>
              
              {/* Template Description & Metadata */}
              {currentTemplate && !currentTemplate.isCustom && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mb-2 mt-3">{currentTemplate.description}</p>
                  {currentTemplate.metadata && Object.keys(currentTemplate.metadata).length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Metadata weights:</span>
                      {Object.entries(currentTemplate.metadata).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                        >
                          {key}: {value}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results Container */}
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Results Header */}
              <div className="flex items-center gap-4 p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowFavorites(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !showFavorites
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Results ({results.length})
                </button>
                <button
                  onClick={() => setShowFavorites(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showFavorites
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Favorites ({favoritedTopics.length})
                </button>
              </div>

              {/* Results List */}
              <div className="p-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">Analyzing videos...</p>
                      <p className="text-xs text-gray-500 mt-1">Fetching transcripts and comments</p>
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-20">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to analyze
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Click the button below to run the {currentTemplate?.name} template
                    </p>
                    <button
                      onClick={() => handleRunAnalysis()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Run Analysis
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto mb-4">
                      {displayedResults.map((result, index) => {
                        const topic = typeof result === 'string' ? result : result.topic
                        const reason = typeof result === 'object' && result.reason ? result.reason : 'This topic was identified based on the selected template analysis.'
                        const isFavorited = isTopicFavorited(result)
                        
                        return (
                          <div
                            key={`${showFavorites ? 'fav' : 'result'}-${index}`}
                            className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                          >
                            <button
                              onClick={() => toggleFavorite(result)}
                              className="mt-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <svg
                                className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'fill-none'}`}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 mb-1">{topic}</h4>
                            </div>
                            <div className="relative group/info flex-shrink-0">
                              <button 
                                type="button"
                                className="mt-1 p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                                title="Why is this recommended?"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-blue-200 rounded-lg shadow-2xl p-4 z-50 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all pointer-events-none">
                                <div className="flex items-start gap-2 mb-2">
                                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm font-semibold text-gray-900">Why this topic?</p>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{reason}</p>
                                <div className="absolute top-0 right-8 -mt-2 w-4 h-4 bg-white border-l-2 border-t-2 border-blue-200 transform rotate-45"></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Regenerate Button */}
                    <button
                      onClick={() => handleRegenerate()}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Re-generate
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Template Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Custom Template</h2>
              </div>
              <button
                onClick={() => {
                  setShowCustomModal(false)
                  if (results.length === 0) {
                    setActiveTemplate('trending')
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Metadata Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Metadata to Analyze</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Choose which data points to include in your analysis
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'title', label: 'Title', available: true, note: 'Video titles' },
                    { key: 'thumbnail', label: 'Thumbnail URL', available: true, note: 'Thumbnail image URLs' },
                    { key: 'thumbnail_text', label: 'Thumbnail Text (OCR)', available: false, note: 'Not yet implemented' },
                    { key: 'views', label: 'Views', available: true, note: 'View counts' },
                    { key: 'comments', label: 'Comments', available: true, note: 'Top 50 comments' },
                    { key: 'transcript', label: 'Transcript', available: true, note: 'Full video transcripts' }
                  ].map(({ key, label, available, note }) => (
                    <label
                      key={key}
                      className={`flex flex-col gap-2 p-4 border-2 rounded-lg transition-all ${
                        !available
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : customMetadata[key]
                          ? 'border-blue-500 bg-blue-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customMetadata[key]}
                          disabled={!available}
                          onChange={(e) => setCustomMetadata(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="w-5 h-5 text-blue-600 rounded disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{label}</span>
                            {!available && (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{note}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Analysis Prompt</h3>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom analysis prompt here... 

Example:
Analyze these videos to find topics that appeal to beginners in personal finance. Focus on simple, actionable topics that break down complex concepts.

Return ONLY a JSON array of objects with this format:
[{&quot;topic&quot;: &quot;Topic title&quot;, &quot;reason&quot;: &quot;Why this topic works&quot;}]"
                  className="w-full h-64 px-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 font-mono"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Tip: Make sure to specify the output format as JSON with "topic" and "reason" fields
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCustomTemplateSubmit}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Run Custom Analysis
                </button>
                <button
                  onClick={() => {
                    setShowCustomModal(false)
                    if (results.length === 0) {
                      setActiveTemplate('trending')
                    }
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TemplateRunner

