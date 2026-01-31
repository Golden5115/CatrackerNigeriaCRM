'use client'

import { createLead } from "@/app/actions/createLead"
import { useState } from "react"
import { Plus, Trash2, Car, User, Phone, Mail, MapPin, Globe, Hash, Calendar } from "lucide-react"
import SubmitButton from "@/components/SubmitButton"

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export default function CreateLeadForm() {
  const [vehicles, setVehicles] = useState([{ name: "", year: "", plate: "" }])

  const addVehicle = () => {
    setVehicles([...vehicles, { name: "", year: "", plate: "" }])
  }

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      const newList = [...vehicles]
      newList.splice(index, 1)
      setVehicles(newList)
    }
  }

  const handleVehicleChange = (index: number, field: string, value: string) => {
    const newList = [...vehicles]
    // @ts-ignore
    newList[index][field] = value
    setVehicles(newList)
  }

  // Styles
  const inputClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-2.5 pr-4 pl-10 text-sm text-gray-700 placeholder-gray-400";
  const selectClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-2.5 px-4 text-sm text-gray-700 bg-white";
  const selectIconClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-2.5 pr-4 pl-10 text-sm text-gray-700 bg-white";

  return (
    <form action={createLead} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
      
      {/* SECTION 1: Personal Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-2">Client Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input name="fullName" required placeholder="e.g. John Doe" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input name="dob" type="date" className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Contact Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input name="phoneNumber" required placeholder="0801 234 5678" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Email Address <span className="text-gray-400 font-normal">(Optional)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              {/* REMOVED required */}
              <input name="email" type="email" placeholder="john@example.com" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Address and State/Source (Keep as is) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input name="address" placeholder="Street Address" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">State</label>
            <select name="state" className={selectClass}>
              <option value="">Select State...</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Lead Source</label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select name="leadSource" className={selectIconClass}>
                <option value="Walk-in">Walk-in</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Referral">Referral</option>
                <option value="Website">Website</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Dynamic Vehicles */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Car size={16} /> Vehicle Fleet ({vehicles.length})
          </h3>
          <button type="button" onClick={addVehicle} className="text-xs flex items-center gap-1 bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition">
            <Plus size={14} /> Add Another Vehicle
          </button>
        </div>

        {vehicles.map((vehicle, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative">
            
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-gray-500 mb-1">Vehicle Name *</label>
              <input 
                name={`vehicleName_${index}`} 
                required 
                placeholder="e.g. Toyota Camry" 
                value={vehicle.name}
                onChange={(e) => handleVehicleChange(index, 'name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-2.5 px-3 text-sm" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Year</label>
              {/* REMOVED required */}
              <input 
                name={`vehicleYear_${index}`} 
                placeholder="2015" 
                value={vehicle.year}
                onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-2.5 px-3 text-sm" 
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-gray-500 mb-1">Plate Number <span className="text-gray-300 font-normal">(Optional)</span></label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                {/* REMOVED required */}
                <input 
                  name={`vehiclePlate_${index}`} 
                  placeholder="ABC-123-XY" 
                  value={vehicle.plate}
                  onChange={(e) => handleVehicleChange(index, 'plate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 py-2.5 pr-4 pl-10 text-sm font-mono uppercase" 
                />
              </div>
            </div>

            <div className="md:col-span-1 flex justify-center pb-2">
              {vehicles.length > 1 && (
                <button type="button" onClick={() => removeVehicle(index)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
        <input type="hidden" name="vehicleCount" value={vehicles.length} />
      </div>

      <div className="pt-6 flex gap-4 border-t">
         <SubmitButton 
     className="w-full bg-[#84c47c] text-white py-3 rounded-xl font-bold hover:bg-[#6aa663] shadow-lg text-lg"
     loadingText="Creating Lead..."
   >
     Create Lead & Job Tickets
   </SubmitButton>
      </div>
    </form>
  )
}