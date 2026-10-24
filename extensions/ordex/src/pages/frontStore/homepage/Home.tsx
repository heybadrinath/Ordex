import { Image } from '@components/common/Image.js';
import React, { useState } from 'react';
import { ArrowUpRight, Asterisk, PackageCheck } from 'lucide-react';
import { ProductList } from '@components/frontStore/catalog/ProductList.js';
import { ProductData } from '@components/frontStore/catalog/ProductContext.js';

type Collection = { products: { items: ProductData[] } } | null;
type Category = {
  urlKey: string;
  name: string;
  url: string;
  products: { total: number };
  image?: { url: string };
};
type Props = {
  featured: Collection;
  homeEdit: Collection;
  workEdit: Collection;
  dailyEdit: Collection;
  categories: { items: Category[] };
};
const categoryKeys = ['living', 'workspace', 'audio', 'everyday-carry'];
const categoryLabels = [
  'Home & living',
  'Work & desk',
  'Sound & tech',
  'On the go'
];

export default function Home({
  featured,
  homeEdit,
  workEdit,
  dailyEdit,
  categories
}: Props) {
  const [edit, setEdit] = useState('All picks');
  const edits: Record<string, Collection> = {
    'All picks': featured,
    'At home': homeEdit,
    'At work': workEdit,
    'On the go': dailyEdit
  };
  const products = featured?.products.items || [];
  const heroProduct = products.find(
    (product) => product.sku === 'STILL-SOFA-001'
  );
  const carryProduct =
    products.find((product) => product.sku === 'ROAM-PACK-001') ||
    dailyEdit?.products.items[0];
  return (
    <>
      <section
        className="store-hero"
        aria-label="Discover the everyday collection"
      >
        <div className="hero-intro">
          <span className="hero-eyebrow">Objects for a life well lived</span>
          <h1>
            Good things.
            <br />
            <span>Better days.</span>
          </h1>
          <p>
            For the corners you make your own.
            <br />
            And the everyday you make of them.
          </p>
          <a className="primary-button hero-collection-button" href="/products">
            Explore the collection <ArrowUpRight size={20} />
          </a>
          <Asterisk
            className="hero-symbol"
            aria-hidden="true"
            strokeWidth={2.3}
          />
          <div className="hero-bottom-note">
            <PackageCheck size={19} />
            <span>Good finds. Free standard delivery.</span>
          </div>
        </div>
        <div className="hero-picks">
          <a className="hero-room" href={heroProduct?.url || '/living'}>
            <Image
              unoptimized
              src={heroProduct?.image?.url || '/assets/ordex/catalog/sofa.jpg'}
              alt={heroProduct?.name || 'Explore home and living'}
              width={900}
              height={620}
              fetchPriority="high"
            />
            <span className="hero-edit-tag">Make yourself at home</span>
            <span className="hero-edit-caption">
              <span>
                <small>The living edit</small>
                <strong>
                  {heroProduct?.name || 'Home, with a little more character.'}
                </strong>
                {heroProduct && <span>{heroProduct.price.regular.text}</span>}
              </span>
              <span className="hero-circle-arrow">
                <ArrowUpRight size={22} />
              </span>
            </span>
          </a>
          <a className="hero-carry" href="/everyday-carry">
            <div>
              <span className="eyebrow">The carry edit</span>
              <h2>
                Out the door.
                <br />
                Into your day.
              </h2>
              <span className="hero-carry-link">
                Find your everyday carry <ArrowUpRight size={17} />
              </span>
            </div>
            <Image
              unoptimized
              src={
                carryProduct?.image?.url || '/assets/ordex/catalog/backpack.jpg'
              }
              alt={carryProduct?.name || 'Everyday carry essentials'}
              width={400}
              height={360}
            />
          </a>
        </div>
      </section>
      <nav
        className="collection-shortcuts"
        id="categories"
        aria-label="Shop by collection"
      >
        {categoryKeys.map((key, index) => {
          const category = categories?.items.find(
            (item) => item.urlKey === key
          );
          return category ? (
            <a key={key} href={category.url}>
              {category.image && (
                <Image
                  unoptimized
                  src={category.image.url}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                />
              )}
              <span>
                <strong>{categoryLabels[index]}</strong>
                <small>{category.products.total} everyday finds</small>
              </span>
              <ArrowUpRight size={18} />
            </a>
          ) : null;
        })}
      </nav>
      <section
        className="everyday-products"
        id="favourites"
        aria-labelledby="favourites-heading"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">The everyday edit</span>
            <h2 id="favourites-heading">Your next everyday favourite.</h2>
            <p>
              A few good places to start. Find the things that feel like you.
            </p>
          </div>
          <a className="text-link" href="/products">
            Shop all <ArrowUpRight size={17} />
          </a>
        </div>
        <div
          className="collection-tabs"
          role="group"
          aria-label="Choose a collection"
        >
          {Object.keys(edits).map((label) => (
            <button
              key={label}
              type="button"
              aria-pressed={edit === label}
              onClick={() => setEdit(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="collection-products"
          aria-live="polite"
          aria-label={`${edit} products`}
        >
          <ProductList
            products={edits[edit]?.products.items.slice(0, 8) || []}
            gridColumns={4}
          />
        </div>
      </section>
      <section
        className="category-discovery"
        aria-labelledby="category-discovery-heading"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">A place for every part of your day</span>
            <h2 id="category-discovery-heading">Find your kind of everyday.</h2>
            <p>From your first coffee to your next little adventure.</p>
          </div>
        </div>
        <div className="category-scenes">
          {[
            'kitchen',
            'stationery',
            'lighting',
            'tableware',
            'outdoors',
            'audio'
          ].map((key) => {
            const category = categories.items.find(
              (item) => item.urlKey === key
            );
            return (
              category && (
                <a key={key} className="category-scene" href={category.url}>
                  {category.image && (
                    <Image
                      unoptimized
                      src={category.image.url}
                      alt=""
                      width={500}
                      height={350}
                      loading="lazy"
                    />
                  )}
                  <span>
                    <span>
                      <strong>{category.name}</strong>
                      <small>{category.products.total} good finds</small>
                    </span>
                    <ArrowUpRight size={22} />
                  </span>
                </a>
              )
            );
          })}
        </div>
      </section>
    </>
  );
}
export const layout = { areaId: 'content', sortOrder: 0 };
export const query = `query {
 categories(filters:[{key:"limit",operation:eq,value:"30"}]) { items { urlKey name url image { url } products { total } } }
 featured: collection(code:"studio-edit") { products(filters:[{key:"limit",operation:eq,value:"20"}]) { items { ...HomeProduct } } }
 homeEdit: collection(code:"home-edit") { products(filters:[{key:"limit",operation:eq,value:"8"}]) { items { ...HomeProduct } } }
 workEdit: collection(code:"workspace-edit") { products(filters:[{key:"limit",operation:eq,value:"8"}]) { items { ...HomeProduct } } }
 dailyEdit: collection(code:"daily-edit") { products(filters:[{key:"limit",operation:eq,value:"8"}]) { items { ...HomeProduct } } }
}`;
export const fragments = `fragment HomeProduct on Product { productId name sku variantGroupId url price { regular { value text } special { value text } } inventory { isInStock } image { url alt } }`;
