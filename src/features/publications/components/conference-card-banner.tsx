import { conferenceMilestone, formatConferenceDate, readConference } from '../model/conference';

/** A shared strip above the entire card keeps conference data out of its content layout. */
export function ConferenceCardBanner({ value }: { value: unknown }) {
  const conference = readConference(value);
  if (!conference) return null;
  const milestone = conferenceMilestone(conference);
  return <aside data-card-conference aria-label="Thông tin hội nghị" className="conference-card-banner">
    <div className="conference-card-banner__content">
      <p className="conference-card-banner__name text-xs font-semibold" title={conference.name}>{conference.name}</p>
      <div className="conference-card-banner__metadata">
        {conference.rankings.length > 0 && <div aria-label="Xếp hạng hội nghị" className="conference-card-banner__rankings flex min-w-0 items-center gap-1 overflow-hidden">
          {conference.rankings.slice(0, 2).map(entry => <span key={`${entry.system}:${entry.rank}`} title={`${entry.system}: ${entry.rank}`} className="inline-flex min-w-0 items-center gap-0.5 rounded border border-[#c7dced] bg-white/70 px-1.5 text-xs leading-5"><span className="sr-only">{entry.system}: </span><span aria-hidden="true" className="conference-rank__system min-w-0 truncate">{entry.system}:</span><strong className="conference-rank__value min-w-0 truncate font-semibold">{entry.rank}</strong></span>)}
          {conference.rankings.length > 2 && <span className="shrink-0 text-xs font-semibold" aria-label={`Còn ${conference.rankings.length - 2} xếp hạng, xem đầy đủ trong chi tiết công trình`}>+{conference.rankings.length - 2}</span>}
        </div>}
        <div className="conference-card-banner__dates">
          {conference.eventDate && <span className="conference-card-banner__date"><span className="text-[#476787]">Hội nghị</span><time dateTime={conference.eventDate}>{formatConferenceDate(conference.eventDate)}</time></span>}
          <span className="conference-card-banner__date"><span className="text-[#476787]">{milestone.statusLabel}</span>{milestone.date && <time dateTime={milestone.date}>{formatConferenceDate(milestone.date)}</time>}</span>
        </div>
      </div>
    </div>
  </aside>;
}
