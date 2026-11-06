'use client';
import { useI18n } from '@/shared/i18n/provider';


import {
CitationItem,
generateAPA,
generateBibTeX,
generateIEEE,
} from '@/features/publications/model/citation';
import { Modal } from '@/shared/ui/modal';
import { notifySuccess } from '@/shared/dialogs/success';
import {
Copy,
Quote,
Download,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { extractDoi } from '../model/doi';
import { readConference } from '../model/conference';

interface CitationModalProps {
  item: CitationItem;
  triggerVariant?: 'button' | 'badge' | 'icon' | 'resource';
  className?: string;
}

export function CitationModal({ item, triggerVariant = 'button', className }: CitationModalProps) {
  const { t: tr } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bibtex' | 'apa' | 'ieee'>('bibtex');
  const [copyError, setCopyError] = useState('');

  const doi = extractDoi(readConference(item.conference)?.paperUrl ?? '');
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [sourceError, setSourceError] = useState('');
  const [retry, setRetry] = useState(0);
  const key = `${doi}:${activeTab}`;
  const waiting = !!doi && !resolved[key];
  useEffect(() => {
    if (!isOpen || !doi || resolved[key]) return;
    const controller = new AbortController();
    setSourceError('');
    void fetch(`/api/citation?${new URLSearchParams({ doi, style: activeTab })}`, { signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok || typeof result.citation !== 'string') throw new Error('Citation unavailable');
      if (!controller.signal.aborted) setResolved(current => ({ ...current, [key]: result.citation }));
    }).catch(() => { if (!controller.signal.aborted) setSourceError('Chưa tải được trích dẫn DOI.'); });
    return () => controller.abort();
  }, [isOpen, doi, key, activeTab, resolved, retry]);

  const bibtex = resolved[`${doi}:bibtex`] || generateBibTeX(item);
  const apa = generateAPA(item);
  const ieee = generateIEEE(item);

  const currentContent = resolved[key] || (activeTab === 'bibtex' ? bibtex : activeTab === 'apa' ? apa : ieee);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopyError('');
      await notifySuccess(`Đã sao chép trích dẫn ${activeTab.toUpperCase()}.`);
    } catch {
      setCopyError('Không sao chép được trích dẫn. Vui lòng thử lại.');
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
    URL.revokeObjectURL(element.href);
  };

  if (item.citationEnabled === false) return null;

  return (
    <>
      {(triggerVariant === 'icon' || triggerVariant === 'resource') ? (
        <button type="button" onClick={() => setIsOpen(true)} aria-label={tr("Trích dẫn công trình (Cite)")} title={tr("Trích dẫn công trình (Cite)")}
          className={triggerVariant === 'resource' ? 'action-secondary-detail min-h-11 flex-1' : "publication-cite inline-flex min-h-11 shrink-0 sm:min-h-8 items-center justify-center gap-1.5 rounded-lg border border-[#153D67] bg-white px-2 py-1 text-xs font-semibold text-[#153D67] transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67] focus-visible:ring-offset-2"}>
          <Quote aria-hidden="true" className="h-3.5 w-3.5" /><span>Cite</span>
        </button>
      ) : triggerVariant === 'badge' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 px-2.5 py-1 rounded-lg sm:min-h-0 text-xs font-semibold text-[#1F2937] bg-[#FFFFFF] hover:bg-[#153D67] hover:text-white transition-all cursor-pointer border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/20"
          title={tr("Trích dẫn công trình này")}
        >
          <span>Cite</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={
            className ||
            'h-11 px-4 rounded-xl bg-brand-button hover:brightness-110 text-white text-sm font-semibold transition-all shadow-xs border border-transparent cursor-pointer inline-flex items-center justify-center gap-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#153D67]/20'
          }
        >
          <span>{tr("Trích dẫn khoa học (Cite)")}</span>
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={tr("Trích dẫn")}
      >
        <div className="space-y-4">
          {/* Format Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#FFFFFF] rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('bibtex');
                setCopyError('');
              }}
              className={`min-h-11 min-w-0 flex-1 py-1.5 px-2 rounded-lg sm:min-h-0 sm:px-3 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'bibtex'
                  ? 'bg-white text-[#1F2937] shadow-2xs font-semibold'
                  : 'text-[#1F2937] hover:text-[#1F2937]'
              }`}
            >
              BibTeX
            </button>
            <button
              onClick={() => {
                setActiveTab('apa');
                setCopyError('');
              }}
              className={`min-h-11 min-w-0 flex-1 py-1.5 px-2 rounded-lg sm:min-h-0 sm:px-3 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'apa'
                  ? 'bg-white text-[#1F2937] shadow-2xs font-semibold'
                  : 'text-[#1F2937] hover:text-[#1F2937]'
              }`}
            >
              APA 7th
            </button>
            <button
              onClick={() => {
                setActiveTab('ieee');
                setCopyError('');
              }}
              className={`min-h-11 min-w-0 flex-1 py-1.5 px-2 rounded-lg sm:min-h-0 sm:px-3 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ieee'
                  ? 'bg-white text-[#1F2937] shadow-2xs font-semibold'
                  : 'text-[#1F2937] hover:text-[#1F2937]'
              }`}
            >
              IEEE
            </button>
          </div>

          {/* Citation Preview Box */}
          <div className="relative">
            <div className="p-4 bg-[#153D67] text-[#FFFFFF] rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-64 border border-slate-200 shadow-inner">
              <pre className="text-left whitespace-pre-wrap font-mono">{waiting ? tr(sourceError || "Đang tải trích dẫn…") : currentContent}</pre>
            </div>
          </div>

          {sourceError && waiting && <div className="flex items-center justify-between gap-3 text-sm"><p role="alert" className="text-rose-700">{tr(sourceError)}</p><button type="button" className="action-secondary-detail" onClick={() => setRetry(value => value + 1)}>{tr('Thử lại')}</button></div>}
          {/* Action Footer */}
          <div className="modal-footer">
            {activeTab === 'bibtex' && (
              <button
                disabled={waiting}
                onClick={handleDownloadBib}
                className="action-secondary-detail"
              >
                <Download aria-hidden="true" className="w-3.5 h-3.5 text-[#1F2937]" />
                <span>{tr("Tải file .bib")}</span>
              </button>
            )}

            {copyError && <p role="alert" className="text-sm text-rose-800">{tr(copyError)}</p>}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="action-secondary-detail"
              >{tr("Đóng")}</button>
              <button
                disabled={waiting}
                onClick={handleCopy}
                className="action-primary-detail"
              >
                <Copy aria-hidden="true" className="w-3.5 h-3.5 text-white/80" />
                <span>{tr("Sao chép") + " "}{activeTab.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
