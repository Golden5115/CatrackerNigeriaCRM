"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchInput() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full mb-6">
      <input
        type="text"
        placeholder="Search Client, Plate, IMEI..."
        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
    </form>
  );
}