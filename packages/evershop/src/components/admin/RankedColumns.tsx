import React from 'react';

type Item = {
  key: string;
  label: string;
  value: number;
  note?: string;
  href?: string;
  monogram?: string;
};

export function RankedColumns({
  items,
  label,
  unit,
  formatValue = (value) => value.toLocaleString('en-IN'),
  formatAxis = formatValue
}: {
  items: Item[];
  label: string;
  unit: string;
  formatValue?: (value: number) => string;
  formatAxis?: (value: number) => string;
}) {
  if (!items.length) return null;
  const maximum = Math.max(1, ...items.map((item) => item.value));
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  const ceiling = Math.ceil(maximum / magnitude) * magnitude;
  return (
    <div className="ranked-columns" role="group" aria-label={label}>
      <div className="ranked-column-axis" aria-hidden="true">
        {[ceiling, ceiling / 2, 0].map((value) => (
          <span key={value}>{formatAxis(value)}</span>
        ))}
      </div>
      <ol
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`
        }}
      >
        {items.map((item, index) => {
          const contents = (
            <>
              <span className="ranked-column-track" aria-hidden="true">
                <span
                  className={`ranked-column-fill column-tone-${Math.min(
                    index,
                    3
                  )}`}
                  style={{ height: `${(item.value / ceiling) * 100}%` }}
                >
                  <span>{formatValue(item.value)}</span>
                </span>
              </span>
              <span className="ranked-column-label">
                {item.monogram && <i>{item.monogram}</i>}
                <strong>{item.label}</strong>
                {item.note && <small>{item.note}</small>}
              </span>
            </>
          );
          const description = `${item.label}: ${formatValue(
            item.value
          )} ${unit}${item.note ? `, ${item.note}` : ''}`;
          return (
            <li key={item.key}>
              {item.href ? (
                <a
                  href={item.href}
                  aria-label={description}
                  title={description}
                >
                  {contents}
                </a>
              ) : (
                <div role="img" aria-label={description}>
                  {contents}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
