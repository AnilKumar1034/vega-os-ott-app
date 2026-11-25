/**
 * Watch Party Lobby Loading Component
 * Loading state wrapper tailored for WatchPartyLobbyScreen.
 * LogiXstream Amazon Vega OS React Native Application
 */

import React from 'react';
import {WatchPartyLoading} from './WatchPartyLoading';

export interface WatchPartyLobbyLoadingProps {
  message?: string;
}

export const WatchPartyLobbyLoading: React.FC<WatchPartyLobbyLoadingProps> = ({
  message = 'Connecting to Watch Party Lobby...',
}) => {
  return <WatchPartyLoading message={message} />;
};
