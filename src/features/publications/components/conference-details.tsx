import { conferenceMilestone, formatConferenceDate, readConference } from '../model/conference';

export function ConferenceDetails({ value }: { value: unknown }) {
  const conference = readConference(value);
  if (!conference) return null;
  const milestone = conferenceMilestone(conference);
  return <section aria-label="Thông tin hội nghị" className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-slate-500">Thông tin hội nghị</h2><span className="rounded border border-[#153D67]/15 bg-white px-2 py-1 text-xs font-semibold text-[#153D67]">{milestone.statusLabel}</span></div>
    <p className="mt-2 break-words text-base font-semibold leading-7 text-[#153D67]">{conference.name}</p>
    {(conference.eventDate || milestone.date) && <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      {conference.eventDate && <div><dt className="text-slate-500">Ngày diễn ra hội nghị</dt><dd className="mt-1 font-semibold"><time dateTime={conference.eventDate}>{formatConferenceDate(conference.eventDate)}</time></dd></div>}
      {milestone.date && <div><dt className="text-slate-500">{milestone.dateLabel}</dt><dd className="mt-1 font-semibold"><time dateTime={milestone.date}>{formatConferenceDate(milestone.date)}</time></dd></div>}
    </dl>}
    {conference.rankings.length > 0 && <div className="mt-4">
      <h3 className="text-xs font-semibold text-slate-500">Xếp hạng hội nghị</h3>
      <ul className="mt-2 flex flex-wrap gap-2">{conference.rankings.map(entry => <li key={`${entry.system}:${entry.rank}`} className="max-w-full break-words rounded-md border border-[#153D67]/15 bg-white px-2.5 py-1 text-xs leading-5 text-[#153D67]"><span>{entry.system}</span><span aria-hidden="true"> · </span><strong className="font-semibold">{entry.rank}</strong></li>)}</ul>
    </div>}
  </section>;
}
