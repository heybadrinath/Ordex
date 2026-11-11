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

interface AttributeNewFormProps {
  action: string;
  gridUrl: string;
  attribute?: EditorEntity | null;
}
export default function AttributeNewForm({
  action,
  gridUrl,
  attribute
}: AttributeNewFormProps) {
  return (
    <Form
      action={action}
      method="POST"
      id="attributeNewForm"
      demoProfile="attribute"
      onSuccess={(response) => {
        toast.success(_('Attribute created successfully!'));
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
        kind="attribute"
        entity={attribute}
        aside={<Area id="rightSide" noOuter />}
      >
        <Area id="leftSide" noOuter />
      </CatalogEditor>
      <FormButtons formId="attributeNewForm" cancelUrl={gridUrl} />
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
    action: url(routeId: "createAttribute")
    gridUrl: url(routeId: "attributeGrid")
  }
`;
