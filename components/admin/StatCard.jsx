/**
 * Stat card for admin dashboard (reports, slots). Shows icon, label and value with color theme.
 * @param {{ icon: React.ReactNode, label: string, value: string|number, color: 'blue'|'green'|'orange'|'red'|'gray' }} props
 */
export default function StatCard({ icon, label, value, color }) {
  const theme = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-white bg-red-600 animate-pulse',
    gray: 'text-gray-400 bg-gray-100',
  };
  return (
    <div className="bg-white p-3 lg:p-5 rounded-2xl lg:rounded-[2rem] shadow-sm flex items-center gap-3 border border-gray-50">
      <div className={`p-2 lg:p-4 rounded-xl lg:rounded-2xl ${theme[color]}`}>{icon}</div>
      <div>
        <p className="text-[8px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl lg:text-3xl font-black text-gray-800 leading-none">{value}</p>
      </div>
    </div>
  );
}
