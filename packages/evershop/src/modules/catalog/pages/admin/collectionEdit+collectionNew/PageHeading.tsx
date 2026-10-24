import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { Layers3 } from 'lucide-react';

export interface CollectionEditPageHeadingProps {
  backUrl: string;
  collection?: {
    name?: string;
  };
}

export default function CollectionEditPageHeading({
  backUrl,
  collection = {}
}: CollectionEditPageHeadingProps) {
  return (
    <div className="w-full" style={{ margin: '0 auto' }}>
      <PageHeading
        backUrl={backUrl}
        eyebrow="Catalog editor"
        description="Curate the products that belong together."
        icon={<Layers3 size={24} />}
        heading={
          collection
            ? _('Editing ${name}', { name: collection.name || '' })
            : _('Create a new collection')
        }
      />
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

export const query = `
  query Query {
    collection(code: getContextValue("collectionCode", null)) {
      name
    }
    backUrl: url(routeId: "collectionGrid")
  }
`;
