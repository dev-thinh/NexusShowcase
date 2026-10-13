'use client';

import { useState } from 'react';
import { Send, MessageSquare, CheckCircle2 } from 'lucide-react';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-5 h-5 text-[#0F294A]" />
        <h2 className="text-lg font-bold text-slate-900">
          Gửi Tin Nhắn Kết Nối
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        Vui lòng điền thông tin để gửi tin nhắn trực tiếp đến Ban Chủ nhiệm CLB Nexus.
      </p>

      {submitted ? (
        <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-emerald-900">
            Tin nhắn đã được gửi thành công!
          </h3>
          <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
            Cảm ơn bạn đã liên hệ. Ban Điều Hành CLB Nexus sẽ phản hồi qua email của bạn trong thời gian sớm nhất.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
          >
            Gửi tin nhắn khác
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
              Họ và tên
            </label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              placeholder="example@student.hcmus.edu.vn"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
              Đơn vị / Lớp / Doanh nghiệp
            </label>
            <input
              type="text"
              placeholder="Khoa CNTT - Khóa 2022 / Doanh nghiệp đối tác"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
              Chủ đề
            </label>
            <input
              type="text"
              required
              placeholder="Hợp tác nghiên cứu / Đóng góp đề tài..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 tracking-wider mb-1.5">
              Nội dung trao đổi
            </label>
            <textarea
              rows={4}
              required
              placeholder="Mô tả chi tiết nội dung bạn muốn trao đổi cùng CLB Nexus..."
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F294A] transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#0F294A] hover:bg-[#1E3A5F] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Gửi lời nhắn</span>
          </button>
        </form>
      )}
    </div>
  );
}
