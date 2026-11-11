import React, { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { attributeSwatches } from './attributeSwatches.js';
import {
  ArrowUpRight,
  Check,
  Layers,
  Package,
  SlidersHorizontal
} from 'lucide-react';

type Kind = 'category' | 'collection' | 'attribute';
type CatalogProducts = {
  total: number;
  items: { name: string; image?: { url?: string } }[];
};
const CatalogProductsContext = React.createContext<React.Dispatch<
  React.SetStateAction<CatalogProducts | undefined>
> | null>(null);

export function useCatalogPreview() {
  return React.useContext(CatalogProductsContext);
}

export type EditorEntity = {
  name?: string;
  attributeName?: string;
  code?: string;
  attributeCode?: string;
  image?: { url?: string };
  url?: string;
  type?: string;
  status?: boolean | number;
  isFilterable?: boolean | number;
  options?: { optionText: string }[];
};

const sections = {
  category: [
    ['details', 'Details'],
    ['products', 'Products'],
    ['discovery', 'Search listing'],
    ['visibility', 'Visibility']
  ],
  collection: [
    ['details', 'Details'],
    ['products', 'Products']
  ],
  attribute: [
    ['details', 'Details'],
    ['options', 'Options'],
    ['visibility', 'Storefront settings']
  ]
};

export function CatalogEditor({
  kind,
  entity,
  children,
  aside
}: {
  kind: Kind;
  entity?: EditorEntity | null;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const [active, setActive] = useState('details');
  const [products, setProducts] = useState<CatalogProducts>();
  const [
    name,
    attributeName,
    code,
    attributeCode,
    image,
    status,
    urlKey,
    options,
    type,
    filterable
  ] = useWatch({
    name: [
      'name',
      'attribute_name',
      'code',
      'attribute_code',
      'image',
      'status',
      'url_key',
      'options',
      'type',
      'is_filterable'
    ]
  });
  const title =
    (kind === 'attribute' ? attributeName : name) ??
    entity?.name ??
    entity?.attributeName ??
    '';
  const identifier =
    code ?? attributeCode ?? urlKey ?? entity?.code ?? entity?.attributeCode;
  const cover = typeof image === 'string' ? image : entity?.image?.url;
  const choices: string[] = options
    ? options.map((o: { option_text?: string }) => o.option_text || '')
    : entity?.options?.map((o) => o.optionText) || [];
  const Icon =
    kind === 'attribute'
      ? SlidersHorizontal
      : kind === 'category'
      ? Layers
      : Package;
  const photos = products?.items.filter((p) => p.image?.url).slice(0, 4) || [];
  const navigation = sections[kind].filter(
    ([id]) =>
      (id !== 'products' || !!entity) &&
      (id !== 'options' ||
        ['select', 'multiselect'].includes(type ?? entity?.type))
  );
  return (
    <CatalogProductsContext.Provider value={setProducts}>
      <div className={`catalog-editor catalog-editor-${kind}`}>
        <section className="editor-overview" aria-label={`${kind} overview`}>
          <div className="editor-live-preview">
            <div className="editor-cover">
              {cover ? (
                <img src={cover} alt="" />
              ) : photos.length ? (
                <img src={photos[0].image!.url} alt="" />
              ) : (
                <Icon size={30} strokeWidth={1.3} />
              )}
            </div>
            <div>
              <span className="editor-overview-label">
                {kind === 'attribute'
                  ? 'Product detail preview'
                  : 'Storefront preview'}
              </span>
              <h2>{title || `New ${kind}`}</h2>
              <small>
                {identifier
                  ? `${kind === 'category' ? '/' : ''}${identifier}`
                  : 'Add a name to get started'}
              </small>
              {entity?.url && (
                <a href={entity.url} target="_blank" rel="noreferrer">
                  View in store <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </div>
          <div className="editor-overview-stat">
            <span className="editor-overview-label">
              <Icon size={14} />
              {kind === 'attribute' ? 'Available options' : 'Assigned products'}
            </span>
            <strong>
              {kind === 'attribute'
                ? choices.filter(Boolean).length
                : products?.total ?? (entity ? '—' : 0)}
              <small>{kind === 'attribute' ? 'choices' : 'products'}</small>
            </strong>
            {kind === 'attribute' ? (
              <div className="editor-option-preview">
                {choices
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((choice, i) => (
                    <span key={`${i}-${choice}`}>
                      {identifier === 'color' &&
                        attributeSwatches[choice.toLowerCase()] && (
                          <i
                            aria-hidden="true"
                            style={{
                              background:
                                attributeSwatches[choice.toLowerCase()]
                            }}
                          />
                        )}
                      {choice}
                    </span>
                  ))}
              </div>
            ) : (
              <div className="editor-photo-stack">
                {photos.map((p, i) => (
                  <img key={`${i}-${p.name}`} src={p.image!.url} alt={p.name} />
                ))}
                {!photos.length && (
                  <span>
                    {entity && !products
                      ? 'Loading the current selection…'
                      : 'Products appear here after they are assigned.'}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="editor-overview-state">
            <span className="editor-overview-label">
              <Check size={14} />{' '}
              {kind === 'attribute' ? 'Storefront use' : 'Listing details'}
            </span>
            <div>
              <span>Name</span>
              <b>
                {title ? (
                  <>
                    <Check size={12} /> Added
                  </>
                ) : (
                  'Not set'
                )}
              </b>
            </div>
            <div>
              <span>
                {kind === 'attribute'
                  ? 'Input type'
                  : kind === 'category'
                  ? 'Visibility'
                  : 'Collection code'}
              </span>
              <b>
                {kind === 'attribute'
                  ? String(type ?? entity?.type ?? 'Text')
                  : kind === 'category'
                  ? ['1', 'true'].includes(
                      String(status ?? entity?.status ?? 1)
                    )
                    ? 'Enabled'
                    : 'Disabled'
                  : identifier || 'Not set'}
              </b>
            </div>
            <div>
              <span>
                {kind === 'attribute' ? 'Shopping filter' : 'Preview images'}
              </span>
              <b>
                {kind === 'attribute'
                  ? ['1', 'true'].includes(
                      String(filterable ?? entity?.isFilterable)
                    )
                    ? 'Available'
                    : 'Not used'
                  : cover
                  ? 'Cover image added'
                  : entity && !products
                  ? 'Loading…'
                  : `${photos.length} product images`}
              </b>
            </div>
          </div>
        </section>
        <nav
          className="editor-section-nav"
          aria-label={`${kind} editor sections`}
        >
          {navigation.map(([id, label], i) => (
            <a
              key={id}
              href={`#${kind}-${id}`}
              aria-current={active === id ? 'location' : undefined}
              onClick={() => setActive(id)}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {label}
            </a>
          ))}
          <small>Save changes to update details</small>
        </nav>
        <div
          className={`catalog-editor-columns ${aside ? '' : 'single-column'}`}
        >
          <div className="catalog-editor-fields">{children}</div>
          {aside && <aside className="catalog-editor-aside">{aside}</aside>}
        </div>
      </div>
    </CatalogProductsContext.Provider>
  );
}
