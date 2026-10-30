'use client';

// WF-10 | Giao diện quét danh thiếp / hợp đồng bằng OCR (AI Vision).
import { useEffect, useRef, useState } from 'react';

type BusinessCard = {
  fullName?: string; jobTitle?: string; companyName?: string; email?: string;
  phone?: string; phoneOther?: string; website?: string; address?: string;
};
type Party = { name?: string; role?: string; representative?: string };
type Contract = {
  title?: string; contractNumber?: string; signedDate?: string | null; effectiveDate?: string | null; expiryDate?: string | null;
  parties?: Party[]; totalValue?: number | null; currency?: string | null; paymentTerms?: string; renewalTerms?: string; summary?: string;
};
type OcrResult = {
  status: 'extracted' | 'needs_review' | 'duplicate' | 'rejected' | 'error';
  documentId?: string;
  docType?: 'business_card' | 'contract';
  confidence?: number;
  reviewReasons?: string[];
  warnings?: string[];
  lead?: { id: string; created: boolean } | null;
  leadSkippedReason?: string | null;
  data?: BusinessCard & Contract;
  message?: string;
  errors?: { code?: string; message?: string }[];
  error?: string;
};

const REASON_LABELS: Record<string, string> = {
  LOW_CONFIDENCE: 'AI không chắc chắn về kết quả đọc',
  NO_NAME: 'Không đọc được họ tên',
  NO_CONTACT: 'Không có email/số điện thoại hợp lệ',
  DOC_TYPE_DIFFERS_FROM_HINT: 'Loại tài liệu khác với loại bạn chọn',
  NO_PARTIES: 'Không đọc được các bên trong hợp đồng',
  NO_DATES: 'Không đọc được ngày ký/hiệu lực/hết hạn',
  EXPIRY_BEFORE_START: 'Ngày hết hạn sớm hơn ngày bắt đầu',
};

const money = (v?: number | null, c?: string | null) =>
  typeof v === 'number' ? `${v.toLocaleString('vi-VN')} ${c || ''}`.trim() : '—';

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-900 break-words">{value || '—'}</dd>
    </div>
  );
}

export default function OcrScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [docType, setDocType] = useState<'auto' | 'business_card' | 'contract'>('auto');
  const [createLead, setCreateLead] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file || file.type === 'application/pdf') { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | null | undefined) {
    setResult(null); setError('');
    if (!f) return;
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.type)) {
      setFile(null); setError('Chỉ nhận ảnh JPG, PNG, WEBP hoặc file PDF.'); return;
    }
    if (f.size > 8 * 1024 * 1024) { setFile(null); setError('File quá lớn (tối đa 8 MB).'); return; }
    setFile(f);
  }

  async function submit(replace = false) {
    if (!file) return;
    setLoading(true); setResult(null); setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('docType', docType);
    form.append('createLead', String(createLead));
    form.append('replace', String(replace));
    try {
      const res = await fetch('/api/sales/ocr', { method: 'POST', body: form });
      const json = (await res.json().catch(() => ({}))) as OcrResult;
      if (!res.ok && !json.status) setError(json.error || 'Không xử lý được file.');
      else setResult(json);
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  const d = result?.data;
  const ok = result?.status === 'extracted' || result?.status === 'needs_review';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Cột trái: chọn file */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Quét danh thiếp / hợp đồng (WF-10)</h2>
          <p className="text-sm text-slate-600">Chụp hoặc tải ảnh lên, AI sẽ tự đọc và lưu thông tin — không cần gõ tay.</p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-teal-500"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Xem trước" className="max-h-64 rounded-lg object-contain" />
          ) : file ? (
            <p className="text-sm font-semibold text-slate-700">📄 {file.name}</p>
          ) : (
            <>
              <span className="text-3xl">📇</span>
              <p className="mt-2 text-sm font-semibold text-slate-700">Bấm để chọn hoặc kéo thả ảnh/PDF vào đây</p>
              <p className="text-xs text-slate-500">JPG, PNG, WEBP hoặc PDF — tối đa 8 MB</p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
            onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">
            Loại tài liệu
            <select value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="auto">Để AI tự nhận biết</option>
              <option value="business_card">Danh thiếp</option>
              <option value="contract">Hợp đồng</option>
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={createLead} onChange={(e) => setCreateLead(e.target.checked)} />
            Tự tạo khách hàng (lead) từ danh thiếp
          </label>
        </div>

        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <button type="button" disabled={!file || loading} onClick={() => submit(false)}
          className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50">
          {loading ? 'AI đang đọc… (có thể mất 10–30 giây)' : 'Bóc tách bằng OCR'}
        </button>
      </section>

      {/* Cột phải: kết quả */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Kết quả</h3>
        {!result && <p className="text-sm text-slate-500">Chưa có kết quả. Chọn file và bấm “Bóc tách bằng OCR”.</p>}

        {result?.status === 'duplicate' && (
          <div className="space-y-3">
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">File này đã được bóc tách trước đó.</p>
            <button type="button" onClick={() => submit(true)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">Bóc tách lại</button>
          </div>
        )}

        {(result?.status === 'rejected' || result?.status === 'error') && (
          <div className="space-y-1 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {(result.errors?.length ? result.errors : [{ message: result.error || 'Không xử lý được file.' }]).map((e, i) => (
              <p key={i}>{e.message}</p>
            ))}
          </div>
        )}

        {ok && result && (
          <div className="space-y-4">
            <div className={`rounded-lg p-3 text-sm ${result.status === 'needs_review' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
              <p className="font-bold">{result.status === 'needs_review' ? '⚠️ Cần người xem lại' : '✅ Đã bóc tách xong'}</p>
              <p>{result.message}</p>
              {result.reviewReasons?.map((r) => <p key={r}>• {REASON_LABELS[r] || r}</p>)}
            </div>

            {typeof result.confidence === 'number' && (
              <p className="text-xs text-slate-500">Độ tự tin AI tự đánh giá: <b>{Math.round(result.confidence * 100)}%</b> · Mã tài liệu: <span className="font-mono">{result.documentId?.slice(0, 8)}</span></p>
            )}

            {result.docType === 'business_card' && d && (
              <dl>
                <Row label="Họ tên" value={d.fullName} />
                <Row label="Chức danh" value={d.jobTitle} />
                <Row label="Công ty" value={d.companyName} />
                <Row label="Email" value={d.email} />
                <Row label="Điện thoại" value={d.phone} />
                <Row label="SĐT khác" value={d.phoneOther} />
                <Row label="Website" value={d.website} />
                <Row label="Địa chỉ" value={d.address} />
              </dl>
            )}

            {result.docType === 'contract' && d && (
              <dl>
                <Row label="Tên hợp đồng" value={d.title} />
                <Row label="Số hợp đồng" value={d.contractNumber} />
                <Row label="Ngày ký" value={d.signedDate} />
                <Row label="Hiệu lực từ" value={d.effectiveDate} />
                <Row label="Hết hạn" value={d.expiryDate} />
                <Row label="Giá trị" value={money(d.totalValue, d.currency)} />
                <Row label="Các bên" value={(d.parties || []).map((p) => `${p.role ? p.role + ': ' : ''}${p.name}${p.representative ? ' (' + p.representative + ')' : ''}`).join(' | ')} />
                <Row label="Thanh toán" value={d.paymentTerms} />
                <Row label="Gia hạn" value={d.renewalTerms} />
                <Row label="Tóm tắt" value={d.summary} />
              </dl>
            )}

            {result.lead && (
              <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
                👤 {result.lead.created ? 'Đã tạo khách hàng mới' : 'Đã cập nhật khách hàng có sẵn'} — xem ở tab “Khách Hàng & Lead 360”.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
