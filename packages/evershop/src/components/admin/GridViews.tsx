import React from 'react';
import { X, Rows3 } from 'lucide-react';

type Filter = { key: string; value: string };
type View = { label: string; value?: string };

/** Quick views use the same URL filters as the native grid controls. */
export function GridViews({
  baseUrl,
  filterKey,
  views,
  currentFilters,
  total,
  unit,
  selected = 0,
  onClearSelection
}: {
  baseUrl: string;
  filterKey: string;
  views: View[];
  currentFilters: Filter[];
  total: number;
  unit: string;
  selected?: number;
  onClearSelection?: () => void;
}) {
  const active = currentFilters.find(
    (filter) => filter.key === filterKey
  )?.value;
  const sorts = baseUrl.endsWith('/orders')
    ? [
        ['created_at:desc', 'Newest first'],
        ['created_at:asc', 'Oldest first'],
        ['total:desc', 'Highest total']
      ]
    : baseUrl.endsWith('/products')
    ? [
        ['created_at:desc', 'Newest first'],
        ['name:asc', 'Name A–Z'],
        ['qty:asc', 'Lowest stock'],
        ['price:asc', 'Lowest price']
      ]
    : [
        ['created_at:desc', 'Newest first'],
        ['full_name:asc', 'Name A–Z'],
        ['email:asc', 'Email A–Z']
      ];
  const orderBy = currentFilters.find((f) => f.key === 'ob')?.value;
  const currentSort = orderBy
    ? `${orderBy}:${
        currentFilters.find((f) => f.key === 'od')?.value || 'desc'
      }`
    : '';
  return (
    <>
      <DirectoryHeading
        title={
          unit === 'Orders'
            ? 'Order history'
            : unit === 'Products'
            ? 'Product catalog'
            : 'Customer directory'
        }
        total={total}
        unit={unit.toLowerCase()}
      />
      <div className="grid-views-bar">
        <nav className="grid-views" aria-label={`${unit} views`}>
          {views.map(({ label, value }) => {
            const params = new URLSearchParams();
            currentFilters.forEach((filter) => {
              if (![filterKey, 'page'].includes(filter.key))
                params.set(filter.key, filter.value);
            });
            if (value !== undefined) params.set(filterKey, value);
            return (
              <a
                key={label}
                href={`${baseUrl}${params.size ? `?${params}` : ''}`}
                aria-current={active === value ? 'page' : undefined}
              >
                {label}
              </a>
            );
          })}
        </nav>
        <div className="grid-results" aria-live="polite">
          {selected > 0 && (
            <button
              type="button"
              className="grid-selection"
              onClick={onClearSelection}
            >
              {selected} selected <X size={13} aria-hidden="true" />
              <span className="sr-only">Clear selection</span>
            </button>
          )}

          <label className="grid-sort">
            <span className="sr-only">Sort {unit.toLowerCase()}</span>
            <select
              aria-label={`Sort ${unit.toLowerCase()}`}
              value={currentSort}
              onChange={(event) => {
                const [key, direction] = event.target.value.split(':');
                const url = new URL(window.location.href);
                url.searchParams.set('ob', key);
                url.searchParams.set('od', direction);
                url.searchParams.delete('page');
                window.location.href = url.toString();
              }}
            >
              {!currentSort && (
                <option value="" disabled>
                  Sort by
                </option>
              )}
              {currentSort &&
                !sorts.some(([value]) => value === currentSort) && (
                  <option value={currentSort}>Custom sort</option>
                )}
              {sorts.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {currentFilters.some(
        (filter) =>
          ![filterKey, 'limit', 'page', 'ob', 'od'].includes(filter.key)
      ) && (
        <div className="grid-filter-summary" aria-label="Applied filters">
          <span>Filtered by</span>
          {currentFilters
            .filter(
              (filter) =>
                ![filterKey, 'limit', 'page', 'ob', 'od'].includes(filter.key)
            )
            .map((filter) => {
              const params = new URLSearchParams();
              currentFilters.forEach((item) => {
                if (![filter.key, 'page'].includes(item.key))
                  params.set(item.key, item.value);
              });
              const label =
                filter.key === 'keyword'
                  ? 'Search'
                  : filter.key.replaceAll('_', ' ');
              return (
                <a
                  key={filter.key}
                  href={`${baseUrl}?${params}`}
                  aria-label={`Remove ${label} filter`}
                >
                  {label}: {filter.value.replaceAll('_', ' ')}{' '}
                  <X size={12} aria-hidden="true" />
                </a>
              );
            })}
        </div>
      )}
    </>
  );
}

export function DirectoryHeading({
  title,
  total,
  unit = 'records'
}: {
  title: string;
  total: number;
  unit?: string;
}) {
  return (
    <div className="directory-heading">
      <div>
        <Rows3 size={16} />
        <h2>{title}</h2>
        <span aria-live="polite">
          {total.toLocaleString()} {unit}
        </span>
      </div>
    </div>
  );
}
