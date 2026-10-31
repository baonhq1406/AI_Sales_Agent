'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

type KnowledgeDocument = {
  id: string;
  fileName: string;
  title: string;
  category: string;
  status: string;
  pages: number | null;
  chunkCount: number;
  createdAt: string;
};

type KnowledgeSource = {
  rank: number;
  score: number;
  documentId: string;
  title: string | null;
  fileName: string;
  page: number | null;
  content: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  sources?: KnowledgeSource[];
};

type ApiResponse<T> = {
  data?: T;
  error?: { message?: string | string[] };
  message?: string | string[];
  status?: string;
  answer?: string;
  sources?: KnowledgeSource[];
  documentId?: string;
  pages?: number;
  chunkCount?: number;
};

const CATEGORIES = [
  { value: 'general', label: 'Kiến thức chung' },
  { value: 'product', label: 'Sản phẩm' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'faq', label: 'Câu hỏi thường gặp' },
  { value: 'pricing', label: 'Bảng giá' },
];

const SUGGESTIONS = [
  'Chính sách đổi trả sản phẩm như thế nào?',
  'Sản phẩm có những gói giá nào?',
  'Khách hàng cần điều kiện gì để được bảo hành?',
];

function responseError(payload: ApiResponse<unknown>, fallback: string) {
  const message = payload.error?.message ?? payload.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}

function unwrap<T>(payload: ApiResponse<T>): T | undefined {
  return payload.data;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function KnowledgeBase() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatError, setChatError] = useState('');

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    setDocumentsError('');
    try {
      const response = await fetch('/api/knowledge/documents', {
        cache: 'no-store',
      });
      const payload = (await response.json()) as ApiResponse<KnowledgeDocument[]>;
      if (!response.ok) throw new Error(responseError(payload, 'Không thể tải tài liệu.'));
      setDocuments(unwrap(payload) ?? []);
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : 'Không thể tải tài liệu.');
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  function chooseFile(nextFile?: File) {
    setUploadError('');
    setUploadMessage('');
    if (!nextFile) return;
    if (
      nextFile.size > 10 * 1024 * 1024 ||
      (!nextFile.name.toLowerCase().endsWith('.pdf') &&
        nextFile.type !== 'application/pdf')
    ) {
      setFile(null);
      setUploadError('Chỉ nhận file PDF có dung lượng tối đa 10 MB.');
      return;
    }
    setFile(nextFile);
    if (!title.trim()) setTitle(nextFile.name.replace(/\.pdf$/i, ''));
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setUploadError('');
    setUploadMessage('');

    const form = new FormData();
    form.append('file', file);
    form.append('title', title.trim());
    form.append('category', uploadCategory);
    try {
      const response = await fetch('/api/knowledge/documents', {
        method: 'POST',
        body: form,
      });
      const payload = (await response.json()) as ApiResponse<unknown>;
      if (!response.ok) {
        throw new Error(responseError(payload, 'Không thể nạp tài liệu.'));
      }
      if (payload.status === 'indexed') {
        setUploadMessage(
          `Đã lập chỉ mục ${payload.pages ?? 0} trang thành ${payload.chunkCount ?? 0} đoạn kiến thức.`,
        );
      } else if (payload.status === 'duplicate') {
        setUploadMessage('Tài liệu này đã có trong kho tri thức.');
      } else {
        setUploadMessage('WF-09 đã tiếp nhận tài liệu.');
      }
      setFile(null);
      setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      await loadDocuments();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Không thể nạp tài liệu.');
    } finally {
      setUploading(false);
    }
  }

  async function askQuestion(question: string) {
    const cleanQuestion = question.trim();
    if (cleanQuestion.length < 2 || asking) return;
    setQuery('');
    setChatError('');
    setMessages((current) => [...current, { role: 'user', text: cleanQuestion }]);
    setAsking(true);
    try {
      const response = await fetch('/api/knowledge/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQuestion,
          category: searchCategory || undefined,
          topK: 5,
        }),
      });
      const payload = (await response.json()) as ApiResponse<{
        answer: string;
        sources: KnowledgeSource[];
      }>;
      if (!response.ok) throw new Error(responseError(payload, 'Không thể trả lời câu hỏi.'));
      const result = unwrap(payload);
      const answer = result?.answer ?? payload.answer;
      if (!answer) throw new Error('Dịch vụ hỏi đáp không trả về câu trả lời.');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: answer,
          sources: result?.sources ?? payload.sources ?? [],
        },
      ]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Không thể hỏi kho tri thức.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-6 text-white shadow-xl sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-indigo-100 ring-1 ring-white/15">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            WF-09 · RAG Knowledge Base
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Kho tri thức doanh nghiệp
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
            Nạp tài liệu PDF để AI bóc tách, lập chỉ mục và trả lời dựa trên nguồn
            của bạn — kèm tên tài liệu và số trang tham khảo.
          </p>
        </div>
        <div className="mt-6 grid max-w-3xl grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">{documents.length}</p>
            <p className="mt-1 text-xs text-indigo-100">Tài liệu</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">
              {documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0)}
            </p>
            <p className="mt-1 text-xs text-indigo-100">Đoạn tri thức</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-black">PDF</p>
            <p className="mt-1 text-xs text-indigo-100">Tối đa 10 MB</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <div className="mb-4">
              <h3 className="text-base font-black text-slate-900">Thêm tài liệu</h3>
              <p className="mt-1 text-sm text-slate-500">
                WF-09 tự đọc PDF có văn bản. PDF scan cần OCR trước.
              </p>
            </div>
            <form onSubmit={uploadDocument} className="space-y-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  chooseFile(event.dataTransfer.files?.[0]);
                }}
                className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
              >
                <span className="text-3xl">📚</span>
                <span className="mt-2 text-sm font-bold text-slate-700">
                  {file ? file.name : 'Chọn hoặc kéo thả file PDF vào đây'}
                </span>
                <span className="mt-1 text-xs text-slate-500">PDF · tối đa 10 MB</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              <label className="block text-xs font-bold text-slate-600">
                Tên hiển thị
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  placeholder="Ví dụ: Chính sách đổi trả 2026"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Nhóm kiến thức
                <select
                  value={uploadCategory}
                  onChange={(event) => setUploadCategory(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              {uploadError && (
                <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {uploadError}
                </p>
              )}
              {uploadMessage && (
                <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  {uploadMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? 'Đang bóc tách và lập chỉ mục…' : 'Nạp vào kho tri thức'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Tài liệu đã nạp</h3>
                <p className="mt-1 text-xs text-slate-500">Tối đa 100 tài liệu gần nhất</p>
              </div>
              <button
                type="button"
                onClick={() => void loadDocuments()}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Làm mới
              </button>
            </div>
            {documentsError && (
              <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {documentsError}
              </p>
            )}
            {documentsLoading ? (
              <p className="py-5 text-center text-sm text-slate-500">Đang tải danh sách…</p>
            ) : documents.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Chưa có tài liệu. Nạp PDF để bắt đầu xây dựng kho tri thức.
              </p>
            ) : (
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {documents.map((document) => (
                  <li key={document.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{document.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {document.fileName} · {document.chunkCount} đoạn
                        {document.pages ? ` · ${document.pages} trang` : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDate(document.createdAt)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                        document.status === 'ready'
                          ? 'bg-emerald-50 text-emerald-700'
                          : document.status === 'processing'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {document.status === 'ready'
                        ? 'Sẵn sàng'
                        : document.status === 'processing'
                          ? 'Đang xử lý'
                          : document.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Hỏi đáp kho tri thức</h3>
              <p className="mt-1 text-sm text-slate-500">
                Câu trả lời được tổng hợp từ tài liệu liên quan, có dẫn nguồn.
              </p>
            </div>
            <label className="text-xs font-bold text-slate-600">
              Lọc theo nhóm
              <select
                value={searchCategory}
                onChange={(event) => setSearchCategory(event.target.value)}
                className="ml-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-normal"
              >
                <option value="">Tất cả nhóm</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-5">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                <span className="text-4xl">💬</span>
                <h4 className="mt-3 text-sm font-black text-slate-800">
                  Hỏi về chính tài liệu của bạn
                </h4>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  AI tìm đoạn liên quan trong pgvector, sau đó tổng hợp câu trả lời
                  và đính kèm trích dẫn.
                </p>
                <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      disabled={asking}
                      onClick={() => void askQuestion(suggestion)}
                      className="rounded-full border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                    {!!message.sources?.length && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                          Nguồn tham khảo
                        </p>
                        <div className="space-y-2">
                          {message.sources.map((source, sourceIndex) => (
                            <details
                              key={`${source.documentId}-${source.rank}-${sourceIndex}`}
                              className="rounded-lg bg-slate-50 p-2.5"
                            >
                              <summary className="cursor-pointer text-xs font-bold text-indigo-700">
                                [{source.rank}] {source.title || source.fileName}
                                {source.page ? ` · trang ${source.page}` : ''}
                                {Number.isFinite(source.score)
                                  ? ` · độ liên quan ${Math.round(source.score * 100)}%`
                                  : ''}
                              </summary>
                              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                                {source.content}
                              </p>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {asking && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                  Đang tìm nguồn và tổng hợp câu trả lời…
                </div>
              </div>
            )}
          </div>

          {chatError && (
            <p role="alert" className="mx-4 mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {chatError}
            </p>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void askQuestion(query);
            }}
            className="flex gap-2 border-t border-slate-100 p-4"
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={1000}
              placeholder="Nhập câu hỏi về tài liệu…"
              aria-label="Câu hỏi cho kho tri thức"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={asking || query.trim().length < 2}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hỏi AI
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
