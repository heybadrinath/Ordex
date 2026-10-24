import {
  CatalogEditor,
  type EditorEntity
} from '@components/admin/CatalogEditor.js';
import { FormButtons } from '@components/admin/FormButtons.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import React from 'react';

interface AttributeEditFormProps {
  action: string;
  gridUrl: string;
  attribute?: EditorEntity | null;
}
export default function AttributeEditForm({
  action,
  gridUrl,
  attribute
}: AttributeEditFormProps) {
  return (
    <Form
      action={action}
      method="PATCH"
      id="attributeEditForm"
      submitBtn={false}
    >
      <CatalogEditor
        kind="attribute"
        entity={attribute}
        aside={<Area id="rightSide" noOuter />}
      >
        <Area id="leftSide" noOuter />
      </CatalogEditor>
      <FormButtons formId="attributeEditForm" cancelUrl={gridUrl} />
    </Form>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    attribute(id: getContextValue("attributeId", null)) {
      attributeName attributeCode type isFilterable options { optionText }
    }
    action: url(routeId: "updateAttribute", params: [{key: "id", value: getContextValue("attributeUuid")}]),
    gridUrl: url(routeId: "attributeGrid")
  }
`;
