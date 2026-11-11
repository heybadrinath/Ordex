import { PageHeading } from '@components/admin/PageHeading.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { UserRound } from 'lucide-react';

export interface CustomerEditPageHeadingProps {
  backUrl: string;
  customer?: {
    fullName: string;
    email: string;
  } | null;
}

export default function CustomerEditPageHeading({
  backUrl,
  customer = null
}: CustomerEditPageHeadingProps) {
  return (
    <PageHeading
      backUrl={backUrl}
      eyebrow="Customer profile"
      description={
        customer?.email ||
        'Customer details and order history, together in one place.'
      }
      icon={<UserRound size={24} />}
      heading={customer ? customer.fullName : _('Create A New Customer')}
    />
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

export const query = `
  query Query {
    customer(id: getContextValue("customerUuid", null)) {
      fullName
      email
    }
    backUrl: url(routeId: "customerGrid")
  }
`;
