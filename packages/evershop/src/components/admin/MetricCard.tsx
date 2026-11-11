import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export function MetricCard({
  label,
  value,
  note,
  icon,
  href,
  tone = 'slate',
  children
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  icon: React.ReactNode;
  href?: string;
  tone?: string;
  children?: React.ReactNode;
}) {
  const content = (
    <>
      <div className="metric-card-heading">
        <span>{label}</span>
        <span className="metric-card-icon">{icon}</span>
      </div>
      <div className="metric-card-value">
        {value}
        {href && <ArrowUpRight size={16} aria-hidden="true" />}
      </div>
      <div className="metric-card-foot">
        <span>{note}</span>
        {children}
      </div>
    </>
  );
  return href ? (
    <a className={`metric-card metric-${tone}`} href={href}>
      {content}
    </a>
  ) : (
    <div className={`metric-card metric-${tone}`}>{content}</div>
  );
}
