/**
 * Watch Party Lobby Error Component
 * Error state wrapper tailored for WatchPartyLobbyScreen.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {
  WatchPartyErrorState,
  WatchPartyErrorStateProps,
} from './WatchPartyErrorState';

export const WatchPartyLobbyError: React.FC<WatchPartyErrorStateProps> = (
  props,
) => {
  return <WatchPartyErrorState {...props} />;
};
