import {
  CatalogEditor,
  type EditorEntity
} from '@components/admin/CatalogEditor.js';
import { FormButtons } from '@components/admin/FormButtons.js';
import Area from '@components/common/Area.js';
import { Form } from '@components/common/form/Form.js';
import React from 'react';

interface CollectionEditFormProps {
  action: string;
  gridUrl: string;
  collection?: EditorEntity | null;
}

export default function CollectionEditForm({
  action,
  gridUrl,
  collection
}: CollectionEditFormProps) {
  return (
    <Form
      action={action}
      method="PATCH"
      id="collectionEditForm"
      submitBtn={false}
    >
      <CatalogEditor kind="collection" entity={collection}>
        <Area id="collectionFormInner" noOuter />
      </CatalogEditor>
      <FormButtons formId="collectionEditForm" cancelUrl={gridUrl} />
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
    action: url(routeId: "updateCollection", params: [{key: "id", value: getContextValue("collectionUuid")}]),
    gridUrl: url(routeId: "collectionGrid")
  }
`;
