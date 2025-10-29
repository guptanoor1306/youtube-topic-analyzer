import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Upload, ArrowRight, Loader2 } from 'lucide-react'

const ChannelSetup = ({ appState, setAppState }) => {
  const navigate = useNavigate()
  const [channelInput, setChannelInput] = useState('UCUUlw3anBIkbW9W44Y-eURw') // Default to Zero1 by Zerodha
  const [channelName, setChannelName] = useState('Zero1 by Zerodha')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)

  const handleSetupChannel = async () => {
    if (!channelInput.trim()) {
      setError('Please enter a channel ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/channel/setup', {
        channel_id: channelInput.trim(),
        channel_name: channelName
      })

      if (response.data.success) {
        setAppState({
          ...appState,
          primaryChannel: response.data.channel,
          availableVideos: response.data.recent_videos
        })
        navigate('/select-videos')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to setup channel. Please check the channel ID.')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPdfFile(file)
    setUploadingPdf(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setAppState({
          ...appState,
          pdfData: response.data.parsed_data
        })
      }
    } catch (err) {
      setError('Failed to upload PDF. Please try again.')
      setPdfFile(null)
    } finally {
      setUploadingPdf(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Setup Your Primary Channel
        </h2>
        <p className="text-gray-600 mb-8">
          Enter your YouTube channel details to get started with topic identification
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Name
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g., Zero1 by Zerodha"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel ID
            </label>
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder="Enter YouTube Channel ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500">
              Find your channel ID in your YouTube channel URL or settings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Channel Analysis PDF (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF with top videos data</p>
              </div>
            </div>
            {uploadingPdf && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading PDF...
              </div>
            )}
            {pdfFile && !uploadingPdf && (
              <div className="mt-2 text-sm text-green-600">
                ✓ {pdfFile.name} uploaded successfully
              </div>
            )}
          </div>

          <button
            onClick={handleSetupChannel}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting up channel...
              </>
            ) : (
              <>
                Continue to Video Selection
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Setup your primary channel (like Zero1 by Zerodha)</li>
          <li>Select 1-5 videos from your channel to analyze</li>
          <li>Choose your path:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li><strong>Suggest Series:</strong> Get series ideas based on your content</li>
              <li><strong>Suggest Format:</strong> Search competitor videos and adapt their format</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  )
}

export default ChannelSetup

