'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import {
  generateBibTeX,
  generateAPA,
  generateIEEE,
  CitationItem,
} from '@/lib/citation';
import {
  Quote,
  Copy,
  Check,
  Download,
  BookOpen,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface CitationModalProps {
  item: CitationItem;
  triggerVariant?: 'button' | 'badge';
}

export function CitationModal({ item, triggerVariant = 'button' }: CitationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bibtex' | 'apa' | 'ieee'>('bibtex');
  const [copied, setCopied] = useState(false);

  const bibtex = generateBibTeX(item);
  const apa = generateAPA(item);
  const ieee = generateIEEE(item);

  const currentContent = activeTab === 'bibtex' ? bibtex : activeTab === 'apa' ? apa : ieee;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadBib = () => {
    const element = document.createElement('a');
    const file = new Blob([bibtex], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${item.slug || 'citation'}.bib`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      {triggerVariant === 'badge' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-[#0F294A] hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          title="Trích dẫn công trình này"
        >
          <Quote className="w-3 h-3" />
          <span>Cite</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#0F294A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Quote className="w-3.5 h-3.5 text-blue-300" />
          <span>Trích dẫn / Cite</span>
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Trích Dẫn Học Thuật (Citation Export)"
        description={`Xuất trích dẫn khoa học cho "${item.title}"`}
      >
        <div className="space-y-4">
          {/* Format Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('bibtex');
                setCopied(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bibtex'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BibTeX (LaTeX)
            </button>
            <button
              onClick={() => {
                setActiveTab('apa');
                setCopied(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'apa'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              APA 7th
            </button>
            <button
              onClick={() => {
                setActiveTab('ieee');
                setCopied(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ieee'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              IEEE
            </button>
          </div>

          {/* Citation Preview Box */}
          <div className="relative">
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-slate-800 shadow-inner">
              <pre className="whitespace-pre-wrap font-mono">{currentContent}</pre>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {activeTab === 'bibtex' && (
              <button
                onClick={handleDownloadBib}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải file .bib</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F294A] hover:bg-[#1A3E6B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-200" />
                    <span>Sao chép {activeTab.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
