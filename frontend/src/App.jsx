import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './components/Home'
import Zero1Videos from './components/Zero1Videos'
import FinanceNiche from './components/FinanceNiche'
import Results from './components/Results'
import TopicSelection from './components/TopicSelection'
import TitleGeneration from './components/TitleGeneration'
import ThumbnailGeneration from './components/ThumbnailGeneration'

function App() {
  const [appState, setAppState] = useState({
    primaryChannel: null,
    availableVideos: null,
    selectedMyVideos: [],
    selectedCompetitorVideos: [],
    currentMode: null,
    results: null,
    customPrompt: '',
    selectedTopic: null,
    titleSuggestions: [],
    selectedTitle: null
  })

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route 
              path="/zero1-videos" 
              element={
                <Zero1Videos 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route 
              path="/finance-niche" 
              element={
                <FinanceNiche 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route 
              path="/results" 
              element={
                <Results 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route 
              path="/topic-selection" 
              element={
                <TopicSelection 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route 
              path="/title-generation" 
              element={
                <TitleGeneration 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route 
              path="/thumbnail-generation" 
              element={
                <ThumbnailGeneration 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

