import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Brain, 
  Database, 
  FileText, 
  Send, 
  Loader2, 
  CheckCircle2, 
  MessageSquare,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Upload,
  File,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL } from '../config'

const ReverseEngineering = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [availableFiles, setAvailableFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loadedData, setLoadedData] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [mode, setMode] = useState('analyze') // 'analyze' or 'chat'
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfChannelName, setPdfChannelName] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchAvailableFiles()
  }, [])

  const fetchAvailableFiles = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/reverse-engineering/files`)
      if (response.data.success) {
        setAvailableFiles(response.data.files)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      alert('Failed to fetch available data files. Make sure you have data files in backend/static_data/')
    } finally {
      setLoading(false)
    }
  }

  const handleFileToggle = (filename) => {
    setSelectedFiles(prev => {
      if (prev.includes(filename)) {
        return prev.filter(f => f !== filename)
      } else {
        return [...prev, filename]
      }
    })
  }

  const handleLoadData = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one data file')
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(`${API_BASE_URL}/api/reverse-engineering/load`, {
        filenames: selectedFiles
      })
      
      if (response.data.success) {
        setLoadedData(response.data.data)
        setStatistics(response.data.statistics)
        alert(`Successfully loaded ${response.data.statistics.total_videos} videos from ${response.data.statistics.total_channels} channels!`)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data files')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!loadedData) {
      alert('Please load data first')
      return
    }

    if (!customPrompt.trim()) {
      alert('Please enter an analysis prompt')
      return
    }

    try {
      setAnalyzing(true)
      const response = await axios.post(`${API_BASE_URL}/api/reverse-engineering/analyze`, {
        filenames: selectedFiles,
        custom_prompt: customPrompt
      })

      if (response.data.success) {
        setAnalysisResult(response.data.analysis)
      }
    } catch (error) {
      console.error('Error analyzing:', error)
      alert('Failed to analyze data')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSendChatMessage = async () => {
    if (!loadedData) {
      alert('Please load data first')
      return
    }

    if (!chatInput.trim()) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setChatLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/reverse-engineering/chat`, {
        filenames: selectedFiles,
        conversation_history: chatMessages,
        new_message: chatInput
      })

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

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!pdfChannelName.trim()) {
      alert('Please enter a channel name first')
      return
    }

    setUploadingPdf(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('channel_name', pdfChannelName)

      const response = await axios.post(
        `${API_BASE_URL}/api/reverse-engineering/upload-pdf`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { channel_name: pdfChannelName }
        }
      )

      if (response.data.success) {
        setUploadResult({
          success: true,
          filename: response.data.filename,
          videos: response.data.videos_parsed,
          message: response.data.message
        })
        
        // Refresh file list
        fetchAvailableFiles()
        
        alert(`Success! Converted ${response.data.videos_parsed} videos and saved as ${response.data.filename}`)
      } else {
        setUploadResult({
          success: false,
          error: response.data.error,
          rawText: response.data.raw_text
        })
      }
    } catch (error) {
      console.error('Error uploading PDF:', error)
      setUploadResult({
        success: false,
        error: error.response?.data?.detail || error.message
      })
    } finally {
      setUploadingPdf(false)
    }
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
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                Reverse Engineering
              </h1>
              <p className="text-gray-400 text-sm">
                Analyze pre-loaded YouTube data with custom prompts
              </p>
            </div>
          </div>
        </div>

        {/* PDF Upload Section */}
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border-2 border-blue-500/30 p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Upload PDF Files</h2>
            <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Easiest Method!</span>
          </div>
          
          <p className="text-sm text-gray-300 mb-4">
            Upload your Google Sheets PDF exports directly. They'll be automatically converted to JSON.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Channel Name *
              </label>
              <input
                type="text"
                value={pdfChannelName}
                onChange={(e) => setPdfChannelName(e.target.value)}
                placeholder="e.g., Zero1 by Zerodha"
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <div className={`px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition-all ${uploadingPdf || !pdfChannelName ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploadingPdf ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload PDF
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={uploadingPdf || !pdfChannelName.trim()}
                  className="hidden"
                />
              </label>
            </div>

            {uploadResult && (
              <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                {uploadResult.success ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <p className="font-semibold text-green-400">Success!</p>
                    </div>
                    <p className="text-sm text-gray-300 mb-1">{uploadResult.message}</p>
                    <p className="text-xs text-gray-400">
                      Saved as: <span className="text-blue-400">{uploadResult.filename}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="font-semibold text-red-400">Upload Failed</p>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{uploadResult.error}</p>
                    {uploadResult.rawText && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-400 cursor-pointer">View extracted text</summary>
                        <pre className="mt-2 text-xs text-gray-400 bg-black/30 p-2 rounded overflow-auto max-h-40">
                          {uploadResult.rawText}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="bg-[#0a0a0a] p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">💡 <strong>Tips:</strong></p>
              <ul className="text-xs text-gray-500 space-y-1 ml-4">
                <li>• Export each Google Sheets tab as a separate PDF</li>
                <li>• Make sure your PDF has: Title, Transcript, and Comments columns</li>
                <li>• One PDF per channel works best</li>
                <li>• The system will auto-detect video structure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* File Selection Section */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Available Data Files</h2>
          </div>

          {loading && !loadedData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : availableFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No data files found</p>
              <p className="text-sm text-gray-500">
                Add JSON files to <code className="bg-gray-800 px-2 py-1 rounded">backend/static_data/</code>
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {availableFiles.map((file) => (
                  <div
                    key={file.filename}
                    onClick={() => handleFileToggle(file.filename)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedFiles.includes(file.filename)
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <h3 className="font-semibold text-sm">{file.channel_name}</h3>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{file.filename}</p>
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>{file.videos_count} videos</span>
                          <span>•</span>
                          <span>{file.fetch_date}</span>
                        </div>
                      </div>
                      {selectedFiles.includes(file.filename) && (
                        <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleLoadData}
                disabled={selectedFiles.length === 0 || loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  `Load ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                )}
              </button>
            </>
          )}
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold">Loaded Data Statistics</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Channels</p>
                <p className="text-2xl font-bold text-white">{statistics.total_channels}</p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Videos</p>
                <p className="text-2xl font-bold text-white">{statistics.total_videos}</p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Comments</p>
                <p className="text-2xl font-bold text-white">{statistics.total_comments}</p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-white">
                  {(statistics.total_views / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Transcripts</p>
                <p className="text-2xl font-bold text-white">{statistics.videos_with_transcripts}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        {loadedData && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('analyze')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                mode === 'analyze'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Single Analysis
              </div>
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                mode === 'chat'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat Mode
              </div>
            </button>
          </div>
        )}

        {/* Analysis Mode */}
        {loadedData && mode === 'analyze' && (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">Custom Analysis</h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What would you like to analyze?
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Example: Identify the top 5 recurring topics across all videos and suggest 3 new content ideas based on comment requests..."
                rows={4}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !customPrompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                'Run Analysis'
              )}
            </button>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="mt-6 bg-[#0a0a0a] rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 text-purple-400">Analysis Results</h3>
                
                {analysisResult.analysis_summary && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Summary</h4>
                    <p className="text-gray-300">{analysisResult.analysis_summary}</p>
                  </div>
                )}

                {analysisResult.key_findings && analysisResult.key_findings.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Key Findings</h4>
                    <ul className="space-y-2">
                      {analysisResult.key_findings.map((finding, idx) => (
                        <li key={idx} className="flex gap-2 text-gray-300">
                          <span className="text-purple-400 flex-shrink-0">•</span>
                          <span>{typeof finding === 'object' ? JSON.stringify(finding, null, 2) : finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.patterns && analysisResult.patterns.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Patterns</h4>
                    <ul className="space-y-2">
                      {analysisResult.patterns.map((pattern, idx) => (
                        <li key={idx} className="flex gap-2 text-gray-300">
                          <span className="text-pink-400 flex-shrink-0">•</span>
                          <span>{typeof pattern === 'object' ? JSON.stringify(pattern, null, 2) : pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.insights && analysisResult.insights.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Insights</h4>
                    <ul className="space-y-2">
                      {analysisResult.insights.map((insight, idx) => (
                        <li key={idx} className="flex gap-2 text-gray-300">
                          <span className="text-yellow-400 flex-shrink-0">•</span>
                          <span>{typeof insight === 'object' ? JSON.stringify(insight, null, 2) : insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-300 mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 text-gray-300">
                          <span className="text-green-400 flex-shrink-0">•</span>
                          <span>{typeof rec === 'object' ? JSON.stringify(rec, null, 2) : rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Mode */}
        {loadedData && mode === 'chat' && (
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">Chat with Your Data</h2>
            </div>

            {/* Chat Messages */}
            <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4 h-96 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Start a conversation by asking a question about your data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                placeholder="Ask a question about your data..."
                className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={chatLoading}
              />
              <button
                onClick={handleSendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReverseEngineering

