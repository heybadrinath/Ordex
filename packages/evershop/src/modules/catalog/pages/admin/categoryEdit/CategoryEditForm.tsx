import {
  CatalogEditor,
  type EditorEntity
} from '@components/admin/CatalogEditor.js';
import { FormButtons } from '@components/admin/FormButtons.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import React from 'react';

interface CategoryEditFormProps {
  action: string;
  gridUrl: string;
  category?: EditorEntity | null;
}

export default function CategoryEditForm({
  action,
  gridUrl,
  category
}: CategoryEditFormProps) {
  return (
    <Form
      action={action}
      method="PATCH"
      id="categoryEditForm"
      submitBtn={false}
    >
      <CatalogEditor
        kind="category"
        entity={category}
        aside={<Area id="rightSide" noOuter />}
      >
        <Area id="leftSide" noOuter />
      </CatalogEditor>
      <FormButtons formId="categoryEditForm" cancelUrl={gridUrl} />
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
    action: url(routeId: "updateCategory", params: [{key: "id", value: getContextValue("categoryUuid")}]),
    gridUrl: url(routeId: "categoryGrid")
  }
`;
