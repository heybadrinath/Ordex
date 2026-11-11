import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { FolderTree } from 'lucide-react';

export interface CategoryEditPageHeadingProps {
  backUrl: string;
  category?: {
    name?: string;
  };
}

export default function CategoryEditPageHeading({
  backUrl,
  category = {}
}: CategoryEditPageHeadingProps) {
  return (
    <PageHeading
      backUrl={backUrl}
      eyebrow="Catalog editor"
      description="Build a clear place for customers to discover these products."
      icon={<FolderTree size={24} />}
      heading={
        category
          ? _('Editing ${name}', { name: category.name || '' })
          : _('Create a new category')
      }
    />
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

export const query = `
  query Query {
    category(id: getContextValue("categoryId", null)) {
      name
    }
    backUrl: url(routeId: "categoryGrid")
  }
`;
