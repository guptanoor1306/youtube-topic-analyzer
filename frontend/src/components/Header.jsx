import React from 'react'
import { Youtube } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-[#111] shadow-lg border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Youtube className="w-7 h-7 text-red-500" />
          <div>
            <h1 className="text-xl font-bold text-white">
              YouTube Topic Analyzer
            </h1>
            <p className="text-xs text-gray-400">
              Discover content ideas and analyze video formats
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

