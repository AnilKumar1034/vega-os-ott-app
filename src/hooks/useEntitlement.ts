import {useCallback, useEffect, useState} from 'react';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {entitlementService} from '../services/entitlementService';
import {
  ContentAccessCheckResult,
  SubscriptionEntitlement,
} from '../types/subscription';
import {HomeContentItem} from '../data/home';
import {
  mockEntitlementService,
  mockEntitlementToSubscriptionEntitlement,
} from '../iap';

export const useEntitlement = () => {
  const {user, userProfile, loading: authLoading} = useAuth();
  const {activeProfile} = useProfile();
  const [entitlement, setEntitlement] = useState<SubscriptionEntitlement>(() =>
    entitlementService.resolveEntitlement(userProfile),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      entitlementService.clearCache();
      setEntitlement(entitlementService.resolveEntitlement(null));
      return;
    }

    let isCurrent = true;
    const resolved = entitlementService.resolveEntitlement(userProfile);
    setEntitlement(resolved);

    // Warm cache in background
    entitlementService
      .getEntitlement(user.uid, userProfile)
      .then((res) => {
        if (isCurrent) {
          setEntitlement(res);
        }
      })
      .catch(() => {});

    // Listen to local mock entitlement updates in development mode
    const unsubscribe = mockEntitlementService.addListener((updatedMock) => {
      if (!isCurrent) return;
      if (updatedMock && updatedMock.userId === user.uid) {
        setEntitlement(mockEntitlementToSubscriptionEntitlement(updatedMock));
      } else if (!updatedMock) {
        setEntitlement(entitlementService.resolveEntitlementFromProfile(userProfile));
      }
    });

    return () => {
      isCurrent = false;
      unsubscribe();
    };
  }, [user, userProfile]);

  const refresh = useCallback(async () => {
    if (!user) {
      return entitlementService.resolveEntitlement(null);
    }
    setLoading(true);
    try {
      const refreshed = await entitlementService.refreshEntitlement(user.uid);
      setEntitlement(refreshed);
      return refreshed;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkAccess = useCallback(
    (
      content: HomeContentItem | null | undefined,
      options?: {isLive?: boolean},
    ): ContentAccessCheckResult => {
      return entitlementService.checkContentAccess(
        userProfile,
        activeProfile,
        content,
        options,
      );
    },
    [activeProfile, userProfile],
  );

  return {
    entitlement,
    loading: loading || authLoading,
    refresh,
    checkAccess,
    isEntitled: entitlement.status === 'active' && entitlement.tier !== 'free',
    status: entitlement.status,
    planName: entitlement.planName,
    maxQuality: entitlement.maxQuality,
  };
};
