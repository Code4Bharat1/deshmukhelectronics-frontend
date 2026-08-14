'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Download, FileText, BanknoteIcon, CheckCircle, Clock, AlertTriangle, UserCheck, Calendar } from 'lucide-react';
import { salaryApi, usersApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, monthName, cn } from '@/lib/utils';
import useAuthStore from '@/lib/authStore';

function PayslipView({ slip }) {
  if (!slip) return null;

  const basic = slip.earnings?.basic || 0;
  const hra = slip.earnings?.hra || 0;
  const allowances = slip.earnings?.allowances || 0;
  const overtime = slip.earnings?.overtime || 0;
  const bonus = slip.earnings?.bonus || 0;

  const pf = slip.deductions?.pf || 0;
  const tax = slip.deductions?.tax || 0;
  const unpaidLeaveCut = slip.deductions?.unpaidLeaveDeduction || slip.deductions?.leaveDeduction || 0;
  const shiftShortfallCut = slip.deductions?.shiftShortfallDeduction || 0;
  const otherDeductions = slip.deductions?.other || 0;

  return (
    <div className="p-6 space-y-6" id="payslip-print">
      {/* Company Header */}
      <div className="flex items-start justify-between pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-brand-700">Deshmukh Electronics</h2>
          <p className="text-xs text-gray-500 mt-0.5">Warehouse & Team Operations — Payslip</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div className="font-semibold text-gray-800">Pay Period: {slip.payPeriod}</div>
          <div>Generated: {new Date(slip.generatedAt).toLocaleDateString('en-IN')}</div>
          <StatusBadge status={slip.status} className="mt-1" />
        </div>
      </div>

      {/* Employee & Rate Profile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
        <div>
          <span className="text-gray-400 block font-medium">Employee Name</span>
          <span className="font-bold text-gray-900 text-sm">{slip.employee?.name}</span>
        </div>
        <div>
          <span className="text-gray-400 block font-medium">Designation</span>
          <span className="font-semibold text-gray-800 text-sm">{slip.employee?.designation || slip.employee?.role}</span>
        </div>
        <div>
          <span className="text-gray-400 block font-medium">Daily Wage Rate</span>
          <span className="font-bold text-brand-700 text-sm">{slip.dailyRate ? formatCurrency(slip.dailyRate) : '—'}/day</span>
        </div>
        <div>
          <span className="text-gray-400 block font-medium">Hourly Rate</span>
          <span className="font-bold text-brand-700 text-sm">{slip.hourlyRate ? formatCurrency(slip.hourlyRate) : '—'}/hr</span>
        </div>
      </div>

      {/* Shift Attendance & Leave Summary */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-700" /> Attendance & Shift Breakdown (8h standard shift)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-blue-600 block">Working Days</span>
            <span className="font-bold text-blue-900 text-sm">{slip.workingDays || 26} Days</span>
            <span className="text-[10px] text-blue-400 block">Std Hours: {slip.standardHours || 208}h</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-emerald-600 block">Present / Worked</span>
            <span className="font-bold text-emerald-900 text-sm">{slip.presentDays || 0} Full / {slip.halfDays || 0} Half</span>
            <span className="text-[10px] text-emerald-600 font-medium block">{slip.actualHoursWorked || 0} hrs worked</span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-amber-700 block">Early Leaves / Shortfall</span>
            <span className="font-bold text-amber-900 text-sm">{slip.shortfallHours || 0} hrs</span>
            <span className="text-[10px] text-amber-600 block">Deducted at hourly rate</span>
          </div>
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="text-purple-700 block">Leave & Absence</span>
            <span className="font-bold text-purple-900 text-sm">{slip.paidLeaveDays || 0} Paid / {slip.unpaidLeaveDays || slip.absentDays || 0} Unpaid</span>
            <span className="text-[10px] text-purple-600 block">Unpaid deducted from pay</span>
          </div>
        </div>
      </div>

      {/* Earnings & Deductions Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Earnings */}
        <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100 space-y-2">
          <h4 className="font-bold text-emerald-900 text-sm pb-2 border-b border-emerald-200">Earnings</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Basic Pay</span>
              <span className="font-semibold">{formatCurrency(basic)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">House Rent Allowance (HRA)</span>
              <span className="font-semibold">{formatCurrency(hra)}</span>
            </div>
            {allowances > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Special Allowances</span>
                <span className="font-semibold">{formatCurrency(allowances)}</span>
              </div>
            )}
            {overtime > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Overtime Pay ({slip.overtimeHours || 0}h @ 1.25x)</span>
                <span>+{formatCurrency(overtime)}</span>
              </div>
            )}
            {bonus > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Incentive / Bonus</span>
                <span>+{formatCurrency(bonus)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between text-sm font-bold text-emerald-800 border-t border-emerald-200 pt-2">
            <span>Gross Earnings</span>
            <span>{formatCurrency(slip.grossEarnings)}</span>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-red-50/80 rounded-2xl p-4 border border-red-100 space-y-2">
          <h4 className="font-bold text-red-900 text-sm pb-2 border-b border-red-200">Deductions</h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Provident Fund (PF)</span>
              <span className="font-semibold text-red-700">-{formatCurrency(pf)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Professional Tax</span>
                <span className="font-semibold text-red-700">-{formatCurrency(tax)}</span>
              </div>
            )}
            {unpaidLeaveCut > 0 && (
              <div className="flex justify-between text-red-700 font-medium">
                <span>Unpaid Leaves / Absences ({slip.unpaidLeaveDays || slip.absentDays || 0}d)</span>
                <span>-{formatCurrency(unpaidLeaveCut)}</span>
              </div>
            )}
            {shiftShortfallCut > 0 && (
              <div className="flex justify-between text-red-700 font-medium">
                <span>Early Leave / Shift Shortfall ({slip.shortfallHours || 0}h)</span>
                <span>-{formatCurrency(shiftShortfallCut)}</span>
              </div>
            )}
            {otherDeductions > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Other Deductions</span>
                <span className="font-semibold text-red-700">-{formatCurrency(otherDeductions)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between text-sm font-bold text-red-800 border-t border-red-200 pt-2">
            <span>Total Deductions</span>
            <span>-{formatCurrency(slip.totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* Net Pay Card */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-700 rounded-2xl p-4 flex justify-between items-center text-white shadow-lg shadow-brand-700/20">
        <div>
          <span className="text-xs text-white/70 block uppercase tracking-wider font-semibold">Net Salary Payable</span>
          <span className="text-2xl font-extrabold">{formatCurrency(slip.netPay)}</span>
        </div>
        <button
          className="btn-secondary btn-sm bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => window.print()}
        >
          🖨️ Print Payslip
        </button>
      </div>
    </div>
  );
}

export default function SalaryPage() {
  const { user, hasRole } = useAuthStore();
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: 0,
    overtime: '',
  });
  const [genModal, setGenModal] = useState(false);
  const isAdmin = hasRole('owner_admin', 'accountant');

  const fetchSlips = async () => {
    try {
      const res = isAdmin ? await salaryApi.getAll() : await salaryApi.getMine();
      setSlips(res.data.data || []);
    } catch {}
    setLoading(false);
  };

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    try {
      const res = await usersApi.getAll({ isActive: 'true' });
      setEmployees(res.data.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchSlips();
    fetchEmployees();
  }, []);

  const handleGenerate = async () => {
    if (!genForm.employeeId && isAdmin) {
      toast('Please select an employee', 'error');
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        employeeId: genForm.employeeId || user._id,
        month: Number(genForm.month),
        year: Number(genForm.year),
        bonus: Number(genForm.bonus || 0),
        overtime: genForm.overtime ? Number(genForm.overtime) : null,
      };
      await salaryApi.generate(payload);
      toast('Salary slip auto-calculated and generated!', 'success');
      setGenModal(false);
      fetchSlips();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to generate slip', 'error');
    }
    setGenerating(false);
  };

  const handleBulkGenerate = async () => {
    setGenerating(true);
    try {
      const res = await salaryApi.bulkGenerate({ month: genForm.month, year: genForm.year });
      const generated = (res.data.data || []).filter((r) => r.status === 'generated').length;
      toast(`Generated ${generated} salary slips based on attendance records!`, 'success');
      fetchSlips();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to bulk generate', 'error');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary Slips & Payroll</h1>
          <p className="text-gray-500 text-sm">
            Automatic shift shortfall deduction, paid/unpaid leaves, and overtime calculation
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm" onClick={handleBulkGenerate} disabled={generating}>
              <FileText className="w-3.5 h-3.5" /> Bulk Auto-Generate
            </button>
            <button className="btn-primary" onClick={() => setGenModal(true)}>
              <Plus className="w-4 h-4" /> Generate Slip
            </button>
          </div>
        )}
      </div>

      <div className="table-wrapper card p-0">
        <table className="table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Pay Period</th>
              <th>Attendance</th>
              <th>Shift Shortfall</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: isAdmin ? 9 : 8 }).map((_, j) => (
                    <td key={j}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : slips.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="text-center py-12 text-gray-400">
                  No salary slips generated yet
                </td>
              </tr>
            ) : (
              slips.map((slip) => (
                <tr key={slip._id}>
                  {isAdmin && (
                    <td>
                      <div className="font-semibold text-gray-900">{slip.employee?.name}</div>
                      <div className="text-xs text-gray-400">{slip.employee?.designation}</div>
                    </td>
                  )}
                  <td className="font-medium text-gray-800">{slip.payPeriod}</td>
                  <td className="text-xs">
                    <span className="font-semibold text-emerald-700">{slip.presentDays || 0}d present</span>
                    {slip.absentDays > 0 && <span className="text-red-500 ml-1">({slip.absentDays}d unpaid)</span>}
                  </td>
                  <td className="text-xs">
                    {slip.shortfallHours > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        -{slip.shortfallHours}h ({formatCurrency(slip.deductions?.shiftShortfallDeduction)})
                      </span>
                    ) : (
                      <span className="text-gray-400">Full shift (0h)</span>
                    )}
                  </td>
                  <td className="text-emerald-700 font-semibold">{formatCurrency(slip.grossEarnings)}</td>
                  <td className="text-red-600 font-medium">-{formatCurrency(slip.totalDeductions)}</td>
                  <td className="font-bold text-gray-900">{formatCurrency(slip.netPay)}</td>
                  <td>
                    <StatusBadge status={slip.status} />
                  </td>
                  <td>
                    <button className="btn-secondary btn-sm" onClick={() => setSelectedSlip(slip)}>
                      <FileText className="w-3 h-3" /> View Slip
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Modal */}
      <Modal isOpen={genModal} onClose={() => setGenModal(false)} title="Generate Salary Slip" size="md">
        <div className="p-6 space-y-4">
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-xs text-brand-800">
            ⚡ <strong>Automatic Calculation:</strong> Shift shortfall (e.g. leaving after 4h or 5h in an 8h shift), paid/unpaid leaves, and overtime are calculated automatically from attendance records for the selected period.
          </div>

          {isAdmin && (
            <div className="form-group">
              <label className="label">Select Employee *</label>
              <select
                className="input select"
                value={genForm.employeeId}
                onChange={(e) => setGenForm({ ...genForm, employeeId: e.target.value })}
              >
                <option value="">— Select Employee —</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} ({e.designation || e.role}) — Base: {formatCurrency((e.salaryStructure?.basic || 0) + (e.salaryStructure?.hra || 0) + (e.salaryStructure?.allowances || 0))}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Month</label>
              <select
                className="input select"
                value={genForm.month}
                onChange={(e) => setGenForm({ ...genForm, month: Number(e.target.value) })}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {monthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Year</label>
              <input
                type="number"
                className="input"
                value={genForm.year}
                onChange={(e) => setGenForm({ ...genForm, year: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Optional Incentive / Bonus (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={genForm.bonus}
                onChange={(e) => setGenForm({ ...genForm, bonus: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Manual Overtime Override (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="Auto-calculated"
                value={genForm.overtime}
                onChange={(e) => setGenForm({ ...genForm, overtime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setGenModal(false)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Calculating & Generating...' : '⚡ Generate Slip'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payslip Modal */}
      <Modal isOpen={!!selectedSlip} onClose={() => setSelectedSlip(null)} title="Detailed Payslip" size="lg">
        <PayslipView slip={selectedSlip} />
      </Modal>
    </div>
  );
}
