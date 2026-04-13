import React, { useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Scale, ShieldAlert, Lightbulb } from 'lucide-react';

const SECTION_ORDER = [
  'Shrnutí',
  'Srovnání návrhů',
  'Silné stránky',
  'Slabé stránky',
  'Doporučení pro výběr varianty',
  'Limity dat',
];

const cleanDisplayName = (name) =>
  String(name || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\bsheet\s*\d+\b/gi, '')
    .replace(/\bfze\b/gi, 'fáze')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeReportText = (text) =>
  String(text || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const parseSections = (text) => {
  const source = normalizeReportText(text);
  if (!source) return {};

  const lines = source.split('\n');
  const sections = {};
  let current = '';

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const sectionMatch = line.match(/^#\s+(.+)$/);
    if (sectionMatch) {
      current = sectionMatch[1].trim();
      if (!sections[current]) sections[current] = [];
      continue;
    }
    if (current) {
      sections[current].push(line);
    }
  }

  return sections;
};

const getSectionStyle = (title) => {
  if (title === 'Silné stránky') {
    return 'border-emerald-200 bg-emerald-50';
  }
  if (title === 'Slabé stránky') {
    return 'border-amber-200 bg-amber-50';
  }
  if (title === 'Doporučení pro výběr varianty') {
    return 'border-violet-200 bg-violet-50';
  }
  if (title === 'Limity dat') {
    return 'border-slate-200 bg-slate-50';
  }
  return 'border-blue-100 bg-white';
};

const getDecisionHeader = (sections) => {
  const recommendation = sections['Doporučení pro výběr varianty'] || [];
  const lines = recommendation
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-+\s*/, '').trim());

  const fallback = {
    variant: 'Nelze jednoznačně určit',
    reason: 'Doporučení neobsahuje jednoznačného vítěze.',
    tradeoff: lines.find((line) => /^Pokud je prioritou/i.test(line)) || 'Trade-off není v datech jasně popsán.',
  };

  const unresolved = lines.find((line) => /nelze urč/i.test(line));
  if (unresolved) {
    return { ...fallback, reason: unresolved };
  }

  const winnerLine = lines.find((line) => /celkově je vhodnější návrh/i.test(line)) || '';
  const winnerMatch = winnerLine.match(/celkově je vhodnější návrh\s+(.+?)(?:,| protože|$)/i);
  const variant = winnerMatch ? cleanDisplayName(winnerMatch[1]) : fallback.variant;
  const reason = winnerLine || lines[0] || fallback.reason;
  const tradeoff = lines.find((line) => /^Pokud je prioritou/i.test(line)) || fallback.tradeoff;

  return { variant, reason, tradeoff };
};

const formatLine = (line) => line.replace(/^[-•]\s*/, '').trim();

const renderSectionContent = (sectionTitle, lines) => {
  const items = [];
  let key = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^##\s+/.test(line)) {
      const original = line.replace(/^##\s+/, '').trim();
      const cleaned = cleanDisplayName(original);
      items.push(
        <h4
          key={`${sectionTitle}-sub-${key++}`}
          className="text-sm font-semibold text-slate-800 mt-4 first:mt-0 break-words"
          title={original !== cleaned ? original : undefined}
        >
          {cleaned}
        </h4>
      );
      continue;
    }

    if (/^[-•]\s+/.test(line)) {
      items.push(
        <li key={`${sectionTitle}-li-${key++}`} className="text-sm text-slate-700 leading-7">
          {formatLine(line)}
        </li>
      );
      continue;
    }

    items.push(
      <p key={`${sectionTitle}-p-${key++}`} className="text-sm text-slate-700 leading-7">
        {line}
      </p>
    );
  }

  const hasList = items.some((el) => el.type === 'li');
  if (hasList) {
    return <ul className="list-disc pl-5 space-y-2">{items}</ul>;
  }
  return <div className="space-y-3">{items}</div>;
};

const AIReportPanel = ({ reportText }) => {
  const sections = useMemo(() => parseSections(reportText), [reportText]);
  const decision = useMemo(() => getDecisionHeader(sections), [sections]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-300 bg-gradient-to-r from-violet-50 to-blue-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-violet-700 mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide font-semibold text-violet-700">Rozhodovací souhrn</p>
            <p className="text-base font-semibold text-slate-900">
              Doporučená varianta: <span className="text-violet-700">{decision.variant}</span>
            </p>
            <p className="text-sm text-slate-700 leading-6">
              <strong>Hlavní důvod:</strong> {decision.reason}
            </p>
            <p className="text-sm text-slate-700 leading-6">
              <strong>Hlavní trade-off:</strong> {decision.tradeoff}
            </p>
          </div>
        </div>
      </div>

      {SECTION_ORDER.map((title) => {
        const lines = sections[title] || [];
        const icon =
          title === 'Silné stránky' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : title === 'Slabé stránky' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          ) : title === 'Doporučení pro výběr varianty' ? (
            <Scale className="w-4 h-4 text-violet-600" />
          ) : title === 'Limity dat' ? (
            <ShieldAlert className="w-4 h-4 text-slate-600" />
          ) : null;

        return (
          <section key={title} className={`rounded-xl border p-5 ${getSectionStyle(title)}`}>
            <div className="flex items-center gap-2 mb-3">
              {icon}
              <h4 className="text-base font-semibold text-slate-900">{title}</h4>
            </div>
            {renderSectionContent(title, lines)}
          </section>
        );
      })}
    </div>
  );
};

export default AIReportPanel;
