import React from 'react';
import { useWatch, type Control } from 'react-hook-form';
import {
  Store,
  MapPin,
  Globe2,
  ContactRound,
  Images,
  ArrowRight,
  ReceiptText,
  Percent
} from 'lucide-react';

export function StoreIdentityPreview({
  control,
  initial
}: {
  control: Control;
  initial: {
    storeName?: string;
    storeCurrency?: string;
    storeCountry?: string;
    storeTimeZone?: string;
  };
}) {
  const values = useWatch({ control });
  const name = values.storeName ?? initial.storeName ?? 'Your store';
  return (
    <section
      className="settings-visual store-identity-preview"
      aria-label="Store identity preview"
    >
      <div className="settings-visual-copy">
        <span className="settings-visual-label">
          <Store size={14} /> Store identity
        </span>
        <h2>{name}</h2>
        <p>
          A preview of your store’s identity. Changes appear here before you
          save.
        </p>
        <div className="settings-preview-tags">
          <span>
            <MapPin size={12} />
            {values.storeCountry ?? initial.storeCountry}
          </span>
          <span>{values.storeCurrency ?? initial.storeCurrency}</span>
          <span>
            <Globe2 size={12} />
            {values.storeTimeZone ?? initial.storeTimeZone}
          </span>
        </div>
      </div>
      <div className="mini-store">
        <header>
          <strong>{name}</strong>
          <span>Brand preview</span>
        </header>
        <div className="mini-store-products">
          {['sofa', 'headphones', 'backpack'].map((image) => (
            <span key={image}>
              <img src={`/assets/ordex/catalog/${image}.jpg`} alt="" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CustomerFormPreview({
  control,
  initial
}: {
  control: Control;
  initial: {
    addressNameFormat: string;
    addressTelephone: string;
    addressOrganization: string;
    addressLine2: string;
  };
}) {
  const watch = useWatch({ control });
  const setting = {
    ...initial,
    ...Object.fromEntries(
      Object.entries(watch).filter(([, value]) => value !== undefined)
    )
  };
  return (
    <section className="settings-visual" aria-label="Checkout address preview">
      <div className="settings-visual-copy">
        <span className="settings-visual-label">
          <ContactRound size={15} /> Customer experience
        </span>
        <h2>Your address fields</h2>
        <p>
          See how your address choices appear together. This preview updates as
          you edit the fields below.
        </p>
        <div className="settings-preview-tags">
          <span>
            {setting.addressNameFormat === 'split'
              ? 'First & last name'
              : 'Full name'}
          </span>
          <span>Phone: {setting.addressTelephone}</span>
        </div>
      </div>
      <div className="address-form-preview">
        <header>
          Delivery address <span>Form preview</span>
        </header>
        <div className="preview-address-fields">
          {setting.addressNameFormat === 'split' ? (
            <>
              <span>First name</span>
              <span>Last name</span>
            </>
          ) : (
            <span className="wide">Full name</span>
          )}
          {!['disabled', 'hidden'].includes(setting.addressOrganization) && (
            <span className="wide">
              Company <small>{setting.addressOrganization}</small>
            </span>
          )}
          <span className="wide">Street address</span>
          {!['disabled', 'hidden'].includes(setting.addressLine2) && (
            <span className="wide">
              Apartment, suite, etc. <small>{setting.addressLine2}</small>
            </span>
          )}
          <span>City</span>
          <span>Postal code</span>
          {!['disabled', 'hidden'].includes(setting.addressTelephone) && (
            <span className="wide">
              Phone number <small>{setting.addressTelephone}</small>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export function CatalogImagePreview({
  control,
  initial
}: {
  control: Control;
  initial: {
    catalogProductImageWidth?: number;
    catalogProductImageHeight?: number;
    catalogCollectionPageSize?: number;
  };
}) {
  const values = useWatch({ control });
  const width = Math.max(
    1,
    Number(
      values.catalogProductImageWidth ?? initial.catalogProductImageWidth
    ) || 1200
  );
  const height = Math.max(
    1,
    Number(
      values.catalogProductImageHeight ?? initial.catalogProductImageHeight
    ) || 1200
  );
  const ratio = width / height;
  return (
    <section className="settings-visual" aria-label="Catalog image preview">
      <div className="settings-visual-copy">
        <span className="settings-visual-label">
          <Images size={15} /> Listing preview
        </span>
        <h2>Product image proportions</h2>
        <p>
          Image proportions update here before saving. Use consistent dimensions
          for a balanced product grid.
        </p>
        <div className="settings-preview-tags">
          <span>
            {width} × {height} px
          </span>
          <span>
            {values.catalogCollectionPageSize ??
              initial.catalogCollectionPageSize ??
              20}{' '}
            per page
          </span>
        </div>
      </div>
      <div className="catalog-image-preview">
        {['sofa', 'headphones', 'backpack'].map((image) => (
          <div key={image}>
            <div
              className="catalog-preview-frame"
              style={{ aspectRatio: ratio, maxHeight: 200 }}
            >
              <img src={`/assets/ordex/catalog/${image}.jpg`} alt="" />
            </div>
            <span />
            <small />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DeliveryNetwork({
  zones,
  destinations
}: {
  zones: {
    uuid: string;
    name: string;
    countries: { name: string; code: string }[];
  }[];
  destinations: number;
}) {
  return (
    <section className="delivery-network" aria-label="Delivery network">
      <header>
        <div>
          <h3>Delivery network</h3>
          <p>
            {zones.length} {zones.length === 1 ? 'zone' : 'zones'} ·{' '}
            {destinations} {destinations === 1 ? 'country' : 'countries'}{' '}
            available at checkout
          </p>
        </div>
        <Globe2 size={22} />
      </header>
      <div className="delivery-network-route">
        <span className="network-origin">
          <Store size={22} />
          <strong>Your store</strong>
        </span>
        <ArrowRight size={20} />
        <div className="network-destinations">
          {zones.map((z) => (
            <a key={z.uuid} href={`#zone-${z.uuid}`}>
              <MapPin size={15} />
              <span>
                <strong>{z.name}</strong>
                <small>
                  {z.countries.map((c) => c.name).join(', ') ||
                    'No countries assigned'}
                </small>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PackageDrawing({
  length,
  width,
  height
}: {
  length: number;
  width: number;
  height: number;
}) {
  return (
    <svg
      viewBox="0 0 160 110"
      className="package-drawing"
      aria-label={`Package dimensions ${length} by ${width} by ${height}`}
      role="img"
    >
      <path d="M32 35 80 17 127 35 80 56Z" fill="#e2edf3" stroke="#8eafc2" />
      <path d="M32 35 80 56 80 94 32 72Z" fill="#f8fafc" stroke="#8eafc2" />
      <path d="M80 56 127 35 127 72 80 94Z" fill="#c9dce7" stroke="#8eafc2" />
      <path d="m55 26 48 20v17l-15 6V52L40 32" fill="#ffffff77" />
      <text x="16" y="67" fontSize="9" fill="#687987">
        {height}
      </text>
      <text x="103" y="94" fontSize="9" fill="#687987">
        {length}
      </text>
      <text x="42" y="94" fontSize="9" fill="#687987">
        {width}
      </text>
    </svg>
  );
}

export function TaxRulesPreview({
  classes,
  inclusive
}: {
  classes: {
    uuid: string;
    name: string;
    rates: { uuid: string; name: string; rate: number; country?: string }[];
  }[];
  inclusive: boolean;
}) {
  const rates = classes.flatMap((c) => c.rates);
  return (
    <section
      className="settings-visual tax-rules-preview"
      aria-label="Tax configuration overview"
    >
      <div className="settings-visual-copy">
        <span className="settings-visual-label">
          <ReceiptText size={15} /> Price calculation
        </span>
        <h2>
          {inclusive ? 'Tax-inclusive prices' : 'Tax calculated at checkout'}
        </h2>
        <p>
          Saved configuration · {classes.length} tax class
          {classes.length === 1 ? '' : 'es'} and {rates.length} regional rate
          {rates.length === 1 ? '' : 's'}.
        </p>
        <div className="tax-flow">
          <span>
            <ReceiptText size={20} />
            <small>Product price</small>
          </span>
          <ArrowRight size={14} aria-hidden="true" />
          <span>
            <Percent size={20} />
            <small>Matching tax rule</small>
          </span>
          <ArrowRight size={14} aria-hidden="true" />
          <span>
            <ReceiptText size={20} />
            <small>Order total</small>
          </span>
        </div>
      </div>
      <div className="tax-class-previews">
        {classes.map((c) => (
          <details key={c.uuid} className="tax-class-preview">
            <summary>
              <Percent size={15} />
              <strong>{c.name}</strong>
              <small>
                {c.rates.length} rate{c.rates.length === 1 ? '' : 's'}
              </small>
            </summary>
            <div>
              {c.rates.length ? (
                c.rates.map((r) => (
                  <p key={r.uuid}>
                    <span>
                      {r.name}
                      <small>{r.country || 'All destinations'}</small>
                    </span>
                    <b>{Number(r.rate)}%</b>
                  </p>
                ))
              ) : (
                <p>No regional rates configured.</p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
