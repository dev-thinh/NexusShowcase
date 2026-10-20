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
  Copy,
  Check,
  Download,
} from 'lucide-react';

interface CitationModalProps {
  item: CitationItem;
  triggerVariant?: 'button' | 'badge';
  className?: string;
}

export function CitationModal({ item, triggerVariant = 'button', className }: CitationModalProps) {
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
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-[#0F294A] hover:text-white transition-all cursor-pointer border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/20"
          title="Trích dẫn công trình này"
        >
          <span>Cite</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={
            className ||
            'h-11 px-4 rounded-xl bg-brand-button hover:brightness-110 text-white text-sm font-semibold transition-all shadow-xs border border-transparent cursor-pointer inline-flex items-center justify-center gap-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F294A]/20'
          }
        >
          <span>Trích dẫn khoa học (Cite)</span>
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
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('bibtex');
                setCopied(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'bibtex'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
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
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'apa'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
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
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ieee'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              IEEE
            </button>
          </div>

          {/* Citation Preview Box */}
          <div className="relative">
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-slate-800 shadow-inner">
              <pre className="text-left whitespace-pre-wrap font-mono">{currentContent}</pre>
            </div>
          </div>

          {/* Action Footer */}
          <div className="modal-footer">
            {activeTab === 'bibtex' && (
              <button
                onClick={handleDownloadBib}
                className="action-secondary-detail"
              >
                <Download aria-hidden="true" className="w-3.5 h-3.5 text-slate-500" />
                <span>Tải file .bib</span>
              </button>
            )}

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="action-secondary-detail"
              >
                Đóng
              </button>
              <button
                onClick={handleCopy}
                className="action-primary-detail"
              >
                {copied ? (
                  <>
                    <Check aria-hidden="true" className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy aria-hidden="true" className="w-3.5 h-3.5 text-white/80" />
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
