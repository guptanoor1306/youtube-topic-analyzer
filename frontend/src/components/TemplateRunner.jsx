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
    prompt: `You are a senior content strategist analyzing YouTube video performance data.

Your task is to identify *high-potential new video topics* using a structured weighted analysis of the provided videos.

INPUT DATA (provided for each video):
- Video title
- Thumbnail screenshot  
- View count
- Top comments (with like counts)

WEIGHTED ANALYSIS: Use the following weights to guide your selection of promising patterns:
- View count → 20% weight: Look for unusually high-performing videos relative to the channel average
- Comment quality & volume → 50%: Prioritize recurring requests, emotional reactions, questions, or insightful discussions (especially comments with high likes)
- Title phrasing → 20%: Note which phrases or formats (e.g., "vs", "How to", "What happens when...") consistently drive engagement
- Thumbnail cues → 10%: Observe repeated visual patterns that correlate with performance

OBJECTIVE: Based STRICTLY on the selected videos provided, identify new related topics that:
1. Build on themes present in the selected videos
2. Address questions or interests expressed in the comments
3. Have potential to perform well based on observed patterns
4. Are NOT already covered in the selected videos (suggest new angles or extensions)

CRITICAL: Analyze ONLY the selected videos provided. Do not assume any channel niche or audience. Base your recommendations entirely on patterns in the provided video data.

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Why it's trending based on the selected video data"}]`
  },
  { 
    id: 'antithesis', 
    name: 'Anti-Thesis', 
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    metadata: { comments: 90, title: 10 },
    description: 'Spot where audiences are pushing back or misinterpreting — to flip perspective',
    prompt: `You are a senior content strategist analyzing YouTube audience engagement.

Your task is to extract high-potential *anti-thesis* topics — content ideas that arise from audience disagreement, misinterpretation, or pushback against the selected videos.

INPUT: You are provided with metadata from the selected videos:
- Video title
- Top comments (with like counts)

WEIGHTED ANALYSIS:
- Comments (90% weight): Look for replies that express disagreement, confusion, alternative viewpoints, or "but what about..." arguments. Prioritize comments with high likes, long discussions, or repeated objections.
- Title (10% weight): Note video titles that might have triggered emotional or polarizing responses.

YOUR JOB:
1. Detect **anti-thesis cues** — misunderstandings, disagreements, or alternative perspectives from viewers
2. Translate those into **new content topics** that address, challenge, or flip the original message
3. Ensure the new topics offer genuine value — not inflammatory clickbait

CRITICAL: Base your analysis ONLY on the selected videos and their actual comments. Do not assume channel niche or make up audience perspectives.

CONSTRAINTS:
- Focus strictly on **topics**, not formats or structure
- Avoid recycling topics already covered in the selected videos
- Suggest insightful counter-perspectives, not inflammatory ones

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Audience contradiction observed and why this deserves a response"}]`
  },
  { 
    id: 'pain_points', 
    name: 'Pain Points', 
    icon: Target,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    metadata: { comments: 60, transcript: 40 },
    description: 'Discover recurring problems users share in comments and content',
    prompt: `You are a senior content strategist analyzing YouTube audience pain points.

Your goal is to uncover *real problems, struggles, or frustrations* expressed by viewers of the selected videos.

INPUT: You have access to the following metadata for each selected video:
- Top comments (with like counts)
- Video transcript

WEIGHTED ANALYSIS:
- Comments (60%): Prioritize emotionally charged or high-engagement comments that reveal problems, confusion, or requests for help. Look for phrases like "I'm struggling with...", "How do I...", "This is confusing", "I wish you covered...", or repeated questions across videos.
- Transcript (40%): Identify which parts of the video content triggered these reactions. Note topics or questions that generated strong audience identification or emotional responses.

YOUR JOB:
1. Identify **recurring problems or questions** expressed by viewers
2. Translate them into **new topic ideas** that address these pain points
3. Ensure topics offer genuine value — clarity, solutions, or guidance

CRITICAL: Analyze ONLY the selected videos provided. Base pain points entirely on actual viewer comments and content, not assumptions about channel niche.

CONSTRAINTS:
- Focus strictly on **topics**, not formats
- Avoid recycling topics already covered in the selected videos
- No clickbait or fear-driven framing

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Specific audience pain point and why this topic addresses it"}]`
  },
  { 
    id: 'format_recyclers', 
    name: 'Format Recyclers', 
    icon: RefreshCw,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    metadata: { title: 35, thumbnail: 25, transcript: 40 },
    description: 'Identify formats or structures that worked, not just topics',
    prompt: `You are a senior content strategist analyzing YouTube video formats and structures.

Your task is to identify **repeatable content formats** that perform well in the selected videos, then suggest new topics using those same formats.

INPUT: For each selected video, you are given:
- Title
- Thumbnail screenshot
- Transcript

WEIGHTED ANALYSIS:
- Transcript (40%): Study narrative structures and content flow — e.g., comparison/contrast, step-by-step guide, myth-busting, checklist format, problem→solution, story arc, numbered lists, before/after.
- Title (35%): Extract title structures — e.g., "X vs Y", "How to X", "X things about Y", "Why X doesn't work", "The truth about X", "X mistakes to avoid".
- Thumbnail (25%): Observe visual structure cues — comparison layouts, numbered lists, question marks, before/after splits, text overlays.

YOUR JOB:
1. Identify successful **format patterns** (not topics) from the selected videos
2. Propose **new topics** that use these proven formats
3. Ensure new topics are related to the theme of the selected videos but offer fresh angles

CRITICAL: Base your analysis ONLY on the selected videos. Identify formats that worked in THESE videos, and suggest related new topics using those formats.

CONSTRAINTS:
- Focus on topic suggestions using successful formats
- Avoid topics already covered in the selected videos
- Stay relevant to the theme/subject of the selected videos

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Successful format identified and why this new topic fits"}]`
  },
  { 
    id: 'viral_potential', 
    name: 'Viral Potential', 
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    metadata: { views: 40, comments: 30, title: 20, thumbnail: 10 },
    description: 'Identify topics with shareability, intrigue, or relatability',
    prompt: `You are a senior content strategist analyzing viral YouTube content patterns.

Your job is to identify **new topic ideas with high viral potential** based on patterns in the selected high-performing videos.

INPUT: Each selected video contains:
- View count
- Top comments (with like counts)
- Title
- Thumbnail screenshot

WEIGHTED ANALYSIS:
- Views (40%): Prioritize videos with unusually high view counts relative to others, suggesting topics with broad appeal or curiosity factor.
- Comments (30%): Look for high-engagement comments expressing strong reactions, curiosity, sharing behavior, or "everyone needs to see this" sentiment.
- Title (20%): Identify curiosity-triggering title patterns — e.g., "versus," "truth about," "no one tells you," "what happens when," surprising facts or revelations.
- Thumbnail (10%): Note thumbnails with emotional contrast, dramatic visuals, or compelling text that stands out.

YOUR JOB:
1. Identify what made certain videos in the selection perform exceptionally well
2. Extract viral triggers — curiosity, controversy, relatability, surprising information, emotional resonance
3. Propose **new related topics** with similar viral potential

CRITICAL: Analyze ONLY the selected videos. Base recommendations on actual performance patterns observed in this specific video set.

CONSTRAINTS:
- Suggest new topics only (not covered in selected videos)
- Avoid sensationalism or misleading angles
- Focus on topic ideas with genuine value and appeal

Return ONLY a JSON array of objects with this format:
[{"topic": "Topic title", "reason": "Viral trigger observed and why this topic has similar potential"}]`
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

