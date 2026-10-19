import React from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  PackageCheck,
  RotateCcw,
  Truck
} from 'lucide-react';
export default function Home() {
  return (
    <>
      <section className="ordex-hero" aria-labelledby="hero-title">
        <img
          className="hero-photograph"
          src="/assets/ordex/room.jpg"
          alt="Sunlit living space with pale wood furniture and plants"
          fetchPriority="high"
        />
        <div className="hero-copy">
          <span className="eyebrow">Objects for the everyday</span>
          <h1 id="hero-title">
            A slower pace.
            <br />A better <em>everyday.</em>
          </h1>
          <p>
            Thoughtful things for the little rituals
            <br />
            that make a day your own.
          </p>
          <a className="primary-button" href="/products">
            Find your everyday <ArrowUpRight size={18} />
          </a>
        </div>
        <a
          href="#favourites"
          className="hero-scroll"
          aria-label="Explore favourites"
        >
          <ArrowDown size={18} />
        </a>
        <div className="hero-note">
          <span className="tiny-dot" /> Less, but considered.
          <span>Made for the way you live.</span>
        </div>
      </section>
      <div className="store-benefits">
        <span>
          <Truck size={18} /> Free standard delivery
        </span>
        <span>
          <RotateCcw size={18} /> 7-day returns
        </span>
        <span>
          <PackageCheck size={18} /> A little care in every order
        </span>
      </div>
      <div id="favourites" className="section-kicker">
        <span className="eyebrow">The everyday edit</span>
        <span>Useful. Beautiful. Yours.</span>
      </div>
    </>
  );
}
export const layout = { areaId: 'content', sortOrder: 0 };
