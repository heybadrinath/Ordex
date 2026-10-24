import {
  CatalogEditor,
  type EditorEntity
} from '@components/admin/CatalogEditor.js';
import { FormButtons } from '@components/admin/FormButtons.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import { toast } from '@components/common/ui/Sonner.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';

interface CategoryNewFormProps {
  action: string;
  gridUrl: string;
  category?: EditorEntity | null;
}

export default function CategoryNewForm({
  action,
  gridUrl,
  category
}: CategoryNewFormProps) {
  return (
    <Form
      action={action}
      method="POST"
      id="categoryNewForm"
      demoProfile="category"
      onSuccess={(response) => {
        toast.success(_('Category created successfully!'));
        setTimeout(() => {
          const editUrl = response.data.links.find(
            (link) => link.rel === 'edit'
          ).href;
          window.location.href = editUrl;
        }, 1500);
      }}
      submitBtn={false}
    >
      <CatalogEditor
        kind="category"
        entity={category}
        aside={<Area id="rightSide" noOuter />}
      >
        <Area id="leftSide" noOuter />
      </CatalogEditor>
      <FormButtons formId="categoryNewForm" cancelUrl={gridUrl} />
    </Form>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    category(id: getContextValue("categoryId", null)) {
      name status url image { url }
    }
    action: url(routeId: "createCategory")
    gridUrl: url(routeId: "categoryGrid")
  }
`;
