'use client';

type TabType = 'leads' | 'studio' | 'calls' | 'approvals';

interface VisualProcessBannerProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  customerCount?: number | null;
  approvalCount?: number | null;
  callCount?: number | null;
}

export default function VisualProcessBanner({
  activeTab,
  onTabChange,
  customerCount,
  approvalCount,
  callCount,
}: VisualProcessBannerProps) {
  const steps = [
    {
      tab: 'leads' as TabType,
      step: '01',
      title: 'Hồ sơ Khách hàng 360',
      subtitle: 'Xem Lead, Điểm AI & Kích hoạt gọi',
      icon: '📋',
      badge: `${customerCount ?? '…'} Lead`,
      badgeColor: 'bg-indigo-100 text-indigo-700',
      activeColor: 'from-indigo-600 to-blue-600',
      borderActive: 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/40',
    },
    {
      tab: 'studio' as TabType,
      step: '02',
      title: 'Studio Voice AI',
      subtitle: 'Đàm thoại AI & Clone giọng thật',
      icon: '🎙️',
      badge: 'LIVE AI',
      badgeColor: 'bg-purple-100 text-purple-700 animate-pulse',
      activeColor: 'from-purple-600 to-violet-600',
      borderActive: 'border-purple-400 ring-2 ring-purple-200 bg-purple-50/40',
    },
    {
      tab: 'calls' as TabType,
      step: '03',
      title: 'Giám sát Cuộc gọi',
      subtitle: 'Biên bản lời thoại & Phân tích Intent',
      icon: '📞',
      badge: `${callCount ?? '…'} Cuộc gọi`,
      badgeColor: 'bg-blue-100 text-blue-700',
      activeColor: 'from-blue-600 to-cyan-600',
      borderActive: 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/40',
    },
    {
      tab: 'approvals' as TabType,
      step: '04',
      title: 'Phê duyệt Báo giá HITL',
      subtitle: 'Kiểm soát chiết khấu ngoại lệ',
      icon: '⚖️',
      badge: approvalCount && approvalCount > 0 ? `${approvalCount} Chờ duyệt` : 'Đã chuẩn hóa',
      badgeColor: approvalCount && approvalCount > 0 ? 'bg-amber-100 text-amber-800 font-extrabold animate-pulse' : 'bg-emerald-100 text-emerald-700',
      activeColor: 'from-amber-500 to-orange-600',
      borderActive: 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/40',
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs">
            ⚡
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Quy Trình Bán Hàng &amp; Vận Hành AI 4 Bước (Bấm bước để chuyển giao diện)
            </h2>
            <p className="text-[11px] text-slate-500">
              Mỗi bước kết nối trực tiếp với một phân hệ dữ liệu thật trong cơ sở dữ liệu PostgreSQL.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 hidden md:inline-flex items-center gap-1">
          <span>Tự động hóa luồng khép kín</span>
          <span>&rarr;</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((item, idx) => {
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabChange(item.tab)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all duration-200 card-hover ${
                isActive
                  ? item.borderActive
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.step}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                  {item.subtitle}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100/80 text-[10px]">
                <span className={`font-semibold ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {isActive ? '● Đang mở' : 'Bấm để xem'}
                </span>
                {idx < steps.length - 1 && (
                  <span className="text-slate-300 hidden lg:inline">&rarr;</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
