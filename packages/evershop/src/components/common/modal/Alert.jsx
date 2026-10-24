import { Button } from '@components/common/ui/Button.js';
import { assign } from '@evershop/evershop/lib/util/assign';
import { produce } from 'immer';
import PropTypes from 'prop-types';
import React, { useReducer } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@components/common/ui/Dialog.js';

const AlertContext = React.createContext();
export const useAlertContext = () => React.useContext(AlertContext);

function reducer(state, action) {
  switch (action.type) {
    case 'close':
      return { ...state, showing: false, closing: false };
    case 'closing':
      return { ...state, showing: true, closing: true };
    case 'open':
      return { ...state, showing: true, closing: false };
    default:
      throw new Error();
  }
}

const alertReducer = produce((draff, action) => {
  switch (action.type) {
    case 'open':
      draff = { ...action.payload };
      return draff;
    case 'remove':
      return {};
    case 'update':
      assign(draff, action.payload);
      return draff;
    default:
      throw new Error();
  }
});

function Alert({ children }) {
  const [alert, dispatchAlert] = useReducer(alertReducer, {});
  const [state, dispatch] = useReducer(reducer, {
    showing: false,
    closing: false
  });

  const openAlert = ({ heading, content, primaryAction, secondaryAction }) => {
    dispatchAlert({
      type: 'open',
      payload: {
        heading,
        content,
        primaryAction,
        secondaryAction
      }
    });
    dispatch({ type: 'open' });
  };

  return (
    <AlertContext.Provider
      value={{
        dispatchAlert,
        openAlert,
        closeAlert: () => {
          dispatch({ type: 'close' });
          dispatchAlert({ type: 'remove' });
        }
      }}
    >
      {children}
      <Dialog
        open={state.showing}
        onOpenChange={(open) => {
          if (!open) {
            dispatch({ type: 'close' });
            dispatchAlert({ type: 'remove' });
          }
        }}
      >
        <DialogContent className="confirmation-dialog">
          <DialogHeader>
            <DialogTitle>{alert.heading || 'Confirm action'}</DialogTitle>
            <DialogDescription render={<div />}>
              {alert.content}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {alert.primaryAction && (
              <Button
                onClick={alert.primaryAction.onAction}
                variant={alert.primaryAction.variant}
                isLoading={alert.primaryAction.isLoading}
              >
                {alert.primaryAction.title}
              </Button>
            )}
            {alert.secondaryAction && (
              <Button
                onClick={alert.secondaryAction.onAction}
                variant={alert.secondaryAction.variant}
                isLoading={alert.secondaryAction.isLoading}
              >
                {alert.secondaryAction.title}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
}

Alert.propTypes = {
  children: PropTypes.node.isRequired
};

export { Alert };
