'use client'

import { useState } from "react"

export default function FormattedAmountInput() {
  const [rawValue, setRawValue] = useState("")
  const [displayValue, setDisplayValue] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip out everything except numbers and decimals
    const numericString = e.target.value.replace(/[^0-9.]/g, '')
    setRawValue(numericString)
    
    if (numericString) {
      const parts = numericString.split('.')
      parts[0] = Number(parts[0]).toLocaleString('en-US') // Adds the commas!
      setDisplayValue(parts.join('.'))
    } else {
      setDisplayValue("")
    }
  }

  return (
    <>
      {/* Secretly sends the clean number (e.g. 15000) to the database */}
      <input type="hidden" name="amount" value={rawValue} />
      
      {/* Shows the beautiful formatted number (e.g. 15,000) to the user */}
      <input 
        type="text" 
        value={displayValue}
        onChange={handleChange}
        required 
        placeholder="0.00" 
        className="w-24 px-2 py-1 text-sm border rounded outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500" 
      />
    </>
  )
}