import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@components/common/ui/DropdownMenu.js';
import { toast } from '@components/common/ui/Sonner.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export default function AdminUser({ adminUser = null, logoutUrl, loginPage }) {
  const logout = async () => {
    const response = await fetch(logoutUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      window.location.href = loginPage;
    } else {
      toast.error(_('Logout failed'));
    }
  };

  if (!adminUser) {
    return null;
  }
  const { fullName, email } = adminUser;
  return (
    <div className="admin-user">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={_('Account menu')}
          render={<button type="button" className="admin-account-trigger" />}
        >
          <span className="admin-account-avatar" aria-hidden="true">
            {fullName[0]}
          </span>
          <span className="admin-account-copy">
            <strong>{fullName}</strong>
            <small>{email}</small>
          </span>
          <ChevronsUpDown size={14} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-45">
          <DropdownMenuLabel className="text-base font-normal">
            {_('Hello')} <span className="text-primary">{fullName}!</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            <div className="flex justify-start items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>{_('Logout')}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

AdminUser.propTypes = {
  adminUser: PropTypes.shape({
    email: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired
  }),
  loginPage: PropTypes.string.isRequired,
  logoutUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'adminAccount',
  sortOrder: 50
};

export const query = `
  query Query {
    adminUser: currentAdminUser {
      adminUserId
      fullName
      email
    },
    logoutUrl: url(routeId: "adminLogoutJson"),
    loginPage: url(routeId: "adminLogin")
  }
`;
