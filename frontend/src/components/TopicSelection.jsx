import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, Edit3 } from 'lucide-react'

const TopicSelection = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [availableTopics, setAvailableTopics] = useState([])

  useEffect(() => {
    // Extract topics from results
    if (appState.results) {
      const topics = []
      
      // Extract from series suggestions
      if (appState.results.series_suggestions) {
        appState.results.series_suggestions.forEach(series => {
          topics.push({
            title: series.title,
            description: series.description,
            source: 'series'
          })
        })
      }
      
      // Extract from additional topics
      if (appState.results.additional_topics) {
        appState.results.additional_topics.forEach(topic => {
          topics.push({
            title: topic,
            description: '',
            source: 'additional'
          })
        })
      }
      
      // Extract from adaptations
      if (appState.results.adaptations) {
        appState.results.adaptations.forEach(adaptation => {
          topics.push({
            title: adaptation.adapted_title,
            description: adaptation.reframing,
            source: 'adaptation'
          })
        })
      }
      
      setAvailableTopics(topics)
    }
  }, [appState.results])

  const handleNext = () => {
    const topic = isCustomMode ? customTopic : selectedTopic
    
    if (!topic.trim()) {
      alert('Please select or enter a topic')
      return
    }
    
    // Save topic to app state and navigate to title generation
    setAppState({
      ...appState,
      selectedTopic: topic
    })
    navigate('/title-generation')
  }

  if (!appState.results) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-400">No results available. Please complete the topic identification first.</p>
        <button
          onClick={() => navigate('/results')}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Back to Results
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/results')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-3xl font-bold text-white">Select Your Topic</h2>
          </div>
          <p className="text-gray-400">
            Choose a topic from your results or enter a custom one to generate titles and thumbnails
          </p>
        </div>

        {/* Toggle between select and custom */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setIsCustomMode(false)}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              !isCustomMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Select from Results
          </button>
          <button
            onClick={() => setIsCustomMode(true)}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              isCustomMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" />
              Enter Custom Topic
            </div>
          </button>
        </div>

        {/* Content area */}
        {!isCustomMode ? (
          <div className="space-y-3 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Available Topics:</h3>
            {availableTopics.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No topics found in results</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {availableTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedTopic(topic.title)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTopic === topic.title
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 bg-[#0a0a0a]/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{topic.title}</h4>
                        {topic.description && (
                          <p className="text-sm text-gray-400">{topic.description}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        topic.source === 'series' ? 'bg-purple-900/50 text-purple-300' :
                        topic.source === 'adaptation' ? 'bg-green-900/50 text-green-300' :
                        'bg-blue-900/50 text-blue-300'
                      }`}>
                        {topic.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8">
            <label className="block text-white font-medium mb-3">
              Enter your custom topic:
            </label>
            <textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="E.g., How to build a passive income stream with dividend investing"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 min-h-[120px]"
              rows={4}
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter a detailed topic description for better title and thumbnail suggestions
            </p>
          </div>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={isCustomMode ? !customTopic.trim() : !selectedTopic}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          Continue to Title Generation
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default TopicSelection

