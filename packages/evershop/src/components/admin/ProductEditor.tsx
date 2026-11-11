import React, { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  ArrowUpRight,
  Boxes,
  Image,
  Package,
  Settings2,
  Search,
  Truck
} from 'lucide-react';

const sections = [
  {
    id: 'details',
    label: 'Details',
    Icon: Package,
    title: 'Start with the essentials',
    help: 'A clear name, accurate price and useful description help customers choose.'
  },
  {
    id: 'media',
    label: 'Images',
    Icon: Image,
    title: 'Show the product clearly',
    help: 'The first image is the cover. Drag images to change their order before saving.'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    Icon: Boxes,
    title: 'Keep availability accurate',
    help: 'Set stock on hand and whether this product can be purchased. Changes take effect when you save.'
  },
  {
    id: 'shipping',
    label: 'Shipping',
    Icon: Truck,
    title: 'Ready for dispatch',
    help: 'Use the product’s packaged weight for the shipping calculations in your store.'
  },
  {
    id: 'options',
    label: 'Options & variants',
    Icon: Settings2,
    title: 'Keep product options consistent',
    help: 'Choose an attribute group, then set values such as colour and size. Variants share the same group.'
  },
  {
    id: 'search',
    label: 'Search listing',
    Icon: Search,
    title: 'Make a useful first impression',
    help: 'Review the URL, title and description customers see in search results.'
  }
] as const;
type Section = (typeof sections)[number]['id'];

export function productSectionForField(field: string): Section {
  if (['images'].includes(field)) return 'media';
  if (['qty', 'manage_stock', 'stock_availability'].includes(field))
    return 'inventory';
  if (['weight', 'width', 'height', 'length'].includes(field))
    return 'shipping';
  if (['attributes', 'group_id'].includes(field)) return 'options';
  if (
    ['url_key', 'meta_title', 'meta_description', 'meta_keywords'].includes(
      field
    )
  )
    return 'search';
  return 'details';
}

export function ProductEditor({
  children,
  currency,
  storeUrl
}: {
  children: React.ReactNode;
  currency: string;
  storeUrl?: string;
}) {
  const [active, setActive] = useState<Section>('details');
  const [previewIndex, setPreviewIndex] = useState(0);
  const {
    formState: { errors, submitCount }
  } = useFormContext();
  const [name, price, qty, status, images] = useWatch({
    name: ['name', 'price', 'qty', 'status', 'images']
  });
  useEffect(() => {
    const section = window.location.hash.replace('#product-', '');
    if (sections.some((item) => item.id === section))
      setActive(section as Section);
  }, []);
  useEffect(() => {
    const field = Object.keys(errors)[0];
    if (!field || !submitCount) return;
    setActive(productSectionForField(field));
    const frame = requestAnimationFrame(() => {
      const input = document.querySelector<HTMLElement>(
        '.product-editor [aria-invalid="true"]'
      );
      input?.focus();
      input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [submitCount]);
  const selectSection = (section: Section) => {
    setActive(section);
    window.history.replaceState(null, '', `#product-${section}`);
  };
  const current = sections.find((section) => section.id === active)!;
  const image = images?.[previewIndex]?.url || images?.[0]?.url;
  return (
    <div className="product-editor" data-section={active}>
      <nav
        className="product-editor-tabs"
        role="tablist"
        aria-label="Product editor sections"
      >
        {sections.map(({ id, label, Icon }, index) => (
          <button
            key={id}
            id={`editor-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls="product-editor-panel"
            tabIndex={active === id ? 0 : -1}
            onClick={() => selectSection(id)}
            onKeyDown={(event) => {
              if (
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                  ? sections.length - 1
                  : (index +
                      (event.key === 'ArrowRight' ? 1 : -1) +
                      sections.length) %
                    sections.length;
              selectSection(sections[next].id);
              document
                .getElementById(`editor-tab-${sections[next].id}`)
                ?.focus();
            }}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <div className="product-editor-layout">
        <div
          id="product-editor-panel"
          role="tabpanel"
          aria-labelledby={`editor-tab-${active}`}
          className="product-editor-fields"
        >
          {children}
        </div>
        <aside className="product-editor-preview" aria-label="Product preview">
          <div className="editor-preview-image">
            {image ? (
              <img src={image} alt={name || 'Product preview'} />
            ) : (
              <Package size={42} strokeWidth={1.3} />
            )}
          </div>
          {images?.length > 1 && (
            <div
              className="editor-image-picker"
              role="group"
              aria-label="Preview product images"
            >
              {images.map((item, index) => (
                <button
                  type="button"
                  key={item.url || index}
                  aria-label={`Preview image ${index + 1}`}
                  aria-pressed={previewIndex === index}
                  onClick={() => setPreviewIndex(index)}
                >
                  <img src={item.url} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="editor-preview-copy">
            <span
              className={`editor-product-status ${
                String(status) === '1' ? 'enabled' : ''
              }`}
            >
              {String(status) === '1' ? 'Enabled' : 'Disabled'}
            </span>
            <h2>{name || 'Your product'}</h2>
            <strong>
              {price !== undefined && price !== ''
                ? new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency
                  }).format(Number(price))
                : 'Add a price'}
            </strong>
            <p>{qty ?? '—'} units on hand</p>
            <div className="editor-stock-blocks" aria-hidden="true">
              {Array.from(
                { length: Math.min(24, Math.max(0, Number(qty) || 0)) },
                (_, i) => (
                  <span key={i} data-filled="true" />
                )
              )}
            </div>
            <small className="editor-stock-caption">
              Each square is one unit
              {Number(qty) > 24 ? ` · +${Number(qty) - 24} more` : ''}
            </small>
            {storeUrl && (
              <a href={storeUrl} target="_blank" rel="noreferrer">
                View saved product <ArrowUpRight size={14} />
              </a>
            )}
          </div>
          <div className="editor-context">
            <current.Icon size={20} strokeWidth={1.5} />
            <h3>{current.title}</h3>
            <p>{current.help}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
