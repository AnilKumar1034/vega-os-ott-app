import React, {ReactNode, useEffect, useState} from 'react';
import {
  AuthUser,
  getUserProfile,
  LoginParams,
  loginUser,
  logoutUser,
  RegisterParams,
  UpdateProfileParams,
  updateUserProfile,
  registerUser,
  UserProfileData,
  getStoredSession,
} from '../services/authService';
import {AuthContext} from './authContext';

export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const session = await getStoredSession();
        if (!isMounted) {
          return;
        }

        if (session?.user) {
          setUser(session.user);
          const profile = await getUserProfile(session.user.uid);
          if (isMounted) {
            setUserProfile(profile);
          }
        } else if (isMounted) {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.log('AuthProvider init error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const register = async (params: RegisterParams) => {
    setLoading(true);
    try {
      const {user: newUser, profile} = await registerUser(params);
      setUser(newUser);
      setUserProfile(profile);
    } finally {
      setLoading(false);
    }
  };

  const login = async (params: LoginParams) => {
    setLoading(true);
    try {
      const {user: loggedInUser, profile} = await loginUser(params);
      setUser(loggedInUser);
      setUserProfile(profile);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (params: UpdateProfileParams) => {
    setLoading(true);
    try {
      const updatedProfile = await updateUserProfile(params);
      const session = await getStoredSession();
      if (session?.user) {
        setUser({
          ...session.user,
          displayName: params.username ?? session.user.displayName,
        });
      }
      setUserProfile(updatedProfile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        register,
        login,
        logout,
        updateProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
