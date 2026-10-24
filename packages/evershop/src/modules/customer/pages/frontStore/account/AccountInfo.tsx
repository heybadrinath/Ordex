import AccountInfo from '@components/frontStore/customer/AccountInfo.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { UserRound } from 'lucide-react';

/**
 * Account dashboard block: the account information section (name, email,
 * edit form). A page component rather than markup inside the `MyAccount`
 * shell so a theme can move it from `layouts.json`.
 */
export default function AccountInfoBlock(): React.ReactElement {
  return (
    <section className="account-info-section py-6">
      <h2 className="mb-4 h5">
        <UserRound size={18} strokeWidth={1.5} />
        {_('Your details')}
      </h2>
      <p className="section-note">
        The contact details you use when you shop with us.
      </p>
      <AccountInfo />
    </section>
  );
}

export const layout = {
  areaId: 'accountPageContent',
  sortOrder: 20
};
