'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Values = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  message: string;
};
type ErrorKey = keyof Values | 'contact' | 'form';
type Errors = Partial<Record<ErrorKey, string>>;
type ServerError = { field?: string; message?: string };
type Receipt = { reference: string; duplicate: boolean };

const EMPTY: Values = { fullName: '', email: '', phone: '', companyName: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SAMPLE_SCENARIOS: Array<{ label: string; badge: string; data: Values }> = [
  {
    label: '🏢 Báo giá Enterprise',
    badge: 'Hot Lead',
    data: {
      fullName: 'Trần Minh Quân',
      email: 'quan.tran@fpt-retail-demo.vn',
      phone: '0905123888',
      companyName: 'Công ty Cổ phần Bán lẻ Kỹ thuật số FPT Demo',
      message:
        'Chúng tôi đang tìm kiếm giải pháp AI Sales Agent tích hợp tổng đài Voice AI tự động cho đội ngũ 80 nhân viên telesales. Vui lòng gửi báo giá gói Enterprise 12 tháng và lịch demo kỹ thuật.',
    },
  },
  {
    label: '🎙️ Tư vấn Voice AI',
    badge: 'Product Inquiry',
    data: {
      fullName: 'Lê Hoàng Phương Thảo',
      email: 'thao.le@viettelpost-logistics.vn',
      phone: '0918765432',
      companyName: 'Viettel Post Logistics miền Trung',
      message:
        'Doanh nghiệp cần tư vấn tích hợp WF-01 & WF-02 (Twilio + Whisper STT) với hệ thống CRM nội bộ để tự động xác nhận đơn hàng và giải đáp cước phí vận chuyển.',
    },
  },
  {
    label: '🤝 Đề xuất Hợp tác',
    badge: 'Partnership',
    data: {
      fullName: 'Nguyễn Hữu Bảo',
      email: 'partner@cloudsolutions.vn',
      phone: '0987654321',
      companyName: 'Cloud Solutions Vietnam',
      message:
        'Chúng tôi muốn trao đổi cơ hội hợp tác triển khai giải pháp Multi-Agent CRM (n8n + PostgreSQL pgvector) cho nhóm khách hàng doanh nghiệp SME tại Đà Nẵng.',
    },
  },
];

// crypto.randomUUID chỉ có trên HTTPS hoặc localhost; mở bằng http://<IP-LAN> sẽ không có.
function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Kiểm tra phía trình duyệt để báo lỗi sớm. Quy tắc quyết định vẫn nằm ở workflow WF-07 (node "02").
function validate(v: Values): Errors {
  const errors: Errors = {};
  const email = v.email.trim();
  const phone = v.phone.trim();
  const digits = phone.replace(/\D/g, '');

  if (email && !EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng.';
  if (phone && (digits.length < 9 || digits.length > 15)) errors.phone = 'Số điện thoại cần từ 9 đến 15 chữ số.';
  if (!email && !phone) errors.contact = 'Vui lòng để lại ít nhất email hoặc số điện thoại để chúng tôi liên hệ.';
  if (!v.message.trim()) errors.message = 'Bạn hãy cho biết nhu cầu của mình.';
  return errors;
}

function mapServerErrors(list: ServerError[]): Errors {
  const errors: Errors = {};
  for (const e of list) {
    const message = e.message || 'Thông tin chưa hợp lệ.';
    if (e.field === 'email' || e.field === 'phone' || e.field === 'message' || e.field === 'contact') {
      errors[e.field] = message;
    } else {
      errors.form = 'Yêu cầu chưa được chấp nhận. Vui lòng kiểm tra lại thông tin.';
    }
  }
  if (!Object.keys(errors).length) errors.form = 'Yêu cầu chưa được chấp nhận. Vui lòng kiểm tra lại thông tin.';
  return errors;
}

export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState(false);

  // Một mã cho mỗi lần mở form: bấm gửi hai lần hoặc mạng chập chờn cũng không tạo hai yêu cầu.
  const submissionId = useRef<string>('');
  useEffect(() => {
    submissionId.current = newSubmissionId();
  }, []);

  const honeypot = useRef<HTMLInputElement>(null);
  const fields = useRef<Partial<Record<ErrorKey, HTMLElement | null>>>({});
  const receiptHeading = useRef<HTMLHeadingElement>(null);

  // khi có receipt thì focus vào trường đầu tiên, có receipt thì focus vào heading để đọc mã tham chiếu.
  useEffect(() => {
    if (receipt) receiptHeading.current?.focus();
  }, [receipt]);

  // Hàm tự động cập nhật giá trị cho từng ô nhập liệu và xóa thông báo lỗi khi người dùng gõ phím.
  const set = (key: keyof Values) => (e: { target: { value: string } }) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key] || errors.contact || errors.form) {
      setErrors((prev) => ({ ...prev, [key]: undefined, contact: undefined, form: undefined }));
    }
  };

  function applySample(sample: Values) {
    setValues(sample);
    setErrors({});
  }

  // Hàm tìm ô nhập liệu bị lỗi đầu tiên và tự động nhảy con trỏ chuột vào ô đó cho người dùng sửa.
  function focusFirstError(next: Errors) {
    const order: ErrorKey[] = ['email', 'phone', 'message'];
    const target = next.contact ? 'email' : order.find((k) => next[k]);
    if (target) fields.current[target]?.focus();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    const local = validate(values);
    if (Object.keys(local).length) {
      setErrors(local);
      focusFirstError(local);
      return;
    }

    setSending(true);
    setErrors({});
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          submissionId: submissionId.current,
          website: honeypot.current?.value ?? '',
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { status?: string; correlationId?: string | null; errors?: ServerError[]; message?: string }
        | null;

      if (res.ok && data && (data.status === 'accepted' || data.status === 'duplicate')) {
        setReceipt({
          reference: (data.correlationId ?? '').slice(0, 8).toUpperCase(),
          duplicate: data.status === 'duplicate',
        });
        setValues(EMPTY);
        return;
      }

      if (res.status === 422) {
        const mapped = mapServerErrors(data?.errors ?? []);
        setErrors(mapped);
        focusFirstError(mapped);
        return;
      }

      setErrors({ form: data?.message || 'Chưa gửi được yêu cầu. Vui lòng thử lại sau ít phút.' });
    } catch {
      setErrors({ form: 'Không kết nối được tới máy chủ. Vui lòng kiểm tra mạng và thử lại.' });
    } finally {
      setSending(false);
    }
  }

  async function copyReference() {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bị chặn: người dùng vẫn có thể bôi đen mã để sao chép */
    }
  }

  function sendAnother() {
    submissionId.current = newSubmissionId();
    setReceipt(null);
    setErrors({});
    setCopied(false);
  }

  if (receipt) {
    return (
      <section
        aria-labelledby="receipt-title"
        className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/50"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-5">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 mb-3">
          <span>{receipt.duplicate ? 'Chống trùng lặp • Đã ghi nhận' : 'WF-07 Webhook Accepted'}</span>
        </div>

        <h2
          id="receipt-title"
          ref={receiptHeading}
          tabIndex={-1}
          className="text-2xl font-extrabold text-slate-900 outline-none"
        >
          {receipt.duplicate ? 'Yêu cầu này đã được ghi nhận trước đó' : 'Chúng tôi đã nhận được yêu cầu của bạn'}
        </h2>

        <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
          Yêu cầu được lưu trữ an toàn vào cơ sở dữ liệu và kích hoạt luồng phân loại tự động của AI. Đội ngũ tư vấn sẽ liên hệ qua email hoặc số điện thoại bạn đã đăng ký. Khi cần tra cứu, vui lòng cung cấp mã tham chiếu bên dưới.
        </p>

        {receipt.reference && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 sm:p-5">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Mã tham chiếu đối soát (Correlation ID)
              </span>
              <output className="mt-1 block font-mono text-2xl font-extrabold tracking-widest text-indigo-700">
                {receipt.reference}
              </output>
            </div>
            <button
              type="button"
              onClick={copyReference}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copied ? 'Đã sao chép mã' : 'Sao chép mã'}</span>
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={sendAnother}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors"
          >
            + Gửi yêu cầu khác
          </button>
          <Link
            href="/sales"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Xem danh sách Lead trên CRM &rarr;
          </Link>
        </div>
      </section>
    );
  }

  const contactErr = errors.contact;

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
      {/* Header & Quick Demo Scenarios */}
      <div className="mb-6 border-b border-slate-100 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Biểu mẫu Tiếp nhận Khách hàng Tiềm năng
            </h2>
            <p className="text-xs text-slate-500">
              Điền thông tin bên dưới hoặc chọn kịch bản mẫu để kiểm thử luồng WF-07.
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-600">
            POST /api/ingest
          </span>
        </div>

        {/* Quick Preset Pills */}
        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              ⚡ Kịch bản mẫu thử nghiệm nhanh:
            </span>
            <button
              type="button"
              onClick={() => {
                setValues(EMPTY);
                setErrors({});
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
            >
              Xóa trống
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SCENARIOS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => applySample(item.data)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/40 transition-all"
              >
                <span>{item.label}</span>
                <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600">
                  {item.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        aria-describedby={errors.form ? 'form-error' : undefined}
        className="space-y-5"
      >
        {errors.form && (
          <div
            id="form-error"
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700"
          >
            <svg className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errors.form}</span>
          </div>
        )}

        {/* Honeypot: người thật không thấy và không focus được; bot điền vào sẽ bị WF-07 từ chối. */}
        <div
          aria-hidden="true"
          className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        >
          <label>
            Website
            <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Họ và tên
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              maxLength={200}
              value={values.fullName}
              onChange={set('fullName')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Công ty / Tổ chức
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              autoComplete="organization"
              placeholder="Công ty CP Công nghệ..."
              maxLength={200}
              value={values.companyName}
              onChange={set('companyName')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <fieldset className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4" aria-describedby="contact-hint">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            Phương thức liên hệ <span className="text-indigo-600">*</span>
          </legend>
          <p
            id="contact-hint"
            role={contactErr ? 'alert' : undefined}
            className={`mb-3 text-xs ${contactErr ? 'font-semibold text-rose-600' : 'text-slate-500'}`}
          >
            {contactErr ?? 'Vui lòng cung cấp ít nhất một trong hai: địa chỉ Email hoặc Số điện thoại.'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-700">
                Email doanh nghiệp
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="lienhe@doanhnghiep.vn"
                maxLength={320}
                ref={(el) => {
                  fields.current.email = el;
                }}
                value={values.email}
                onChange={set('email')}
                aria-invalid={Boolean(errors.email || contactErr)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                  errors.email || contactErr
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:ring-2 focus:ring-rose-100'
                    : 'border-slate-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-slate-700">
                Số điện thoại
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0905 123 456"
                maxLength={40}
                ref={(el) => {
                  fields.current.phone = el;
                }}
                value={values.phone}
                onChange={set('phone')}
                aria-invalid={Boolean(errors.phone || contactErr)}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                  errors.phone || contactErr
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:ring-2 focus:ring-rose-100'
                    : 'border-slate-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              {errors.phone && (
                <p id="phone-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nội dung nhu cầu cần tư vấn <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {values.message.length}/5000 ký tự
            </span>
          </div>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={5000}
            placeholder="Mô tả quy mô đội ngũ, nhu cầu báo giá gói dịch vụ, tích hợp Voice AI hoặc câu hỏi kỹ thuật..."
            ref={(el) => {
              fields.current.message = el;
            }}
            value={values.message}
            onChange={set('message')}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={`w-full rounded-xl border p-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
              errors.message
                ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:ring-2 focus:ring-rose-100'
                : 'border-slate-300 bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
            }`}
          />
          {errors.message && (
            <p id="message-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <p className="text-[11px] text-slate-400">
            Bằng việc gửi yêu cầu, dữ liệu sẽ được xử lý tự động qua n8n Workflow WF-07.
          </p>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-60"
          >
            {sending ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang gửi yêu cầu…</span>
              </>
            ) : (
              <>
                <span>Gửi yêu cầu tư vấn</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
