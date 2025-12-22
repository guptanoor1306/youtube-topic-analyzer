import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './components/Home'
import NewVideoSelection from './components/NewVideoSelection'
import TemplateRunner from './components/TemplateRunner'

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
      <div className="min-h-screen bg-gray-50">
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
              path="/video-selection" 
              element={
                <NewVideoSelection 
                  appState={appState} 
                  setAppState={setAppState} 
                />
              } 
            />
            <Route 
              path="/template-runner" 
              element={
                <TemplateRunner 
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

