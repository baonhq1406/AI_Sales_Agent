'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import styles from './contact.module.css';

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
    if (errors[key] || errors.contact || errors.form) setErrors((prev) => ({ ...prev, [key]: undefined, contact: undefined, form: undefined }));
  };

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
      <section className={styles.receipt} aria-labelledby="receipt-title">
        <h2 id="receipt-title" ref={receiptHeading} tabIndex={-1} className={styles.receiptTitle}>
          {receipt.duplicate ? 'Yêu cầu này đã được ghi nhận trước đó' : 'Chúng tôi đã nhận được yêu cầu của bạn'}
        </h2>
        <p className={styles.receiptText}>
          Yêu cầu được lưu lại và phân loại tự động. Đội ngũ sẽ liên hệ qua email hoặc số điện thoại bạn đã để lại.
          Khi cần hỏi lại, hãy cung cấp mã tham chiếu bên dưới.
        </p>
        {receipt.reference && (
          <div className={styles.refRow}>
            <span className={styles.refLabel}>Mã tham chiếu</span>
            <output className={styles.refCode}>{receipt.reference}</output>
            <button type="button" className={styles.ghostButton} onClick={copyReference}>
              {copied ? 'Đã sao chép' : 'Sao chép mã'}
            </button>
          </div>
        )}
        <button type="button" className={styles.ghostButton} onClick={sendAnother}>
          Gửi yêu cầu khác
        </button>
      </section>
    );
  }

  const contactErr = errors.contact;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-describedby={errors.form ? 'form-error' : undefined}>
      {errors.form && (
        <p id="form-error" className={styles.formError} role="alert">
          {errors.form}
        </p>
      )}

      {/* Honeypot: người thật không thấy và không focus được; bot điền vào sẽ bị WF-07 từ chối. */}
      <div className={styles.trap} aria-hidden="true">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className={styles.field}>
        <label htmlFor="fullName">Họ và tên</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={200}
          value={values.fullName}
          onChange={set('fullName')}
        />
      </div>

      <fieldset className={styles.pair} aria-describedby="contact-hint">
        <legend className={styles.legend}>Cách liên hệ</legend>
        <p id="contact-hint" className={contactErr ? styles.hintError : styles.hint} role={contactErr ? 'alert' : undefined}>
          {contactErr ?? 'Cần ít nhất một trong hai: email hoặc số điện thoại.'}
        </p>
        <div className={styles.pairGrid}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={320}
              ref={(el) => {
                fields.current.email = el;
              }}
              value={values.email}
              onChange={set('email')}
              aria-invalid={Boolean(errors.email || contactErr)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className={styles.error} role="alert">
                {errors.email}
              </p>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="phone">Số điện thoại</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={40}
              ref={(el) => {
                fields.current.phone = el;
              }}
              value={values.phone}
              onChange={set('phone')}
              aria-invalid={Boolean(errors.phone || contactErr)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className={styles.error} role="alert">
                {errors.phone}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="companyName">Công ty / tổ chức</label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          autoComplete="organization"
          maxLength={200}
          value={values.companyName}
          onChange={set('companyName')}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="message">Bạn cần chúng tôi hỗ trợ điều gì?</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={5000}
          ref={(el) => {
            fields.current.message = el;
          }}
          value={values.message}
          onChange={set('message')}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <p id="message-error" className={styles.error} role="alert">
            {errors.message}
          </p>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={sending}>
        {sending ? 'Đang gửi…' : 'Gửi yêu cầu'}
      </button>
    </form>
  );
}
