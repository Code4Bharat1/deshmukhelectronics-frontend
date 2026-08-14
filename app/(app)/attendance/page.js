'use client';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, UserCircle, Calendar, TrendingUp, MapPin, Users } from 'lucide-react';
import { attendanceApi } from '../../../lib/api';
import { toast } from '../../../components/ui/Toast';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatTime, formatDate, cn } from '../../../lib/utils';
import useAuthStore from '../../../lib/authStore';

function PunchButton({ record, onPunch }) {
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const isPunchedIn = record?.punchInTime && !record?.punchOutTime;

  useEffect(() => {
    if (!isPunchedIn) return;
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(record.punchInTime).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPunchedIn, record]);

  const handlePunch = async () => {
    setLoading(true);
    try {
      let lat = null, lng = null, address = 'Location not available';
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch {}

      if (isPunchedIn) {
        await attendanceApi.punchOut({ lat, lng, address });
        toast('Punched out successfully! Have a great day!', 'success');
      } else {
        const res = await attendanceApi.punchIn({ lat, lng, address });
        toast(res.data.message || 'Punched in successfully!', 'success');
      }
      onPunch();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to record attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPunchedOut = record?.punchInTime && record?.punchOutTime;

  return (
    <div className="card text-center space-y-4">
      <div className="text-sm text-gray-500">
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {/* Big circular punch button */}
      {!isPunchedOut ? (
        <button
          id="punch-btn"
          onClick={handlePunch}
          disabled={loading}
          className={cn(
            'mx-auto w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all duration-200 shadow-lg',
            isPunchedIn
              ? 'border-red-400 bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-red-200'
              : 'border-brand-700 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:shadow-brand-200',
            loading && 'opacity-60 cursor-not-allowed',
            'hover:scale-105 active:scale-95'
          )}
        >
          {loading ? (
            <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isPunchedIn ? <Clock className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
              <span className="text-lg font-bold">{isPunchedIn ? 'Punch Out' : 'Punch In'}</span>
            </>
          )}
        </button>
      ) : (
        <div className="mx-auto w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 border-4 border-emerald-400 bg-emerald-50 text-emerald-700">
          <CheckCircle className="w-8 h-8" />
          <span className="text-sm font-bold">Complete</span>
        </div>
      )}

      {/* Live timer */}
      {isPunchedIn && (
        <div className="text-3xl font-mono font-bold text-brand-700 tracking-widest">{elapsed}</div>
      )}

      {/* Today's status */}
      {record && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { label: 'Punch In', value: record.punchInTime ? formatTime(record.punchInTime) : '—' },
            { label: 'Punch Out', value: record.punchOutTime ? formatTime(record.punchOutTime) : '—' },
            { label: 'Total Hours', value: record.totalHours ? `${record.totalHours}h` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className="font-bold text-gray-900 text-sm">{value}</div>
            </div>
          ))}
        </div>
      )}

      {record?.punchInLocation?.address && (
        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
          <MapPin className="w-3 h-3" />
          <span>{record.punchInLocation.address}</span>
        </div>
      )}
    </div>
  );
}

function MonthlyCalendar({ records }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const getRecord = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return records.find((r) => r.date === dateStr);
  };

  const statusColors = {
    present: 'bg-emerald-500 text-white',
    late: 'bg-amber-400 text-white',
    absent: 'bg-red-400 text-white',
    half_day: 'bg-orange-400 text-white',
    leave: 'bg-blue-400 text-white',
    holiday: 'bg-purple-400 text-white',
  };

  return (
    <div className="card">
      <h2 className="text-base font-bold text-gray-900 mb-4">
        {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
      </h2>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const rec = getRecord(day);
          const isToday = day === now.getDate();
          return (
            <div
              key={day}
              className={cn(
                'aspect-square rounded-xl flex items-center justify-center text-xs font-semibold transition-all',
                rec ? statusColors[rec.status] || 'bg-gray-200' : 'bg-gray-50 text-gray-600',
                isToday && !rec && 'ring-2 ring-brand-700',
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        {[['bg-emerald-500','Present'],['bg-amber-400','Late'],['bg-red-400','Absent'],['bg-orange-400','Half Day']].map(([color,label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { user, hasRole } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [summary, setSummary] = useState({});
  const [todayRecord, setTodayRecord] = useState(null);
  const [tab, setTab] = useState('my');
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const isManager = hasRole('owner_admin', 'manager', 'supervisor');

  const fetchMyAttendance = async () => {
    try {
      const res = await attendanceApi.getMyAttendance({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      const data = res.data.data || [];
      setRecords(data);
      setSummary(res.data.summary || {});
      setTodayRecord(data.find((r) => r.date === today) || null);
    } catch {}
  };

  const fetchTeamAttendance = async () => {
    if (!isManager) return;
    try {
      const res = await attendanceApi.getTeamAttendance({ date: today });
      setTeamData(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    const fetch = async () => {
      await Promise.all([fetchMyAttendance(), fetchTeamAttendance()]);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-gray-500 text-sm">Track your work hours and team attendance</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <button className={cn('btn-sm', tab==='my' ? 'btn-primary' : 'btn-secondary')} onClick={() => setTab('my')}>My Attendance</button>
            <button className={cn('btn-sm', tab==='team' ? 'btn-primary' : 'btn-secondary')} onClick={() => setTab('team')}>
              <Users className="w-3.5 h-3.5" /> Team
            </button>
          </div>
        )}
      </div>

      {tab === 'my' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-5">
            <PunchButton record={todayRecord} onPunch={fetchMyAttendance} />

            {/* Monthly Summary */}
            <div className="card">
              <h2 className="text-base font-bold text-gray-900 mb-4">This Month Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Days Present', value: summary.present || 0, color: 'text-emerald-600' },
                  { label: 'Late Arrivals', value: summary.late || 0, color: 'text-amber-600' },
                  { label: 'Absences', value: summary.absent || 0, color: 'text-red-600' },
                  { label: 'Total Hours', value: `${summary.totalHours || 0}h`, color: 'text-brand-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <MonthlyCalendar records={records} />
        </div>
      ) : (
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Team Attendance — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </h2>
          <div className="table-wrapper -m-4 md:-m-6">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {teamData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">No team data</td></tr>
                ) : teamData.map((item) => (
                  <tr key={item.employee._id}>
                    <td className="font-semibold text-gray-900">{item.employee.name}</td>
                    <td><span className="badge bg-gray-100 text-gray-600 capitalize">{item.employee.role?.replace('_',' ')}</span></td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="text-gray-600">{item.attendance?.punchInTime ? formatTime(item.attendance.punchInTime) : '—'}</td>
                    <td className="text-gray-600">{item.attendance?.punchOutTime ? formatTime(item.attendance.punchOutTime) : '—'}</td>
                    <td className="font-semibold">{item.attendance?.totalHours ? `${item.attendance.totalHours}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
