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

interface CollectionNewFormProps {
  action: string;
  gridUrl: string;
  collection?: EditorEntity | null;
}

export default function CollectionNewForm({
  action,
  gridUrl,
  collection
}: CollectionNewFormProps) {
  return (
    <Form
      id="collectionNewForm"
      demoProfile="collection"
      action={action}
      submitBtn={false}
      method="POST"
      onSuccess={(response) => {
        toast.success(_('Collection created successfully!'));
        setTimeout(() => {
          const editUrl = response.data.links.find(
            (link) => link.rel === 'edit'
          ).href;
          window.location.href = editUrl;
        }, 1500);
      }}
    >
      <CatalogEditor kind="collection" entity={collection}>
        <Area id="collectionFormInner" noOuter />
      </CatalogEditor>
      <FormButtons formId="collectionNewForm" cancelUrl={gridUrl} />
    </Form>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    collection(code: getContextValue("collectionCode", null)) {
      name code
    }
    action: url(routeId: "createCollection")
    gridUrl: url(routeId: "collectionGrid")
  }
`;
