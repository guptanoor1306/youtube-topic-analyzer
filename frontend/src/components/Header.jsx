import React from 'react'
import { Youtube } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <Youtube className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            YouTube Topic Identifier
          </h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Discover content ideas and analyze video formats for your channel
        </p>
      </div>
    </header>
  )
}

export default Header

