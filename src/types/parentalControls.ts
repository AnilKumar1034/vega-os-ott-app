export interface ParentalControlsSettings {
  pinHash?: string;
  pinEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PinActionType =
  | 'unlock_session'
  | 'switch_to_adult'
  | 'setup_pin'
  | 'change_pin'
  | 'remove_pin'
  | 'edit_kids_profile'
  | 'manage_profiles';
