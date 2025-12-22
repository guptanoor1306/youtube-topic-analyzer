import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Loader2,
  FileText,
  Image,
  MessageSquare,
  Eye,
  PlaySquare,
  Search,
  X,
  Sparkles,
  Send,
  CheckCircle2,
  Edit2,
  Save
} from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const TopicIdentification = () => {
  const navigate = useNavigate()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1: Analysis Type
  const [analysisType, setAnalysisType] = useState(null) // 'zero1', 'niche', 'outside'
  
  // Step 2: Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customTemplates, setCustomTemplates] = useState([])
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDesc, setNewTemplateDesc] = useState('')
  
  // Step 3: Channel Selection (for niche/outside)
  const [selectedChannels, setSelectedChannels] = useState([])
  const [channelSearchQuery, setChannelSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [availableFiles, setAvailableFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  
  // Step 4: Metadata Selection with Weights
  const [selectedMetadata, setSelectedMetadata] = useState([])
  const [metadataWeights, setMetadataWeights] = useState({})
  
  // Step 5: Analysis
  const [customPrompt, setCustomPrompt] = useState('')
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Analysis Templates by Type
  const analysisTemplates = {
    zero1: [
      {
        id: 'trending',
        name: '🔥 Most Trending',
        description: 'Identify trending topics based on views and engagement',
        metadata: ['comments', 'views', 'title', 'thumbnail'],
        defaultWeights: { comments: 30, views: 40, title: 20, thumbnail: 10 },
        prompt: `Analyze Zero1's data to identify the MOST TRENDING topics.

Focus on metrics that indicate trending content:
- **High view counts** (40% weight) - Videos with exceptional viewership
- **Comment volume & engagement** (30% weight) - High interaction rates
- **Title patterns** (20% weight) - What titles attract attention
- **Thumbnail effectiveness** (10% weight) - Visual appeal patterns

Identify 5 trending topics that could replicate this success.

For each topic provide:
**✅ Topic**: [Name]
**• Why It's Trending**: [View count patterns, engagement rates]
**• Evidence**: [Specific videos, comment themes, view metrics]
**• Replication Strategy**: [How to create similar content]`
      },
      {
        id: 'engaging',
        name: '💬 Most Engaging',
        description: 'Topics that drive deep audience engagement',
        metadata: ['comments', 'transcript', 'title'],
        defaultWeights: { comments: 50, transcript: 35, title: 15 },
        prompt: `Analyze Zero1's data to find the MOST ENGAGING topics.

Focus on deep audience interaction:
- **Comment depth & quality** (50% weight) - Meaningful discussions, questions, personal stories
- **Transcript content themes** (35% weight) - Topics that resonate emotionally/intellectually
- **Title hooks** (15% weight) - What promises drive engagement

Identify 5 highly engaging topics.

For each topic provide:
**✅ Topic**: [Name]
**• Engagement Indicators**: [Comment quality, discussion depth, avg comments per view]
**• Evidence**: [Quote high-engagement comments, transcript excerpts]
**• Engagement Strategy**: [How to maximize interaction]`
      },
      {
        id: 'antithesis',
        name: '⚡ Anti-thesis',
        description: 'Challenge common beliefs based on audience misconceptions',
        metadata: ['comments', 'title'],
        defaultWeights: { comments: 90, title: 10 },
        prompt: `Analyze Zero1's data to identify ANTI-THESIS opportunities.

Focus almost entirely on audience misconceptions:
- **Comment misconceptions** (90% weight) - Wrong beliefs, myths, confusion in comments
- **Existing titles** (10% weight) - What Zero1 has already debunked

Identify 5 anti-thesis topics that challenge common beliefs.

For each topic provide:
**✅ Topic**: [The misconception to challenge]
**• The Myth**: [What people wrongly believe]
**• Evidence in Comments**: [Quote comments showing this belief]
**• The Reality**: [What Zero1 should reveal]
**• Impact**: [Why debunking this matters]`
      },
      {
        id: 'painpoints',
        name: '😟 Pain Points',
        description: 'Audience struggles and problems needing solutions',
        metadata: ['comments', 'transcript'],
        defaultWeights: { comments: 60, transcript: 40 },
        prompt: `Analyze Zero1's data to identify audience PAIN POINTS.

Focus on problems and struggles:
- **Comment frustrations** (60% weight) - Problems, complaints, struggles mentioned
- **Transcript problem-solving** (40% weight) - Issues Zero1 has addressed

Identify 5 pain point topics.

For each topic provide:
**✅ Topic**: [The pain point]
**• The Problem**: [What the audience struggles with]
**• Evidence**: [Quote comments expressing this pain, relevant transcript sections]
**• Current Gap**: [What's missing in existing content]
**• Solution Approach**: [How Zero1 can address this]`
      },
      {
        id: 'formats',
        name: '🎬 Format Recyclers',
        description: 'Successful content formats to replicate',
        metadata: ['title', 'thumbnail', 'transcript'],
        defaultWeights: { title: 35, thumbnail: 25, transcript: 40 },
        prompt: `Analyze Zero1's data to identify successful CONTENT FORMATS.

Focus on replicable structures:
- **Transcript structures** (40% weight) - How content is organized, storytelling patterns
- **Title formulas** (35% weight) - Successful title patterns
- **Thumbnail styles** (25% weight) - Visual patterns that work

Identify 5 format templates to reuse.

For each format provide:
**✅ Format**: [Name]
**• Structure**: [How the content is organized]
**• Title Pattern**: [The formula used]
**• Visual Style**: [Thumbnail approach]
**• Best Use Cases**: [What topics work with this format]
**• Examples**: [Successful videos using this format]`
      },
      {
        id: 'gaps',
        name: '🔍 Content Gaps',
        description: 'Missing topics audience wants',
        metadata: ['comments', 'title', 'transcript'],
        defaultWeights: { comments: 50, title: 30, transcript: 20 },
        prompt: `Analyze Zero1's data to identify CONTENT GAPS.

Focus on what's missing:
- **Unanswered questions in comments** (50% weight) - What audience asks that isn't covered
- **Title coverage** (30% weight) - What topics Zero1 hasn't made videos about
- **Transcript themes** (20% weight) - Topics mentioned but not deeply explored

Identify 5 content gap opportunities.

For each gap provide:
**✅ Topic**: [The missing content]
**• The Gap**: [What's not being covered]
**• Evidence**: [Comment requests, related topics in transcripts]
**• Audience Need**: [Why they want this]
**• Content Opportunity**: [How to fill this gap]`
      },
      {
        id: 'viral',
        name: '🚀 Viral Potential',
        description: 'Topics with high shareability and reach',
        metadata: ['views', 'comments', 'title', 'thumbnail'],
        defaultWeights: { views: 40, comments: 30, title: 20, thumbnail: 10 },
        prompt: `Analyze Zero1's data to identify topics with VIRAL POTENTIAL.

Focus on shareability indicators:
- **View velocity** (40% weight) - Videos that grew fast
- **Comment sharing intent** (30% weight) - "Sharing this", "Everyone should watch"
- **Title virality** (20% weight) - Provocative, shareable titles
- **Thumbnail impact** (10% weight) - Attention-grabbing visuals

Identify 5 viral-potential topics.

For each topic provide:
**✅ Topic**: [Name]
**• Viral Elements**: [What makes it shareable]
**• Evidence**: [View patterns, sharing comments, successful examples]
**• Target Audience**: [Who would share this]
**• Amplification Strategy**: [How to maximize viral spread]`
      },
      {
        id: 'evergreen',
        name: '♾️ Evergreen Content',
        description: 'Timeless topics with sustained interest',
        metadata: ['title', 'transcript', 'views'],
        defaultWeights: { transcript: 50, views: 30, title: 20 },
        prompt: `Analyze Zero1's data to identify EVERGREEN CONTENT opportunities.

Focus on timeless value:
- **Transcript themes** (50% weight) - Universal, non-time-sensitive topics
- **Sustained views** (30% weight) - Videos with consistent watch time over time
- **Title timelessness** (20% weight) - Topics that don't age

Identify 5 evergreen topics.

For each topic provide:
**✅ Topic**: [Name]
**• Timeless Appeal**: [Why this won't age]
**• Evidence**: [Sustained performance, transcript themes]
**• Long-term Value**: [Why this stays relevant]
**• SEO Potential**: [Searchability and discoverability]`
      }
    ],
    niche: [
      {
        id: 'comparison',
        name: '⚖️ Competitive Comparison',
        description: 'Compare Zero1 vs niche channels',
        metadata: ['title', 'views', 'comments'],
        defaultWeights: { title: 40, views: 35, comments: 25 },
        prompt: `Compare Zero1 with niche finance channels to identify differentiation opportunities.

Focus on competitive insights:
- **Title approach differences** (40% weight) - How do titles differ?
- **View performance** (35% weight) - What topics perform better for competitors?
- **Comment sentiment** (25% weight) - What do audiences want that Zero1 isn't providing?

Identify 5 topics where Zero1 can differentiate or outperform.

For each topic provide:
**✅ Topic**: [Name]
**• Competitive Insight**: [What competitors are doing]
**• Zero1 Opportunity**: [How Zero1 can do it better/differently]
**• Evidence**: [Performance data, comment analysis]
**• Strategy**: [Execution approach]`
      },
      {
        id: 'niche_gaps',
        name: '🎯 Niche Gaps',
        description: 'Topics competitors miss',
        metadata: ['comments', 'title'],
        defaultWeights: { comments: 70, title: 30 },
        prompt: `Identify gaps in finance niche content that Zero1 can fill.

Focus on unmet needs:
- **Comment requests across niche** (70% weight) - What audiences ask for but don't get
- **Title coverage gaps** (30% weight) - Topics no one is covering well

Identify 5 gap opportunities.

For each gap provide:
**✅ Topic**: [The missing content]
**• Why It's a Gap**: [Why competitors aren't covering it]
**• Audience Evidence**: [Comments showing demand]
**• Zero1 Advantage**: [Why Zero1 is positioned to fill this]`
      },
      {
        id: 'format_steal',
        name: '🎨 Format Adaptation',
        description: 'Adapt successful niche formats',
        metadata: ['title', 'thumbnail', 'views'],
        defaultWeights: { title: 40, thumbnail: 30, views: 30 },
        prompt: `Identify successful formats from niche channels that Zero1 can adapt.

Focus on proven patterns:
- **Title structures** (40% weight) - Formulas that work
- **Thumbnail styles** (30% weight) - Visual approaches
- **View performance** (30% weight) - What gets traction

Identify 5 adaptable formats.

For each format provide:
**✅ Format**: [Name]
**• Source**: [Which channel uses it successfully]
**• Why It Works**: [Performance evidence]
**• Zero1 Adaptation**: [How to apply to Zero1's style]
**• Example Topics**: [What topics would work with this format]`
      }
    ],
    outside: [
      {
        id: 'crossover',
        name: '🔄 Cross-Industry Inspiration',
        description: 'Apply formats from outside finance',
        metadata: ['title', 'transcript', 'views'],
        defaultWeights: { title: 35, transcript: 35, views: 30 },
        prompt: `Find successful content patterns from outside finance that Zero1 can adapt.

Focus on transferable formats:
- **Title innovation** (35% weight) - Fresh title approaches
- **Content structures** (35% weight) - Storytelling patterns
- **Performance metrics** (30% weight) - What works

Identify 5 cross-industry inspirations.

For each inspiration provide:
**✅ Format/Topic**: [Name]
**• Source Industry**: [Where it comes from]
**• Why It Transfers**: [How it applies to finance]
**• Adaptation Strategy**: [How to make it work for Zero1]
**• Potential Topics**: [Finance topics that could use this approach]`
      },
      {
        id: 'unexpected',
        name: '💡 Unexpected Angles',
        description: 'Non-obvious topics with finance angles',
        metadata: ['title', 'comments'],
        defaultWeights: { title: 60, comments: 40 },
        prompt: `Identify unexpected topics from outside finance that could have financial angles.

Focus on creative connections:
- **Title creativity** (60% weight) - Surprising topic choices
- **Comment curiosity** (40% weight) - What sparks interest

Identify 5 unexpected angle opportunities.

For each angle provide:
**✅ Topic**: [The unexpected topic]
**• The Finance Connection**: [How it relates to money/finance]
**• Why It's Interesting**: [The hook]
**• Zero1 Treatment**: [How Zero1 would approach it]
**• Audience Appeal**: [Why Zero1's audience would care]`
      }
    ]
  }

  // Metadata options
  const metadataOptions = [
    { id: 'title', label: 'Title', icon: FileText, description: 'Video titles', color: 'blue' },
    { id: 'thumbnail', label: 'Thumbnail', icon: Image, description: 'Thumbnail data', color: 'purple' },
    { id: 'transcript', label: 'Transcript', icon: PlaySquare, description: 'Full video transcripts', color: 'green', disabledFor: ['niche', 'outside'] },
    { id: 'comments', label: 'Comments', icon: MessageSquare, description: 'User comments', color: 'pink' },
    { id: 'views', label: 'Views', icon: Eye, description: 'View counts & engagement', color: 'orange' },
  ]

  useEffect(() => {
    if (currentStep === 3 && analysisType !== 'zero1') {
      fetchAvailableFiles()
    }
  }, [currentStep, analysisType])

  // Load custom templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customTemplates')
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load custom templates:', e)
      }
    }
  }, [])

  const fetchAvailableFiles = async () => {
    try {
      setLoadingFiles(true)
      const response = await axios.get(`${API_BASE_URL}/api/reverse-engineering/files`)
      if (response.data.success) {
        setAvailableFiles(response.data.files)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleAnalysisTypeSelect = (type) => {
    setAnalysisType(type)
    setCurrentStep(2) // Go to template selection
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    
    if (template.id === 'custom') {
      // Custom template - start fresh
      setSelectedMetadata([])
      setMetadataWeights({})
      setCustomPrompt('')
    } else {
      // Pre-built template
      setSelectedMetadata(template.metadata)
      setMetadataWeights(template.defaultWeights)
      setCustomPrompt(template.prompt)
    }
    
    // Move to appropriate next step
    if (analysisType === 'zero1') {
      setCurrentStep(4) // Skip channel selection
    } else {
      setCurrentStep(3) // Go to channel selection
    }
  }

  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name')
      return
    }

    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: `⭐ ${newTemplateName}`,
      description: newTemplateDesc || 'Custom template',
      metadata: selectedMetadata,
      defaultWeights: metadataWeights,
      prompt: customPrompt,
      analysisType: analysisType,
      isCustom: true,
      createdAt: new Date().toISOString()
    }

    const updated = [...customTemplates, newTemplate]
    setCustomTemplates(updated)
    localStorage.setItem('customTemplates', JSON.stringify(updated))
    
    setShowSaveTemplate(false)
    setNewTemplateName('')
    setNewTemplateDesc('')
    
    alert(`✅ Template "${newTemplateName}" saved successfully!`)
  }

  const handleDeleteCustomTemplate = (templateId) => {
    if (confirm('Are you sure you want to delete this custom template?')) {
      const updated = customTemplates.filter(t => t.id !== templateId)
      setCustomTemplates(updated)
      localStorage.setItem('customTemplates', JSON.stringify(updated))
    }
  }

  const handleChannelSearch = async () => {
    if (!channelSearchQuery.trim()) return
    
    setSearching(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/search/channel`, {
        query: channelSearchQuery,
        max_results: 5
      })
      
      if (response.data.channels) {
        setSearchResults(response.data.channels)
      }
    } catch (error) {
      console.error('Error searching channels:', error)
      alert('Failed to search channels')
    } finally {
      setSearching(false)
    }
  }

  const handleAddChannel = (channel) => {
    if (selectedChannels.length >= 5) {
      alert('Maximum 5 channels allowed')
      return
    }
    
    if (!selectedChannels.find(c => c.channel_id === channel.channel_id)) {
      setSelectedChannels([...selectedChannels, channel])
      setSearchResults([])
      setChannelSearchQuery('')
    }
  }

  const handleAddFromFiles = (file) => {
    if (selectedChannels.length >= 5) {
      alert('Maximum 5 channels allowed')
      return
    }
    
    if (!selectedChannels.find(c => c.filename === file.filename)) {
      setSelectedChannels([...selectedChannels, {
        channel_name: file.channel_name,
        filename: file.filename,
        videos_count: file.videos_count,
        fromFile: true
      }])
    }
  }

  const handleRemoveChannel = (channel) => {
    setSelectedChannels(selectedChannels.filter(c => 
      channel.fromFile ? c.filename !== channel.filename : c.channel_id !== channel.channel_id
    ))
  }

  const handleMetadataToggle = (metadataId) => {
    if (selectedMetadata.includes(metadataId)) {
      const newMetadata = selectedMetadata.filter(m => m !== metadataId)
      setSelectedMetadata(newMetadata)
      
      // Remove weight
      const newWeights = { ...metadataWeights }
      delete newWeights[metadataId]
      setMetadataWeights(newWeights)
    } else {
      setSelectedMetadata([...selectedMetadata, metadataId])
      
      // Add default weight
      const remainingWeight = 100 - Object.values(metadataWeights).reduce((a, b) => a + b, 0)
      const defaultWeight = Math.floor(remainingWeight / (selectedMetadata.length + 1))
      setMetadataWeights({ ...metadataWeights, [metadataId]: defaultWeight })
    }
  }

  const handleWeightChange = (metadataId, newWeight) => {
    setMetadataWeights({ ...metadataWeights, [metadataId]: parseInt(newWeight) })
  }

  const normalizeWeights = () => {
    const total = Object.values(metadataWeights).reduce((a, b) => a + b, 0)
    if (total === 100) return metadataWeights
    
    // Normalize to 100%
    const normalized = {}
    Object.keys(metadataWeights).forEach(key => {
      normalized[key] = Math.round((metadataWeights[key] / total) * 100)
    })
    return normalized
  }

  const handleAnalyze = async () => {
    if (!customPrompt.trim()) {
      alert('Please enter an analysis prompt')
      return
    }

    // Add user message to chat
    const userMessage = { role: 'user', content: customPrompt }
    setChatMessages(prev => [...prev, userMessage])

    setAnalyzing(true)
    try {
      const normalizedWeights = normalizeWeights()
      
      // Build prompt with weight information
      let weightInfo = '\n\n**Metadata Weight Distribution:**\n'
      Object.keys(normalizedWeights).forEach(key => {
        weightInfo += `- ${key}: ${normalizedWeights[key]}%\n`
      })
      
      const finalPrompt = customPrompt + weightInfo + '\n\nPlease focus your analysis according to these weights.'
      
      let requestData = {
        analysis_type: analysisType,
        metadata_fields: selectedMetadata,
        custom_prompt: finalPrompt
      }

      if (analysisType === 'zero1') {
        requestData.filenames = ['Zero1.json']
      } else {
        requestData.filenames = selectedChannels
          .filter(c => c.fromFile)
          .map(c => c.filename)
        
        requestData.channel_ids = selectedChannels
          .filter(c => !c.fromFile)
          .map(c => c.channel_id)
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/topics/analyze`,
        requestData
      )

      if (response.data.success) {
        setAnalysisResult(response.data.analysis)
        
        // Format analysis result as a nice message
        const result = response.data.analysis
        let resultMessage = '📊 **Analysis Results**\n\n'
        
        if (result.analysis_summary) {
          resultMessage += `**Summary:**\n${result.analysis_summary}\n\n`
        }
        
        if (result.key_findings && result.key_findings.length > 0) {
          resultMessage += '**Key Findings:**\n'
          result.key_findings.forEach((finding, idx) => {
            const text = typeof finding === 'object' ? JSON.stringify(finding) : finding
            resultMessage += `${idx + 1}. ${text}\n`
          })
          resultMessage += '\n'
        }
        
        if (result.patterns && result.patterns.length > 0) {
          resultMessage += '**Patterns:**\n'
          result.patterns.forEach((pattern, idx) => {
            const text = typeof pattern === 'object' ? JSON.stringify(pattern) : pattern
            resultMessage += `${idx + 1}. ${text}\n`
          })
          resultMessage += '\n'
        }
        
        if (result.insights && result.insights.length > 0) {
          resultMessage += '**Insights:**\n'
          result.insights.forEach((insight, idx) => {
            const text = typeof insight === 'object' ? JSON.stringify(insight) : insight
            resultMessage += `${idx + 1}. ${text}\n`
          })
          resultMessage += '\n'
        }
        
        if (result.recommendations && result.recommendations.length > 0) {
          resultMessage += '**Recommendations:**\n'
          result.recommendations.forEach((rec, idx) => {
            const text = typeof rec === 'object' ? JSON.stringify(rec) : rec
            resultMessage += `${idx + 1}. ${text}\n`
          })
        }
        
        // Add assistant message to chat
        const assistantMessage = { role: 'assistant', content: resultMessage }
        setChatMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error analyzing:', error)
      const errorMessage = { 
        role: 'assistant', 
        content: `❌ Error: ${error.response?.data?.detail || 'Failed to analyze. Please try again.'}` 
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      let requestData = {
        analysis_type: analysisType,
        metadata_fields: selectedMetadata,
        conversation_history: chatMessages,
        new_message: chatInput
      }

      if (analysisType === 'zero1') {
        requestData.filenames = ['Zero1.json']
      } else {
        requestData.filenames = selectedChannels
          .filter(c => c.fromFile)
          .map(c => c.filename)
        requestData.channel_ids = selectedChannels
          .filter(c => !c.fromFile)
          .map(c => c.channel_id)
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/topics/chat`,
        requestData
      )

      if (response.data.success) {
        const assistantMessage = { role: 'assistant', content: response.data.response }
        setChatMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error in chat:', error)
      alert('Failed to get chat response')
    } finally {
      setChatLoading(false)
    }
  }

  const canProceedToStep4 = () => {
    if (analysisType === 'zero1') return true
    return selectedChannels.length > 0
  }

  const canProceedToStep5 = () => {
    return selectedMetadata.length > 0
  }

  const getStepConfig = () => {
    const steps = [
      { num: 1, label: 'Analysis Type', active: true },
      { num: 2, label: 'Choose Template', active: true },
    ]
    
    if (analysisType !== 'zero1') {
      steps.push({ num: 3, label: 'Select Channels', active: true })
    } else {
      steps.push({ num: 3, label: 'Skipped', active: false })
    }
    
    steps.push(
      { num: 4, label: 'Metadata & Weights', active: true },
      { num: 5, label: 'Analyze & Chat', active: true }
    )
    
    return steps
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text mb-2">
            Topic Identification
          </h1>
          <p className="text-gray-400">Follow the steps to analyze and discover content topics</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl">
            {getStepConfig().map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    currentStep > step.num
                      ? 'bg-green-500 text-white'
                      : currentStep === step.num
                      ? 'bg-blue-500 text-white'
                      : !step.active
                      ? 'bg-gray-700 text-gray-500'
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
                  </div>
                  <p className={`text-xs mt-2 ${
                    currentStep >= step.num ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {idx < getStepConfig().length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.num + 1 ? 'bg-green-500' : 'bg-gray-800'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Analysis Type Selection */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold mb-2">Choose Analysis Type</h2>
              <p className="text-gray-400 mb-8">Select what data you want to analyze</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => handleAnalysisTypeSelect('zero1')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                    analysisType === 'zero1'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-blue-400'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Zero1 Only</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Analyze Zero1 by Zerodha content to identify successful patterns
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-400">
                    <span>8 specialized templates</span>
                  </div>
                </div>

                <div
                  onClick={() => handleAnalysisTypeSelect('niche')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                    analysisType === 'niche'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-700 hover:border-green-400'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Zero1 + Niche</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Compare Zero1 with finance niche channels
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <span>Competitive analysis templates</span>
                  </div>
                </div>

                <div
                  onClick={() => handleAnalysisTypeSelect('outside')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                    analysisType === 'outside'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 hover:border-purple-400'
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Zero1 + Outside Niche</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Explore patterns from outside finance
                  </p>
                  <div className="flex items-center gap-2 text-xs text-purple-400">
                    <span>Cross-industry inspiration</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Template Selection */}
        {currentStep === 2 && analysisType && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold mb-2">Choose Analysis Template</h2>
              <p className="text-gray-400 mb-6">
                Each template has pre-configured metadata and default weights optimized for specific analysis types
              </p>

              {/* Custom Analysis Option */}
              <div className="mb-6">
                <div
                  onClick={() => handleTemplateSelect({ id: 'custom', name: '✨ Custom Analysis', description: 'Manually configure metadata, weights, and prompt' })}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-102 bg-gradient-to-br from-purple-900/30 to-pink-900/30 ${
                    selectedTemplate?.id === 'custom'
                      ? 'border-purple-500'
                      : 'border-purple-500/30 hover:border-purple-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-xl">✨ Custom Analysis</h3>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded">
                          Build Your Own
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Manually select metadata, set custom weights, write your own prompt, and save as a reusable template
                      </p>
                    </div>
                    {selectedTemplate?.id === 'custom' && (
                      <CheckCircle2 className="w-6 h-6 text-purple-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Pre-built Templates */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Pre-built Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisTemplates[analysisType].map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:scale-102 ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg">{template.name}</h3>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Includes:</p>
                        <div className="flex flex-wrap gap-2">
                          {template.metadata.map(m => (
                            <span key={m} className="px-2 py-1 bg-gray-800 text-xs rounded">
                              {m} ({template.defaultWeights[m]}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Saved Templates */}
              {customTemplates.filter(t => t.analysisType === analysisType).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Your Saved Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customTemplates
                      .filter(t => t.analysisType === analysisType)
                      .map((template) => (
                        <div
                          key={template.id}
                          className={`p-6 rounded-xl border-2 cursor-pointer transition-all bg-gradient-to-br from-yellow-900/20 to-orange-900/20 ${
                            selectedTemplate?.id === template.id
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-yellow-500/30 hover:border-yellow-500'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1" onClick={() => handleTemplateSelect(template)}>
                              <h3 className="font-bold text-lg">{template.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedTemplate?.id === template.id && (
                                <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCustomTemplate(template.id)
                                }}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <X className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div onClick={() => handleTemplateSelect(template)}>
                            <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                            
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase">Includes:</p>
                              <div className="flex flex-wrap gap-2">
                                {template.metadata.map(m => (
                                  <span key={m} className="px-2 py-1 bg-gray-800 text-xs rounded">
                                    {m} ({template.defaultWeights[m]}%)
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Channel Selection (for niche/outside only) - KEEPING YOUR EXISTING CODE */}
        {currentStep === 3 && analysisType !== 'zero1' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-8">
              <h2 className="text-2xl font-bold mb-2">Select Channels</h2>
              <p className="text-gray-400 mb-6">
                Add up to 5 {analysisType === 'niche' ? 'finance niche' : 'outside niche'} channels
              </p>

              {/* Selected Channels */}
              {selectedChannels.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Selected Channels ({selectedChannels.length}/5)
                    </h3>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>📁 {selectedChannels.filter(c => c.fromFile).length} from files</span>
                      <span>🔴 {selectedChannels.filter(c => !c.fromFile).length} from YouTube</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedChannels.map((channel, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${channel.fromFile ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="font-semibold text-sm">{channel.channel_name || channel.title}</p>
                            <p className="text-xs text-gray-500">
                              {channel.fromFile ? `${channel.videos_count} videos (from file)` : 'Top 10 videos (YouTube API)'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveChannel(channel)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Channels Section */}
              {selectedChannels.length < 5 && (
                <div className="space-y-6">
                  
                  {/* Option 1: Search YouTube */}
                  <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 border-2 border-red-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Search YouTube (Live API)</h3>
                        <p className="text-xs text-gray-400">Find any channel • Uses top 10 videos</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={channelSearchQuery}
                        onChange={(e) => setChannelSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChannelSearch()}
                        placeholder="Search for any channel... (e.g., Think School, Ali Abdaal)"
                        className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={searching}
                      />
                      <button
                        onClick={handleChannelSearch}
                        disabled={searching || !channelSearchQuery.trim()}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold"
                      >
                        {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-gray-400 font-semibold">Search Results:</p>
                        {searchResults.map((channel, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleAddChannel(channel)}
                            className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-lg border border-red-500/30 cursor-pointer hover:border-red-500 hover:bg-red-500/5 transition-all group"
                          >
                            <div className="flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <p className="font-semibold text-sm">{channel.title}</p>
                              </div>
                              <p className="text-xs text-gray-500 ml-4 mt-1 line-clamp-1">{channel.description?.substring(0, 100)}</p>
                            </div>
                            <button className="px-4 py-1.5 bg-red-600 text-white text-xs rounded font-semibold hover:bg-red-700 group-hover:scale-105 transition-transform">
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Option 2: Available Files */}
                  {availableFiles.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-500/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">Available Data Files</h3>
                          <p className="text-xs text-gray-400">Pre-loaded channels with full data</p>
                        </div>
                      </div>
                      
                      {loadingFiles ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availableFiles
                            .filter(file => file.filename !== 'Zero1.json')
                            .map((file, idx) => {
                              const isSelected = selectedChannels.find(c => c.filename === file.filename)
                              return (
                                <div
                                  key={idx}
                                  onClick={() => !isSelected && handleAddFromFiles(file)}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? 'border-green-500 bg-green-500/10 cursor-not-allowed'
                                      : 'border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <p className="font-semibold text-sm">{file.channel_name}</p>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
                                  </div>
                                  <p className="text-xs text-gray-500 ml-4">{file.videos_count} videos • {file.fetch_date}</p>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={!canProceedToStep4()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next: Adjust Metadata
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Metadata Selection with Weights */}
        {currentStep === 4 && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Adjust Metadata & Weights</h2>
                  <p className="text-gray-400">
                    Template: <span className="text-blue-400 font-semibold">{selectedTemplate?.name}</span> • You can add/remove metadata and adjust weights
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total Weight</p>
                  <p className={`text-2xl font-bold ${Object.values(metadataWeights).reduce((a, b) => a + b, 0) === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {Object.values(metadataWeights).reduce((a, b) => a + b, 0)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {metadataOptions.map((option) => {
                  const isDisabled = option.disabledFor?.includes(analysisType)
                  const isSelected = selectedMetadata.includes(option.id)
                  const Icon = option.icon
                  
                  return (
                    <div
                      key={option.id}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed border-gray-800'
                          : isSelected
                          ? `border-${option.color}-500 bg-${option.color}-500/10`
                          : 'border-gray-700 hover:border-gray-600 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-${option.color}-500/20 rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 text-${option.color}-400`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{option.label}</h3>
                            <p className="text-xs text-gray-400">{option.description}</p>
                          </div>
                        </div>
                        {!isDisabled && (
                          <button
                            onClick={() => handleMetadataToggle(option.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isSelected ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-green-500/20 hover:bg-green-500/30'
                            }`}
                          >
                            {isSelected ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-green-400" />}
                          </button>
                        )}
                      </div>
                      
                      {isSelected && !isDisabled && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-300">Weight: {metadataWeights[option.id]}%</label>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={metadataWeights[option.id] || 0}
                            onChange={(e) => handleWeightChange(option.id, e.target.value)}
                            className="w-full accent-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {Object.values(metadataWeights).reduce((a, b) => a + b, 0) !== 100 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-400">
                    ⚠️ Weights don't add up to 100%. They will be automatically normalized when you run the analysis.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(analysisType === 'zero1' ? 2 : 3)}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  {selectedTemplate?.id === 'custom' && canProceedToStep5() && (
                    <button
                      onClick={() => setShowSaveTemplate(true)}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save as Template
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentStep(5)}
                    disabled={!canProceedToStep5()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next: Run Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Save Template Modal */}
            {showSaveTemplate && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#1a1a1a] border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">Save as Template</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="e.g., My Custom Analysis"
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={newTemplateDesc}
                        onChange={(e) => setNewTemplateDesc(e.target.value)}
                        placeholder="Brief description of what this template does..."
                        rows={3}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-2">Will save:</p>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• {selectedMetadata.length} metadata fields</li>
                        <li>• Custom weight distribution</li>
                        <li>• Your analysis prompt</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowSaveTemplate(false)
                        setNewTemplateName('')
                        setNewTemplateDesc('')
                      }}
                      className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAsTemplate}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Analysis & Chat - KEEPING YOUR EXISTING CODE */}
        {currentStep === 5 && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              
              {/* Configuration Summary */}
              <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4 flex items-center justify-between">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Template:</span>
                    <span className="text-white font-semibold">{selectedTemplate?.name}</span>
                  </div>
                  {analysisType !== 'zero1' && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Channels:</span>
                      <span className="text-white font-semibold">{selectedChannels.length}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Metadata:</span>
                    <span className="text-white font-semibold">{selectedMetadata.length} fields</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← Back
                </button>
              </div>

              {/* Chat Interface */}
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Analysis & Chat</h2>
              </div>

              {/* Chat Messages */}
              <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4 h-[600px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="w-12 h-12 text-yellow-400 mb-4" />
                    <p className="text-gray-300 font-semibold mb-2">Ready to analyze!</p>
                    <p className="text-sm text-gray-500 max-w-md">
                      Your prompt is pre-loaded from the template. You can edit it below before running the analysis.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-4 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {(analyzing || chatLoading) && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prompt Editor */}
              <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300">Analysis Prompt</h3>
                  <button
                    onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                    className="flex items-center gap-2 px-3 py-1 text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors"
                  >
                    {isEditingPrompt ? (
                      <>
                        <Save className="w-3 h-3" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3 h-3" />
                        Edit Prompt
                      </>
                    )}
                  </button>
                </div>
                
                {isEditingPrompt ? (
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-[#000] border border-purple-500/30 rounded-lg text-white text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <div className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto bg-[#000] p-3 rounded border border-gray-800">
                    {customPrompt}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || chatLoading || !customPrompt.trim()}
                    className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Run Analysis
                      </>
                    )}
                  </button>
                </div>
                
                {/* Chat Input for follow-ups */}
                {chatMessages.length > 0 && (
                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                      placeholder="Ask a follow-up question..."
                      className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={chatLoading || analyzing}
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={chatLoading || analyzing || !chatInput.trim()}
                      className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopicIdentification

