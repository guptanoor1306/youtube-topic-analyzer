import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './components/Home'
import Zero1Videos from './components/Zero1Videos'
import FinanceNiche from './components/FinanceNiche'
import Results from './components/Results'

function App() {
  const [appState, setAppState] = useState({
    primaryChannel: null,
    availableVideos: null,
    selectedMyVideos: [],
    selectedCompetitorVideos: [],
    currentMode: null,
    results: null,
    customPrompt: ''
  })

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

