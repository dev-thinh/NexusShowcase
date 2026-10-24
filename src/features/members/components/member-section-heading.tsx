export function MemberSectionHeading({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xl font-semibold text-[#1F2937]">{title}</h2>
      <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-[#1F2937]">
        {count}
      </span>
    </div>
  );
}
