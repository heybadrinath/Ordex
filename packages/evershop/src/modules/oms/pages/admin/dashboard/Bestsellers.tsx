import React, { useState } from 'react';
import { ArrowUpRight, Package } from 'lucide-react';
import { Image } from '@components/common/Image.js';

interface BestSellersProps {
  bestSellers: Array<{
    name: string;
    price: {
      regular: {
        value: number;
        text: string;
      };
    };
    soldQty: number;
    image?: {
      url?: string;
    };
    editUrl?: string;
  }>;
  listUrl: string;
}

export default function BestSellers({
  bestSellers,
  listUrl
}: BestSellersProps) {
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const top = bestSellers.slice(0, 3);
  const ceiling = Math.max(1, ...top.map((p) => p.soldQty));
  return (
    <section
      className="bestseller-card"
      data-slot="card"
      aria-label="Best sellers"
    >
      <div data-slot="card-header">
        <h2 data-slot="card-title">
          <Package size={16} /> Best sellers
        </h2>
        <div
          className="insight-switch"
          role="group"
          aria-label="Best seller view"
        >
          <button
            type="button"
            aria-pressed={view === 'chart'}
            onClick={() => setView('chart')}
          >
            Chart
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </div>
      <div data-slot="card-content">
        <div className="bestseller-intro">
          <span>Units ordered · all time</span>
          <a href={listUrl} aria-label="View all products">
            <ArrowUpRight size={16} />
          </a>
        </div>
        {!bestSellers.length && (
          <p className="dashboard-empty">
            Your most ordered products will appear here.
          </p>
        )}
        {view === 'chart' ? (
          <div className="bestseller-chart">
            <div className="bestseller-axis" aria-hidden="true">
              <span>{ceiling}</span>
              <span>{Math.round(ceiling / 2)}</span>
              <span>0</span>
            </div>
            <div className="bestseller-columns">
              {top.map((product, index) => (
                <a
                  className="bestseller-column"
                  href={product.editUrl}
                  key={product.name}
                  title={`${product.name}: ${product.soldQty} units, ${product.price.regular.text}`}
                >
                  <div className="bestseller-track">
                    <div
                      className={`bestseller-bar bar-${index}`}
                      style={{
                        height: `${Math.max(
                          7,
                          (product.soldQty / ceiling) * 100
                        )}%`
                      }}
                    >
                      <strong>{product.soldQty}</strong>
                    </div>
                  </div>
                  <span className="bestseller-product-image">
                    {product.image?.url && (
                      <Image
                        src={product.image.url}
                        alt=""
                        width={34}
                        height={34}
                      />
                    )}
                  </span>
                  <span className="bestseller-product-name">
                    {product.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <ol className="bestseller-list">
            {bestSellers.map((product, index) => (
              <li key={product.name}>
                <a href={product.editUrl}>
                  <span className="bestseller-rank">{index + 1}</span>
                  <span className="bestseller-product-image">
                    {product.image?.url && (
                      <Image
                        src={product.image.url}
                        alt=""
                        width={34}
                        height={34}
                      />
                    )}
                  </span>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.price.regular.text}</small>
                  </span>
                  <b>
                    {product.soldQty}
                    <small>units</small>
                  </b>
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
export const layout = { areaId: 'dashboardProducts', sortOrder: 20 };

export const query = `
  query Query {
    bestSellers {
      name
      price {
        regular {
          value
          text
        }
      }
      soldQty
      image {
        url
      }
      editUrl
    }
    listUrl: url(routeId: "productGrid")
  }
`;
