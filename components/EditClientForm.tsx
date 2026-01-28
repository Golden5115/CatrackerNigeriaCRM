'use client'

import { updateClient, deleteVehicle } from "@/app/actions/manageClient"
import { useState } from "react"
import { Plus, Trash2, Car, User, Phone, Mail, MapPin, Globe, Hash, Calendar, Save } from "lucide-react"

// 1. UPDATED TYPES (Allow null)
type VehicleData = {
  id: string;
  name: string;
  year: string | null;          // <--- Changed to allow null
  plateNumber: string | null;   // <--- Changed to allow null
}

type ClientData = {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  state: string | null;
  leadSource: string | null;
  dob: Date | null;
  vehicles: VehicleData[];
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export default function EditClientForm({ client }: { client: ClientData }) {
  const [vehicles, setVehicles] = useState(client.vehicles);

  const addVehicle = () => {
    // Add a placeholder vehicle with ID 'NEW'
    setVehicles([...vehicles, { id: 'NEW', name: "", year: "", plateNumber: "" }]);
  }

  const handleDeleteVehicle = async (index: number, vehicleId: string) => {
    if (confirm("Are you sure? This will delete the vehicle and its history.")) {
      if (vehicleId !== 'NEW') {
        await deleteVehicle(vehicleId); 
      }
      const newList = [...vehicles];
      newList.splice(index, 1);
      setVehicles(newList);
    }
  }

  const handleVehicleChange = (index: number, field: keyof VehicleData, value: string) => {
    const newList = [...vehicles];
    // @ts-ignore
    newList[index][field] = value;
    setVehicles(newList);
  }

  // Styling
  const inputClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 py-2.5 pr-4 pl-10 text-sm text-gray-700 bg-white";
  const selectClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 py-2.5 px-4 text-sm text-gray-700 bg-white";
  const selectIconClass = "w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 py-2.5 pr-4 pl-10 text-sm text-gray-700 bg-white";

  return (
    <form action={updateClient} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
      <input type="hidden" name="clientId" value={client.id} />

      {/* SECTION 1: Personal Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-2">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input name="fullName" defaultValue={client.fullName} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                name="dob" 
                type="date" 
                defaultValue={client.dob ? new Date(client.dob).toISOString().split('T')[0] : ''} 
                className={inputClass} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Contact Info */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input name="phoneNumber" defaultValue={client.phoneNumber} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input name="email" defaultValue={client.email || ''} className={inputClass} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input name="address" defaultValue={client.address || ''} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">State</label>
            <select name="state" defaultValue={client.state || ''} className={selectClass}>
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
              <select name="leadSource" defaultValue={client.leadSource || ''} className={selectIconClass}>
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

      {/* SECTION 3: EDIT VEHICLES */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Car size={16} /> Edit Fleet
          </h3>
          <button type="button" onClick={addVehicle} className="text-xs flex items-center gap-1 bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition">
            <Plus size={14} /> Add Vehicle
          </button>
        </div>

        {vehicles.map((vehicle, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white p-4 rounded-lg shadow-sm border border-gray-100 relative">
            
            <input type="hidden" name={`vehicleId_${index}`} value={vehicle.id} />

            {/* NAME */}
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-gray-500 mb-1">Vehicle Name</label>
              <input 
                name={`vehicleName_${index}`} 
                required 
                placeholder="e.g. Toyota Camry" 
                value={vehicle.name}
                onChange={(e) => handleVehicleChange(index, 'name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 py-2.5 px-3 text-sm" 
              />
            </div>

            {/* YEAR */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Year</label>
              <input 
                name={`vehicleYear_${index}`} 
                placeholder="2015" 
                // 2. SAFE VALUE: Use || "" to handle nulls
                value={vehicle.year || ""}
                onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 py-2.5 px-3 text-sm" 
              />
            </div>

            {/* PLATE */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-gray-500 mb-1">Plate Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  name={`vehiclePlate_${index}`} 
                  // 3. OPTIONAL: Removed 'required'
                  placeholder="ABC-123-XY" 
                  // 4. SAFE VALUE: Use || "" to handle nulls
                  value={vehicle.plateNumber || ""}
                  onChange={(e) => handleVehicleChange(index, 'plateNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 py-2.5 pr-4 pl-10 text-sm font-mono uppercase" 
                />
              </div>
            </div>

            <div className="md:col-span-1 flex justify-center pb-2">
              <button 
                type="button" 
                onClick={() => handleDeleteVehicle(index, vehicle.id)} 
                className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition"
                title="Delete this vehicle"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        <input type="hidden" name="vehicleCount" value={vehicles.length} />
      </div>

      <div className="pt-6 flex gap-4 border-t">
         <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex justify-center items-center gap-2">
           <Save size={18} />
           Save Changes
         </button>
      </div>
    </form>
  )
}