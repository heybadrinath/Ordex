import { attributeSwatches as swatches } from './attributeSwatches.js';
import React, { useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import {
  InsightPanel,
  InsightState,
  RankedBars,
  useInsights
} from './WorkspaceInsights.js';

type Category = {
  uuid: string;
  id: number;
  name: string;
  status: boolean;
  products: number;
  image?: string;
  images: string[];
};
export function CategoryInsights({ url }: { url: string }) {
  const { data, error } = useInsights<{ categories: Category[] }>(
    url,
    'categories'
  );
  const [page, setPage] = useState(0);
  if (!data) return <InsightState error={error} />;
  const total = data.categories.reduce((n, c) => n + c.products, 0);
  return (
    <InsightPanel
      title="Your category landscape"
      description={`${data.categories.length} categories · ${total} active SKUs · browse a category to edit it`}
      icon={<Layers size={15} />}
      className="category-landscape"
      action={
        <div className="insight-pager">
          <span>
            {page + 1} / {Math.max(1, Math.ceil(data.categories.length / 4))}
          </span>
          <button
            type="button"
            aria-label="Previous categories"
            disabled={!page}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Next categories"
            disabled={(page + 1) * 4 >= data.categories.length}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      }
    >
      <div className="category-preview-grid">
        {data.categories.slice(page * 4, page * 4 + 4).map((c) => (
          <a
            href={`/admin/categories/edit/${c.uuid}`}
            key={c.uuid}
            className="category-preview"
          >
            <div className="category-preview-image">
              {c.image || c.images[0] ? (
                <img src={c.image || c.images[0]} alt="" />
              ) : (
                <Layers size={30} />
              )}
              <span>{c.status ? 'Active' : 'Hidden'}</span>
            </div>
            <div className="category-preview-copy">
              <h3>{c.name}</h3>
              <ArrowUpRight size={14} />
              <p>
                {c.products} active SKUs{' '}
                <span>
                  {total ? Math.round((c.products / total) * 100) : 0}% of
                  assortment
                </span>
              </p>
              <div className="rank-track">
                <span
                  style={{
                    width: `${total ? (c.products / total) * 100 : 0}%`,
                    background: '#8dafc4'
                  }}
                />
              </div>
            </div>
          </a>
        ))}
      </div>
    </InsightPanel>
  );
}

type Collection = {
  uuid: string;
  name: string;
  code: string;
  products: number;
  images: string[];
};
export function CollectionInsights({ url }: { url: string }) {
  const { data, error } = useInsights<{ collections: Collection[] }>(
    url,
    'collections'
  );
  const [index, setIndex] = useState(0);
  if (!data) return <InsightState error={error} />;
  const selected = data.collections[index];
  return (
    <div className="workspace-insights collection-insights">
      <InsightPanel
        title="Collection size"
        description="Active SKUs in your largest collections"
        icon={<Layers size={15} />}
      >
        <RankedBars
          items={data.collections.slice(0, 5).map((c) => ({
            key: c.uuid,
            label: c.name,
            value: c.products,
            href: `/admin/collections/edit/${c.uuid}`
          }))}
          unit="active SKUs"
        />
      </InsightPanel>
      <InsightPanel
        title="Merchandising preview"
        description="Browse the product mix in each collection"
        action={
          <div className="insight-pager">
            <span>
              {index + 1} / {data.collections.length}
            </span>
            <button
              type="button"
              aria-label="Previous collection preview"
              disabled={!index}
              onClick={() => setIndex((i) => i - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              aria-label="Next collection preview"
              disabled={index + 1 >= data.collections.length}
              onClick={() => setIndex((i) => i + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        }
      >
        {selected && (
          <a
            className="collection-preview-card"
            href={`/admin/collections/edit/${selected.uuid}`}
          >
            <div className="collection-contact-sheet">
              {selected.images.length ? (
                selected.images.map((src, i) => (
                  <span key={`${src}-${i}`}>
                    <img src={src} alt="" />
                  </span>
                ))
              ) : (
                <div className="insight-empty">
                  <Layers size={28} />
                  <span>No products in this collection yet</span>
                </div>
              )}
            </div>
            <div className="collection-preview-meta">
              <span>
                <h3>{selected.name}</h3>
                <small>
                  {selected.code} · {selected.products} active SKUs
                </small>
              </span>
              <span className="insight-round-arrow">
                <ArrowUpRight size={17} />
              </span>
            </div>
          </a>
        )}
      </InsightPanel>
    </div>
  );
}

type Attribute = {
  uuid: string;
  name: string;
  code: string;
  type: string;
  products: number;
  filterable: number;
  options: { id: number; text: string }[];
};
export function AttributeInsights({ url }: { url: string }) {
  const { data, error } = useInsights<{ attributes: Attribute[] }>(
    url,
    'attributes'
  );
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  if (!data) return <InsightState error={error} />;
  const item = data.attributes[active];
  if (!item) return null;
  return (
    <div className="workspace-insights attribute-insights">
      <InsightPanel
        title="Product options"
        description="An overview of the details used across your catalog"
        icon={<Layers size={15} />}
      >
        <div className="attribute-option-cards">
          {data.attributes.map((a, i) => (
            <button
              type="button"
              key={a.uuid}
              aria-pressed={active === i}
              onClick={() => {
                setActive(i);
                setSelected([]);
              }}
              className="attribute-option-card"
            >
              <div>
                <strong>{a.name}</strong>
                <span>{a.type}</span>
              </div>
              <div className="option-swatch-row">
                {a.options
                  .slice(0, 7)
                  .map((o) =>
                    swatches[o.text.toLowerCase()] ? (
                      <i
                        title={o.text}
                        key={o.id}
                        style={{ background: swatches[o.text.toLowerCase()] }}
                      />
                    ) : (
                      <b key={o.id}>{o.text}</b>
                    )
                  )}
              </div>
              <small>
                {a.options.length} choices · {a.products} SKUs use this
                attribute
              </small>
            </button>
          ))}
        </div>
      </InsightPanel>
      <InsightPanel
        title="Try the filter"
        description="Preview only · selections here do not change the store"
        icon={<SlidersHorizontal size={15} />}
      >
        <div className="attribute-filter-preview">
          <header>
            <strong>{item.name}</strong>
            <span>
              {selected.length
                ? `${selected.length} selected`
                : 'Choose an option'}
            </span>
          </header>
          <div className="attribute-preview-choices">
            {item.options.map((o) => (
              <button
                type="button"
                key={o.id}
                aria-pressed={selected.includes(o.id)}
                onClick={() =>
                  setSelected((s) =>
                    s.includes(o.id)
                      ? s.filter((id) => id !== o.id)
                      : [...s, o.id]
                  )
                }
              >
                {swatches[o.text.toLowerCase()] && (
                  <i style={{ background: swatches[o.text.toLowerCase()] }} />
                )}
                {o.text}
                {selected.includes(o.id) && <Check size={12} />}
              </button>
            ))}
          </div>
          <footer>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => setSelected([])}
            >
              Clear selection
            </button>
            <a href={`/admin/attributes/edit/${item.uuid}`}>
              Edit options <ArrowUpRight size={13} />
            </a>
          </footer>
        </div>
      </InsightPanel>
    </div>
  );
}
