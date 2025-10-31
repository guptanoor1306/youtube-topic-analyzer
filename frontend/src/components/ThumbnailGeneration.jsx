import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Image as ImageIcon, Sparkles, Loader2, Download, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const ThumbnailGeneration = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [selectedThumbnails, setSelectedThumbnails] = useState([])
  const [thumbnailPrompt, setThumbnailPrompt] = useState('')
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [revisedPrompt, setRevisedPrompt] = useState('')

  if (!appState.selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-400">No topic selected. Please select a topic first.</p>
        <button
          onClick={() => navigate('/topic-selection')}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Go to Topic Selection
        </button>
      </div>
    )
  }

  const availableThumbnails = appState.titleSuggestions || []

  const toggleThumbnailSelection = (thumbnail) => {
    if (selectedThumbnails.includes(thumbnail)) {
      setSelectedThumbnails(selectedThumbnails.filter(t => t !== thumbnail))
    } else {
      if (selectedThumbnails.length < 5) {
        setSelectedThumbnails([...selectedThumbnails, thumbnail])
      } else {
        alert('You can select up to 5 thumbnails')
      }
    }
  }

  const handleGenerateThumbnail = async () => {
    if (selectedThumbnails.length === 0) {
      alert('Please select at least one thumbnail for reference')
      return
    }

    if (!thumbnailPrompt.trim()) {
      alert('Please enter a prompt describing your desired thumbnail')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-thumbnail`, {
        topic: appState.selectedTopic,
        selected_thumbnail_urls: selectedThumbnails,
        prompt: thumbnailPrompt
      })

      if (response.data.success) {
        setGeneratedThumbnail(response.data.thumbnail_url)
        setRevisedPrompt(response.data.revised_prompt || '')
      }
    } catch (err) {
      console.error('Error generating thumbnail:', err)
      alert(`Failed to generate thumbnail: ${err.response?.data?.detail || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadThumbnail = () => {
    if (generatedThumbnail) {
      window.open(generatedThumbnail, '_blank')
    }
  }

  const handleReset = () => {
    setGeneratedThumbnail(null)
    setRevisedPrompt('')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/title-generation')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Title Generation
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-800 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ImageIcon className="w-6 h-6 text-purple-500" />
            <h2 className="text-3xl font-bold text-white">Thumbnail Generation</h2>
          </div>
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">Topic:</p>
            <p className="text-white font-medium mb-3">{appState.selectedTopic}</p>
            {appState.selectedTitle && (
              <>
                <p className="text-sm text-gray-400 mb-1">Selected Title:</p>
                <p className="text-white font-medium">{appState.selectedTitle}</p>
              </>
            )}
          </div>
          <p className="text-gray-400">
            Select up to 5 reference thumbnails and provide a prompt to generate a custom thumbnail using AI
          </p>
        </div>

        {!generatedThumbnail ? (
          <>
            {/* Thumbnail Selection */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Select Reference Thumbnails ({selectedThumbnails.length}/5)
                </h3>
              </div>

              {availableThumbnails.length === 0 ? (
                <div className="text-center py-12 bg-[#0a0a0a]/50 rounded-lg border border-gray-800">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No thumbnails available</p>
                  <button
                    onClick={() => navigate('/title-generation')}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Go back and fetch title suggestions first
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2">
                  {availableThumbnails.slice(0, 20).map((video, idx) => {
                    const isSelected = selectedThumbnails.includes(video.thumbnail)
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleThumbnailSelection(video.thumbnail)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-3 transition-all ${
                          isSelected
                            ? 'border-purple-500 ring-2 ring-purple-500 scale-95'
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-auto object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-sm text-center px-2 line-clamp-2">
                            {video.title}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Selected Thumbnails Preview */}
            {selectedThumbnails.length > 0 && (
              <div className="mb-8 p-4 bg-purple-900/20 border border-purple-800/50 rounded-lg">
                <p className="text-sm text-purple-300 mb-3">Selected References ({selectedThumbnails.length}):</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedThumbnails.map((thumb, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={thumb}
                        alt={`Selected ${idx + 1}`}
                        className="w-32 h-20 object-cover rounded border-2 border-purple-500"
                      />
                      <button
                        onClick={() => toggleThumbnailSelection(thumb)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Describe Your Desired Thumbnail:
              </label>
              <textarea
                value={thumbnailPrompt}
                onChange={(e) => setThumbnailPrompt(e.target.value)}
                placeholder="E.g., Bold text saying 'PASSIVE INCOME', person pointing at money symbols, excited expression, bright colors with green and gold theme"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 min-h-[120px]"
                rows={5}
              />
              <p className="mt-2 text-sm text-gray-500">
                Be specific about text, colors, emotions, and visual elements you want
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateThumbnail}
              disabled={loading || selectedThumbnails.length === 0 || !thumbnailPrompt.trim()}
              className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Thumbnail...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Thumbnail with AI
                </>
              )}
            </button>
          </>
        ) : (
          /* Generated Thumbnail Display */
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-xl font-semibold text-white">Generated Thumbnail</h3>
              </div>
              
              <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-gray-800">
                <img
                  src={generatedThumbnail}
                  alt="Generated thumbnail"
                  className="w-full h-auto rounded-lg mb-4"
                />
                
                {revisedPrompt && (
                  <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded">
                    <p className="text-sm text-blue-300 mb-1">AI Revised Prompt:</p>
                    <p className="text-sm text-gray-300">{revisedPrompt}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadThumbnail}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Thumbnail
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-gray-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Generate Another
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/results')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Results
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThumbnailGeneration

