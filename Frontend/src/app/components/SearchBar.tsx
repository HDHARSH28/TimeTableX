import { Search } from 'lucide-react'

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  placeholder?: string
}

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  placeholder = 'Search...',
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search size={20} className="absolute left-3 top-3 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full"
      />
    </div>
  )
}
