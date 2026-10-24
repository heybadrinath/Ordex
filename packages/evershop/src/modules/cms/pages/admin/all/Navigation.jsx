// Modified for Ordex on 19 October 2026.
import React from 'react';
import { NavigationItemGroup } from '@components/admin/NavigationItemGroup';
import {
  LayoutGrid,
  ShoppingBag,
  RotateCcw,
  Users,
  Package,
  Layers,
  Tags,
  SlidersHorizontal,
  Settings2,
  Store,
  ArrowUpRight
} from 'lucide-react';
import './Navigation.scss';

export default function AdminNavigation(urls) {
  return (
    <div className="admin-nav-container">
      <div className="admin-workspace">
        <span>
          <Store size={17} />
        </span>
        <div>
          <strong>Ordex store</strong>
          <small>Your commerce workspace</small>
        </div>
      </div>
      <nav className="admin-nav" aria-label="Seller navigation">
        <ul className="list-unstyled">
          <NavigationItemGroup
            id="workspaceNavigation"
            name="Workspace"
            items={[
              { Icon: LayoutGrid, url: urls.dashboard, title: 'Overview' },
              { Icon: ShoppingBag, url: urls.orders, title: 'Orders' },
              {
                Icon: RotateCcw,
                url: urls.returns,
                title: 'Returns & refunds'
              },
              { Icon: Users, url: urls.customers, title: 'Customers' }
            ]}
          />
          <NavigationItemGroup
            id="catalogNavigation"
            name="Catalog"
            items={[
              { Icon: Package, url: urls.products, title: 'Products' },
              { Icon: Layers, url: urls.categories, title: 'Categories' },
              { Icon: Tags, url: urls.collections, title: 'Collections' },
              {
                Icon: SlidersHorizontal,
                url: urls.attributes,
                title: 'Attributes'
              }
            ]}
          />
          <NavigationItemGroup
            id="storeNavigation"
            name="Store"
            items={[{ Icon: Settings2, url: urls.settings, title: 'Settings' }]}
          />
        </ul>
      </nav>
      <a className="studio-store-link" href="/">
        <Store size={16} /> View storefront <ArrowUpRight size={15} />
      </a>
    </div>
  );
}
export const layout = { areaId: 'adminNavigation', sortOrder: 10 };
export const query = `query {
  dashboard: url(routeId:"dashboard")
  orders: url(routeId:"orderGrid")
  returns: url(routeId:"sellerReturns")
  customers: url(routeId:"customerGrid")
  products: url(routeId:"productGrid")
  categories: url(routeId:"categoryGrid")
  collections: url(routeId:"collectionGrid")
  attributes: url(routeId:"attributeGrid")
  settings: url(routeId:"storeSetting")
}`;
