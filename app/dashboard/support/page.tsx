'use client'

import { useState, useEffect } from "react"
import { Plus, CheckCircle, Clock, Trash2, Wrench, MapPin, UserCheck, Cpu, CreditCard, Search } from "lucide-react"
import { getSupportTickets, createSupportTicket, resolveSupportTicket, deleteSupportTicket, getAvailableInventory } from "@/app/actions/support"

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [inventory, setInventory] = useState<{devices: any[], simCards: any[], oldDevices: any[], oldSims: any[]}>({ 
    devices: [], simCards: [], oldDevices: [], oldSims: [] 
  }) 
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [resolveTicket, setResolveTicket] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Smart Search States (NEW HARDWARE)
  const [imeiSearch, setImeiSearch] = useState("")
  const [simSearch, setSimSearch] = useState("")
  const [showImeiList, setShowImeiList] = useState(false)
  const [showSimList, setShowSimList] = useState(false)

  // Smart Search States (OLD HARDWARE)
  const [oldImeiSearch, setOldImeiSearch] = useState("")
  const [oldSimSearch, setOldSimSearch] = useState("")
  const [showOldImeiList, setShowOldImeiList] = useState(false)
  const [showOldSimList, setShowOldSimList] = useState(false)

  async function loadData() {
    setIsLoading(true)
    const [ticketData, invData] = await Promise.all([
      getSupportTickets(),
      getAvailableInventory()
    ])
    setTickets(ticketData)
    setInventory(invData)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await createSupportTicket(formData)
    setIsCreateOpen(false)
    loadData()
  }

  async function handleResolve(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('id', resolveTicket.id)
    
    // Ensure all smart search values are appended
    formData.set('imei', imeiSearch)
    formData.set('trackerSim', simSearch)
    formData.set('oldImei', oldImeiSearch)
    formData.set('oldTrackerSim', oldSimSearch)

    await resolveSupportTicket(formData)
    setResolveTicket(null)
    setImeiSearch("")
    setSimSearch("")
    setOldImeiSearch("")
    setOldSimSearch("")
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this support ticket?')) return;
    const formData = new FormData()
    formData.append('id', id)
    await deleteSupportTicket(formData)
    loadData()
  }

  // Smart Filters
  const filteredDevices = inventory.devices.filter(d => d.imei?.toLowerCase().includes(imeiSearch.toLowerCase()))
  const filteredSims = inventory.simCards.filter(s => s.simNumber?.toLowerCase().includes(simSearch.toLowerCase()))
  const filteredOldDevices = inventory.oldDevices.filter(d => d.imei?.toLowerCase().includes(oldImeiSearch.toLowerCase()))
  const filteredOldSims = inventory.oldSims.filter(s => s.simNumber?.toLowerCase().includes(oldSimSearch.toLowerCase()))

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Support Tickets</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage maintenance requests and track technical resolutions.</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
          <Plus size={18} /> Initiate Support
        </button>
      </div>

      {/* TICKETS TABLE */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden overflow-x-auto w-full custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Client & Address</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Date Initiated</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Issue / Installer</th>
              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-sm font-bold text-gray-400">Loading tickets...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-sm font-bold text-gray-400">No support tickets found.</td></tr>
            ) : (
              tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-gray-900">{ticket.clientName}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1.5"><MapPin size={12} className="text-gray-400"/> {ticket.address || 'No address provided'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-gray-800">{new Date(ticket.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">{new Date(ticket.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-gray-700 max-w-xs truncate">{ticket.issue || 'No issue described'}</p>
                    {ticket.installerName && (
                      <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider flex items-center gap-1"><UserCheck size={10}/> Fixed by: {ticket.installerName}</p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {ticket.status === 'RESOLVED' ? (
                      <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><CheckCircle size={12}/> Resolved</span>
                    ) : (
                      <span className="bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit"><Clock size={12}/> Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap">
                    {ticket.status === 'PENDING' && (
                      <button onClick={() => setResolveTicket(ticket)} className="text-blue-600 font-bold bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-xs hover:bg-blue-600 hover:text-white transition inline-flex items-center gap-1.5 mr-3 shadow-sm">
                        <Wrench size={14}/> Resolve
                      </button>
                    )}
                    <button onClick={() => handleDelete(ticket.id)} className="text-gray-400 hover:text-red-600 transition bg-gray-50 p-2 rounded-xl hover:bg-red-50">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: INITIATE SUPPORT */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6">Initiate Support</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client Name *</label>
                <input name="clientName" required className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date Initiated *</label>
                <input type="datetime-local" name="date" required defaultValue={new Date().toISOString().slice(0, 16)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address / Location *</label>
                <input name="address" required placeholder="Where is the vehicle?" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Description</label>
                <textarea name="issue" rows={3} placeholder="What is wrong with the tracker?" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-medium resize-none"></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm text-sm">Open Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESOLVE SUPPORT (WITH SMART SEARCHES) */}
      {resolveTicket && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 my-8">
            
            <div className="bg-gray-50 rounded-t-3xl p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-1 flex items-center gap-2"><Wrench className="text-blue-600"/> Resolve Support Ticket</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client: {resolveTicket.clientName}</p>
            </div>
            
            <form onSubmit={handleResolve} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">Vehicle Name *</label>
                  <input name="vehicleName" required placeholder="e.g. Toyota Camry" className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-bold bg-white shadow-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">Installer Name *</label>
                  <input name="installerName" required placeholder="Who fixed it?" className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-bold bg-white shadow-sm" />
                </div>
              </div>
              
              {/* 🔴 OLD HARDWARE REMOVED (SMART SEARCH) */}
              <div className="p-5 border-2 border-dashed border-red-200 bg-red-50/30 rounded-2xl relative mt-2">
                <div className="absolute -top-3 left-4 bg-red-100 border border-red-200 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Old Hardware Removed (Marked as Faulty)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                  
                  {/* Smart OLD IMEI Input */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-red-700/70 uppercase mb-1.5 tracking-widest flex items-center gap-1"><Cpu size={12}/> Faulty IMEI</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                      <input 
                        type="text" 
                        value={oldImeiSearch}
                        onChange={(e) => { setOldImeiSearch(e.target.value); setShowOldImeiList(true); }}
                        onFocus={() => setShowOldImeiList(true)}
                        onBlur={() => setTimeout(() => setShowOldImeiList(false), 200)} 
                        placeholder="Search installed stock..." 
                        className="w-full pl-9 pr-3.5 py-3.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-bold bg-white shadow-sm" 
                        autoComplete="off"
                      />
                    </div>
                    {showOldImeiList && filteredOldDevices.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-red-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredOldDevices.map((device, i) => (
                          <div 
                            key={i} 
                            onClick={() => { setOldImeiSearch(device.imei); setShowOldImeiList(false); }}
                            className="p-3 hover:bg-red-50 cursor-pointer border-b border-red-50 last:border-0 transition"
                          >
                            <p className="text-sm font-bold text-gray-900">{device.imei}</p>
                            <p className="text-[10px] font-bold text-red-600 uppercase">Currently {device.status}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Smart OLD SIM Input */}
                  <div className="relative">
                    <label className="block text-[10px] font-black text-red-700/70 uppercase mb-1.5 tracking-widest flex items-center gap-1"><CreditCard size={12}/> Faulty SIM</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400" />
                      <input 
                        type="text" 
                        value={oldSimSearch}
                        onChange={(e) => { setOldSimSearch(e.target.value); setShowOldSimList(true); }}
                        onFocus={() => setShowOldSimList(true)}
                        onBlur={() => setTimeout(() => setShowOldSimList(false), 200)}
                        placeholder="Search installed stock..." 
                        className="w-full pl-9 pr-3.5 py-3.5 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm font-bold bg-white shadow-sm"
                        autoComplete="off"
                      />
                    </div>
                    {showOldSimList && filteredOldSims.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-red-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredOldSims.map((sim, i) => (
                          <div 
                            key={i} 
                            onClick={() => { setOldSimSearch(sim.simNumber); setShowOldSimList(false); }}
                            className="p-3 hover:bg-red-50 cursor-pointer border-b border-red-50 last:border-0 transition"
                          >
                            <p className="text-sm font-bold text-gray-900">{sim.simNumber}</p>
                            <p className="text-[10px] font-bold text-red-600 uppercase">Currently {sim.status}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* 🟢 NEW HARDWARE INSTALLED (SMART SEARCH) */}
              <div className="p-5 border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl relative">
                <div className="absolute -top-3 left-4 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  New Hardware Installed (From Stock)
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest flex items-center gap-1"><Cpu size={12}/> New IMEI</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={imeiSearch}
                        onChange={(e) => { setImeiSearch(e.target.value); setShowImeiList(true); }}
                        onFocus={() => setShowImeiList(true)}
                        onBlur={() => setTimeout(() => setShowImeiList(false), 200)} 
                        placeholder="Search available stock..." 
                        className="w-full pl-9 pr-3.5 py-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-sm font-bold bg-white shadow-sm" 
                        autoComplete="off"
                      />
                    </div>
                    {showImeiList && filteredDevices.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredDevices.map((device, i) => (
                          <div 
                            key={i} 
                            onClick={() => { setImeiSearch(device.imei); setShowImeiList(false); }}
                            className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0 transition"
                          >
                            <p className="text-sm font-bold text-gray-900">{device.imei}</p>
                            <p className="text-[10px] font-bold text-green-600 uppercase">Available in Stock</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest flex items-center gap-1"><CreditCard size={12}/> New SIM</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={simSearch}
                        onChange={(e) => { setSimSearch(e.target.value); setShowSimList(true); }}
                        onFocus={() => setShowSimList(true)}
                        onBlur={() => setTimeout(() => setShowSimList(false), 200)}
                        placeholder="Search available stock..." 
                        className="w-full pl-9 pr-3.5 py-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition text-sm font-bold bg-white shadow-sm"
                        autoComplete="off"
                      />
                    </div>
                    {showSimList && filteredSims.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredSims.map((sim, i) => (
                          <div 
                            key={i} 
                            onClick={() => { setSimSearch(sim.simNumber); setShowSimList(false); }}
                            className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0 transition"
                          >
                            <p className="text-sm font-bold text-gray-900">{sim.simNumber}</p>
                            <p className="text-[10px] font-bold text-purple-600 uppercase">{sim.network}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 tracking-widest">Resolution Process *</label>
                <textarea name="process" required rows={4} placeholder="What was exactly done to fix the issue?" className="w-full p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm font-medium resize-none bg-white shadow-sm"></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setResolveTicket(null); setImeiSearch(""); setSimSearch(""); setOldImeiSearch(""); setOldSimSearch(""); }} className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3.5 bg-[#84c47c] text-white font-black tracking-wide rounded-xl hover:bg-[#6aa663] transition shadow-md text-sm flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> COMPLETE & RESOLVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}