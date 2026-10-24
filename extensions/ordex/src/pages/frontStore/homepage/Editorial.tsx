import React from 'react';
import {
  ArrowUpRight,
  PackageCheck,
  RotateCcw,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import { ProductList } from '@components/frontStore/catalog/ProductList.js';
import { ProductData } from '@components/frontStore/catalog/ProductContext.js';

export default function Editorial({
  smallJoys, paperEdit, tableEdit, weekendEdit
}: {
  smallJoys: { products: { items: ProductData[] } };
  paperEdit: { products: { items: ProductData[] } };
  tableEdit: { products: { items: ProductData[] } };
  weekendEdit: { products: { items: ProductData[] } };
}) {
  return (
    <>
      <section className="routine-banner" aria-labelledby="routine-heading">
        <div className="routine-photo">
          <img
            src="/assets/ordex/catalog/workspace.jpg"
            alt="A considered workspace with room to think"
            width="800"
            height="620"
            loading="lazy"
          />
          <span className="routine-sticker">
            Less clutter.
            <br />
            More you.
          </span>
        </div>
        <div className="routine-copy">
          <span className="eyebrow">THE DESK COLLECTION</span>
          <h2 id="routine-heading">
            Make work feel
            <br />
            less like work.
          </h2>
          <p>
            Your favourite playlist. A clear desk. A coffee, just right. The
            little details make all the difference.
          </p>
          <a href="/workspace" className="primary-button">
            Shop desk essentials <ArrowUpRight size={18} />
          </a>
          <div className="routine-detail">
            <Sparkles size={18} />
            <span>
              Simple objects. Thoughtful details.
              <br />A space that feels like yours.
            </span>
          </div>
        </div>
      </section>
      <section className="paper-discovery" aria-labelledby="paper-heading">
        <div className="paper-discovery-story">
          <span className="eyebrow">For your next good idea</span>
          <h2 id="paper-heading">A little paper.<br />A lot of possibility.</h2>
          <p>Plans, doodles, big ideas. Make room for them all.</p>
          <a className="text-link" href="/stationery">Explore paper & stationery <ArrowUpRight size={18} /></a>
          <img src="/assets/ordex/catalog/stationery-set.jpg" alt="Pastel pencils and paper for your next idea" width="600" height="640" loading="lazy" />
        </div>
        <ProductList products={paperEdit?.products.items.slice(0, 4) || []} gridColumns={2} />
      </section>
      <section className="moments-grid" aria-label="Shop your everyday rituals">
        <a className="moment-card moment-coffee" href="/kitchen">
          <img
            src="/assets/ordex/catalog/french-press.jpg"
            alt="French press and coffee cup in the morning light"
            width="800"
            height="500"
            loading="lazy"
          />
          <div>
            <span className="eyebrow">Take your time</span>
            <h2>A slower start.</h2>
            <p>Good coffee. A favourite cup. Your morning, made.</p>
            <span className="moment-link">
              Shop kitchen & coffee <ArrowUpRight size={18} />
            </span>
          </div>
        </a>
        <a className="moment-card moment-home" href="/living">
          <img
            src="/assets/ordex/catalog/lamp.jpg"
            alt="A woven table lamp for a softer evening"
            width="800"
            height="500"
            loading="lazy"
          />
          <div>
            <span className="eyebrow">Make room for you</span>
            <h2>Home, with feeling.</h2>
            <p>Soft corners and useful little things to settle in with.</p>
            <span className="moment-link">
              Explore home & living <ArrowUpRight size={18} />
            </span>
          </div>
        </a>
      </section>
      <section className="small-joys" aria-labelledby="small-joys-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LITTLE THINGS, LOVELY PRICES</span>
            <h2 id="small-joys-heading">Small joys. All under ₹2,000.</h2>
            <p>A thoughtful gift. A desk-side upgrade. Or just because.</p>
          </div>
          <a className="text-link" href="/products?max_price=2000">
            Discover small joys <ArrowUpRight size={17} />
          </a>
        </div>
        <ProductList
          products={smallJoys?.products.items.slice(0, 4) || []}
          gridColumns={4}
        />
      </section>
      <section className="table-discovery" aria-labelledby="table-heading">
        <div className="section-heading">
          <div><span className="eyebrow">Pull up a chair</span><h2 id="table-heading">Set a little scene.</h2><p>Good food. Good company. Everyday pieces worth gathering around.</p></div>
          <a className="text-link" href="/tableware">Shop the table <ArrowUpRight size={18} /></a>
        </div>
        <ProductList products={tableEdit?.products.items.slice(0, 4) || []} gridColumns={4} />
      </section>
      <section className="weekend-discovery" aria-labelledby="weekend-heading">
        <a className="weekend-discovery-image" href="/outdoors"><img src="/assets/ordex/catalog/picnic-basket.jpg" alt="A woven picnic basket on a blanket in the sunshine" width="1000" height="700" loading="lazy" /><span>Permission to take it slow. <ArrowUpRight size={24} /></span></a>
        <div className="weekend-discovery-copy"><span className="eyebrow">Off the clock</span><h2 id="weekend-heading">Take the<br />scenic route.</h2><p>Fresh air, a sunny spot and the things you love to take along. Here’s to a slower weekend.</p><a className="primary-button" href="/outdoors">Meet your weekend essentials <ArrowUpRight size={19} /></a></div>
      </section>
      <section className="weekend-products" aria-label="Weekend essentials">
        <ProductList products={weekendEdit?.products.items.slice(0, 4) || []} gridColumns={3} />
      </section>
      <section className="care-strip" aria-label="Shopping with Ordex">
        <div>
          <span className="care-icon">
            <PackageCheck size={29} strokeWidth={1.4} />
          </span>
          <h3>Delivery, taken care of.</h3>
          <p>
            Free standard delivery, with your order status always a click away.
          </p>
          <a href="/account/orders">
            Track your orders <ArrowUpRight size={15} />
          </a>
        </div>
        <div>
          <span className="care-icon">
            <RotateCcw size={29} strokeWidth={1.4} />
          </span>
          <h3>Room to rethink.</h3>
          <p>
            Request a return within 7 days of delivery, right from your account.
          </p>
          <a href="/account/returns">
            Explore returns <ArrowUpRight size={15} />
          </a>
        </div>
        <div>
          <span className="care-icon">
            <HeartHandshake size={29} strokeWidth={1.4} />
          </span>
          <h3>Here after checkout.</h3>
          <p>
            Your orders, returns and refund updates, with everything in one
            place.
          </p>
          <a href="/products">
            Make yourself at home <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
      <section className="store-faq" aria-labelledby="faq-heading">
        <div>
          <span className="eyebrow">A FEW GOOD ANSWERS</span>
          <h2 id="faq-heading">
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h2>
          <p>A little clarity before your next good find.</p>
        </div>
        <div className="faq-items">
          <details>
            <summary>How does delivery work?</summary>
            <p>
              Standard delivery is free. Open Your orders to see the latest
              delivery status and tracking reference for each order.
            </p>
          </details>
          <details>
            <summary>What if something isn’t quite right?</summary>
            <p>
              Delivered items can be requested for return within 7 days. Select
              the order and item in Your returns. The store reviews your
              request, receives and inspects the item, then processes any
              approved refund.
            </p>
          </details>
          <details>
            <summary>Can I try the store without a real payment?</summary>
            <p>
              Yes. This is a demo store with sample products and a simulated
              payment method. Checkout never charges a real card.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}
export const layout = { areaId: 'content', sortOrder: 100 };
export const query = `query {
 smallJoys: collection(code:"small-joys") { products(filters:[{key:"limit",operation:eq,value:"8"}]) { items { ...JoyProduct } } }
 paperEdit: collection(code:"paper-edit") { products(filters:[{key:"limit",operation:eq,value:"4"}]) { items { ...JoyProduct } } }
 tableEdit: collection(code:"table-edit") { products(filters:[{key:"limit",operation:eq,value:"4"}]) { items { ...JoyProduct } } }
 weekendEdit: collection(code:"weekend-edit") { products(filters:[{key:"limit",operation:eq,value:"3"}]) { items { ...JoyProduct } } }
}`;
export const fragments = `fragment JoyProduct on Product { productId name sku variantGroupId url price { regular { value text } special { value text } } inventory { isInStock } image { url alt } }`;
