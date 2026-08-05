import {createContext, useContext} from 'react';
import type {
  AuthUser,
  LoginParams,
  RegisterParams,
  UpdateProfileParams,
  UserProfileData,
} from '../services/authService';

export interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  register: (params: RegisterParams) => Promise<void>;
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (params: UpdateProfileParams) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);
