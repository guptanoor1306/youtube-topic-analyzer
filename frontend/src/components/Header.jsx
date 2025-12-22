import React from 'react'
import { Youtube } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate()
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              YouTube Topic Analyzer
            </h1>
            <p className="text-xs text-gray-500">
              Discover content ideas and analyze video formats
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

