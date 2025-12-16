'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import { Shield, AlertTriangle, Activity, RefreshCw, ChevronLeft, ChevronRight, Download, X, Eye } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function LogDetailsModal({ log, onClose }: { log: any; onClose: () => void }) {
  if (!log) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                <Shield size={18} className="text-blue-600" /> Security Event Details
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
            </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded border">
                    <span className="block text-slate-400 uppercase text-[10px] font-bold">Event ID</span>
                    <span className="text-slate-700 break-all">{log.id}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border">
                    <span className="block text-slate-400 uppercase text-[10px] font-bold">Timestamp</span>
                    <span className="text-slate-700">{new Date(log.createdAt).toISOString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border">
                    <span className="block text-slate-400 uppercase text-[10px] font-bold">IP Address</span>
                    <span className="text-slate-700">{log.ipAddress}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded border">
                    <span className="block text-slate-400 uppercase text-[10px] font-bold">User Agent</span>
                    <span className="text-slate-700 break-all line-clamp-3">{log.userAgent}</span>
                </div>
            </div>
            <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(log.details || {}, null, 2)}</pre>
            </div>
        </div>
        <div className="p-4 border-t bg-slate-50 rounded-b-xl text-right">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium text-sm">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminActivityPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const statsRes = await fetch('/api/admin/security/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      const statsData = await statsRes.json()
      if (statsData.success) setStats(statsData.data)

      const logsRes = await fetch(`/api/admin/security/logs?page=${page}&limit=20${filter ? `&filter=${filter}` : ''}`, { headers: { 'Authorization': `Bearer ${token}` } })
      const logsData = await logsRes.json()
      if (logsData.success) setLogs(logsData.data.logs)
    } catch (error) {
      console.error("Failed to load admin dashboard", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData()
  }, [user, page, filter])

  const handleExport = () => {
    if (!logs.length) return;
    const headers = ['ID', 'Action', 'User Email', 'IP Address', 'Location', 'Device', 'Time'];
    const rows = logs.map(log => [
        log.id, log.action, log.user?.email || 'N/A', log.ipAddress, `"${log.details?.location || ''}"`, `"${log.details?.device || ''}"`, new Date(log.createdAt).toISOString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `security_audit_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const pieData = stats ? [{ name: 'Normal', value: stats.dailyTotal - stats.dailyFailed }, { name: 'Failed', value: stats.dailyFailed }] : []
  const COLORS = ['#10b981', '#ef4444']

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <ContentWrapper>
      {selectedLog && <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="text-blue-600" /> Security Command
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Real-time threat monitoring and audit logs</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExport} className="flex-1 md:flex-none justify-center p-2 px-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-2 font-medium text-sm">
                <Download size={16} /> Export CSV
            </button>
            <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-slate-500 text-sm font-medium mb-1">Total Activity (24h)</div>
                <div className="text-3xl font-bold text-slate-900">{stats.dailyTotal}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                <div className="text-red-500 text-sm font-medium mb-1 flex items-center gap-2">
                    <AlertTriangle size={14} /> Failed Logins
                </div>
                <div className="text-3xl font-bold text-red-600">{stats.dailyFailed}</div>
            </div>
            <div className="col-span-1 sm:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                 <div className="text-slate-500 text-sm font-medium mb-3">Login Success Rate</div>
                 <div className="h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={[{ name: 'Rate', success: stats.dailyTotal - stats.dailyFailed, failed: stats.dailyFailed }]}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip cursor={false} />
                            <Bar dataKey="success" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} barSize={20} />
                            <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" size={18} /> Recent Critical Threats
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2">Attacker IP</th>
                                <th className="px-4 py-2">Target</th>
                                <th className="px-4 py-2">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats?.recentThreats.length > 0 ? stats.recentThreats.map((t: any, i: number) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 font-medium text-red-600">{t.type}</td>
                                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{t.ip}</td>
                                    <td className="px-4 py-3 text-slate-900">{t.user}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(t.time).toLocaleTimeString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No critical threats detected recently.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center">
                <h3 className="font-bold text-slate-900 mb-2">Traffic Health</h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-xs mt-4">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Normal</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Failed</div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-20">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={18} className="text-blue-600" /> Full Audit Trail
                </h3>
                <div className="w-full md:w-auto">
                    <select className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm" onChange={(e) => setFilter(e.target.value)} value={filter}>
                        <option value="">All Events</option>
                        <option value="LOGIN_SUCCESS">Login Success</option>
                        <option value="LOGIN_FAILED">Login Failed</option>
                        <option value="BRUTE_FORCE">Brute Force</option>
                        <option value="NEW_DEVICE">New Device</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">IP / Location</th>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">Details</th> 
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{log.user?.name || 'Anonymous'}</div>
                                    <div className="text-xs text-slate-500">{log.user?.email || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.action.includes('FAILED') || log.action === 'BRUTE_FORCE' ? 'bg-red-100 text-red-700' : log.action === 'NEW_DEVICE' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div>{log.ipAddress}</div>
                                    <div className="text-xs text-slate-400">{log.details?.location || 'Unknown'}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedLog(log)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors" title="View Raw Details">
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-slate-600">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} className="p-2 border rounded hover:bg-slate-50">
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>
    </ContentWrapper>
  )
}