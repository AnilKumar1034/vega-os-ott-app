import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  TVFocusGuideView,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {Routes} from '../constants/routes';
import {useAuth} from '../context/authContext';
import {useProfile} from '../profiles/hooks/useProfile';
import {useEntitlement} from '../hooks/useEntitlement';
import {getAvailablePlans, normalizeTier} from '../services/subscriptionService';
import {analyticsService} from '../analytics';
import {BillingCycle, SubscriptionPlan} from '../types/subscription';
import {isBackEvent, isKeyDown, isSelectEvent} from '../utils/inputUtils';
import {
  mockEntitlementService,
  mockIapConfig,
  mockIapService,
  MockPurchaseScenario,
} from '../iap';
import {styles} from './SubscriptionScreen.styles';

export const SubscriptionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {user, userProfile, logout} = useAuth();
  const {clearActiveProfile} = useProfile();
  const {entitlement: currentEntitlement, refresh: refreshEntitlement} =
    useEntitlement();
  const isMountedRef = useRef(true);

  const plans = getAvailablePlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [focusedId, setFocusedId] = useState<string>('card-premium');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const userSub = userProfile?.subscription;
    const tier = normalizeTier(userSub);
    return tier === 'free' ? 'premium' : tier;
  });
  const [updating, setUpdating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Development-only test scenario state
  const isDevMode = typeof __DEV__ !== 'undefined' && Boolean(__DEV__);
  const [devScenario, setDevScenario] = useState<MockPurchaseScenario>(() =>
    mockIapConfig.getScenario(),
  );

  const currentStatus = currentEntitlement.status;
  const currentPlanTier = currentEntitlement.tier;
  const hasActiveMockEntitlement =
    isDevMode &&
    currentEntitlement.status !== 'none' &&
    currentEntitlement.tier !== 'free';

  const showToast = useCallback((msg: string) => {
    if (!isMountedRef.current) return;
    setToastMsg(msg);
    setTimeout(() => {
      if (isMountedRef.current) {
        setToastMsg(null);
      }
    }, 3200);
  }, []);

  const cycleDevScenario = useCallback(() => {
    const current = mockIapConfig.getScenario();
    const next: MockPurchaseScenario =
      current === 'success'
        ? 'cancel'
        : current === 'cancel'
        ? 'failure'
        : 'success';
    mockIapConfig.setScenario(next);
    setDevScenario(next);
    showToast(`Dev IAP Scenario: ${next.toUpperCase()}`);
  }, [showToast]);

  const handleResetTestEntitlement = useCallback(async () => {
    if (!user?.uid) return;
    try {
      await mockEntitlementService.clearEntitlement(user.uid);
      await refreshEntitlement();
      showToast('Mock entitlement reset to Free tier.');
    } catch {
      showToast('Failed to reset test entitlement.');
    }
  }, [refreshEntitlement, showToast, user?.uid]);

  const handleCancelSubscription = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const canceled = await mockEntitlementService.cancelEntitlement(user.uid);
      if (canceled) {
        await refreshEntitlement();
        showToast(
          `[SIMULATED] Auto-renew canceled for ${canceled.planName}.\nAccess remains active until ${new Date(
            canceled.expiresAt,
          ).toLocaleDateString()}.`,
        );
      } else {
        showToast('No active subscription to cancel.');
      }
    } catch {
      showToast('Failed to cancel test subscription.');
    }
  }, [refreshEntitlement, showToast, user?.uid]);

  const handleExpireSubscription = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const expired = await mockEntitlementService.expireEntitlement(user.uid);
      if (expired) {
        await refreshEntitlement();
        showToast('[SIMULATED] Subscription expired immediately. Premium access revoked.');
      }
    } catch {
      showToast('Failed to expire test subscription.');
    }
  }, [refreshEntitlement, showToast, user?.uid]);

  const handleRestorePurchases = useCallback(async () => {
    if (restoring || updating || mockIapService.isRestoring() || mockIapService.isPurchasing()) {
      return;
    }
    if (!user?.uid) {
      showToast('Please sign in to restore purchases.');
      return;
    }

    setRestoring(true);
    try {
      const result = await mockIapService.restorePurchases(user.uid);
      await refreshEntitlement();

      if (result.status === 'restored') {
        showToast(
          `[SIMULATED] Successfully restored ${result.entitlement?.planName || 'active'} subscription!`,
        );
      } else if (result.status === 'expired') {
        showToast(
          `[SIMULATED] Restored subscription for ${result.entitlement?.planName || 'previous plan'}, but it has expired.`,
        );
      } else if (result.status === 'no_entitlement_found') {
        showToast('No previous mock subscription found for this account.');
      } else {
        showToast(result.message || 'Failed to restore subscription from local storage.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Restore error occurred.');
    } finally {
      if (isMountedRef.current) {
        setRestoring(false);
      }
    }
  }, [refreshEntitlement, restoring, showToast, updating, user?.uid]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    analyticsService
      .trackSubscriptionStatusViewed({
        plan_name: currentEntitlement.planName || userProfile?.subscription || 'none',
        status: currentStatus,
        source_screen: route.params?.sourceScreen || 'Settings',
      })
      .catch(() => {});
  }, [currentEntitlement.planName, currentStatus, route.params?.sourceScreen, userProfile?.subscription]);

  const handlePlanSelect = useCallback(
    async (plan: SubscriptionPlan) => {
      if (updating || mockIapService.isPurchasing()) return;

      if (currentPlanTier === plan.tier && currentStatus === 'active') {
        showToast(`You are already subscribed to ${plan.name}.`);
        return;
      }

      setUpdating(true);
      setSelectedPlanId(plan.id);

      try {
        // Resolve mock product SKU (e.g. 'premium_monthly' or 'basic_annually')
        const productId = `${plan.id}_${billingCycle}`;
        const result = await mockIapService.purchase(productId);

        if (!isMountedRef.current) return;

        if (result.status === 'success') {
          // Day 3: Grant local development entitlement upon confirmed mock purchase
          if (user?.uid) {
            await mockEntitlementService.grantEntitlement(
              user.uid,
              plan,
              billingCycle,
              result.transactionId,
            );
            await refreshEntitlement();
          }

          await analyticsService.trackSubscriptionPlanSelected({
            plan_id: plan.id,
            plan_name: plan.name,
            billing_cycle: billingCycle,
            price:
              billingCycle === 'annually'
                ? plan.annualPrice
                : plan.monthlyPrice,
          });

          showToast(
            `[SIMULATED] Purchase successful for ${plan.name} (${billingCycle})!\nMock Entitlement Active. Txn: ${result.transactionId}`,
          );
        } else if (result.status === 'cancelled') {
          showToast('Purchase cancelled by user.');
        } else {
          showToast(
            result.message || 'Simulated purchase failed. Please try again.',
          );
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          showToast(err.message || 'Purchase error occurred. Try again.');
        }
      } finally {
        if (isMountedRef.current) {
          setUpdating(false);
        }
      }
    },
    [
      billingCycle,
      currentPlanTier,
      currentStatus,
      refreshEntitlement,
      showToast,
      updating,
      user?.uid,
    ],
  );

  const handleSignOut = async () => {
    try {
      mockEntitlementService.clearMemoryCache();
      await clearActiveProfile();
      await logout();
      navigation.navigate(Routes.Login);
    } catch {
      // ignore
    }
  };

  const getTopBarItems = useCallback(() => {
    const items: string[] = [];
    if (isDevMode) {
      items.push('dev-scenario');
      if (hasActiveMockEntitlement && currentStatus === 'active') {
        items.push('dev-cancel');
      }
      if (hasActiveMockEntitlement && currentStatus !== 'expired') {
        items.push('dev-expire');
      }
      if (hasActiveMockEntitlement) {
        items.push('dev-reset');
      }
    }
    items.push('restore-purchases');
    items.push('sign-out');
    return items;
  }, [currentStatus, hasActiveMockEntitlement, isDevMode]);

  useTVEventHandler((evt) => {
    if (!evt || !isKeyDown(evt.eventKeyAction)) return;
    const type = evt.eventType?.toLowerCase();

    if (isBackEvent(type)) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate(Routes.Home);
      }
      return;
    }

    const topBarItems = getTopBarItems();
    const topBarIndex = topBarItems.indexOf(focusedId);

    if (topBarIndex !== -1) {
      if (isSelectEvent(type)) {
        if (focusedId === 'dev-scenario') {
          cycleDevScenario();
        } else if (focusedId === 'dev-cancel') {
          handleCancelSubscription();
        } else if (focusedId === 'dev-expire') {
          handleExpireSubscription();
        } else if (focusedId === 'dev-reset') {
          handleResetTestEntitlement();
        } else if (focusedId === 'restore-purchases') {
          handleRestorePurchases();
        } else if (focusedId === 'sign-out') {
          handleSignOut();
        }
      } else if (type === 'left' && topBarIndex > 0) {
        setFocusedId(topBarItems[topBarIndex - 1]);
      } else if (type === 'right' && topBarIndex < topBarItems.length - 1) {
        setFocusedId(topBarItems[topBarIndex + 1]);
      } else if (type === 'down') {
        setFocusedId('cycle-toggle');
      }
      return;
    }

    if (focusedId === 'cycle-toggle') {
      if (type === 'left' || type === 'right' || isSelectEvent(type)) {
        setBillingCycle((prev) =>
          prev === 'annually' ? 'monthly' : 'annually',
        );
      } else if (type === 'down') {
        setFocusedId(`card-${selectedPlanId || 'premium'}`);
      } else if (type === 'up') {
        const items = getTopBarItems();
        setFocusedId(items[0] || 'restore-purchases');
      }
      return;
    }

    if (focusedId.startsWith('card-')) {
      const currentPlanIndex = plans.findIndex(
        (p) => `card-${p.id}` === focusedId,
      );
      if (type === 'left' && currentPlanIndex > 0) {
        setFocusedId(`card-${plans[currentPlanIndex - 1].id}`);
      } else if (type === 'right' && currentPlanIndex < plans.length - 1) {
        setFocusedId(`card-${plans[currentPlanIndex + 1].id}`);
      } else if (type === 'up') {
        setFocusedId('cycle-toggle');
      } else if (isSelectEvent(type) && currentPlanIndex >= 0) {
        handlePlanSelect(plans[currentPlanIndex]);
      }
    }
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      testID="subscription-screen">
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.brandLogo}>LOGIXSTREAM</Text>
        <View style={styles.topBarRight}>
          {isDevMode && (
            <TouchableOpacity
              accessibilityHint="Cycle dev mock IAP scenario"
              style={[
                styles.devScenarioButton,
                focusedId === 'dev-scenario' && styles.devScenarioButtonFocused,
              ]}
              onFocus={() => setFocusedId('dev-scenario')}
              onPress={cycleDevScenario}
              activeOpacity={0.8}
              role="button"
              aria-label={`Dev IAP scenario currently ${devScenario}`}
              testID="dev-scenario-toggle">
              <Text style={styles.devScenarioText}>
                DEV IAP: <Text style={styles.devScenarioBold}>{devScenario.toUpperCase()}</Text>
              </Text>
            </TouchableOpacity>
          )}
          {isDevMode && hasActiveMockEntitlement && currentStatus === 'active' && (
            <TouchableOpacity
              accessibilityHint="Simulate subscription cancellation"
              style={[
                styles.devCancelButton,
                focusedId === 'dev-cancel' && styles.devCancelButtonFocused,
              ]}
              onFocus={() => setFocusedId('dev-cancel')}
              onPress={handleCancelSubscription}
              activeOpacity={0.8}
              role="button"
              aria-label="Simulate subscription cancellation"
              testID="dev-cancel-button">
              <Text style={styles.devCancelButtonText}>CANCEL SUB</Text>
            </TouchableOpacity>
          )}
          {isDevMode && hasActiveMockEntitlement && currentStatus !== 'expired' && (
            <TouchableOpacity
              accessibilityHint="Simulate immediate expiration"
              style={[
                styles.devExpireButton,
                focusedId === 'dev-expire' && styles.devExpireButtonFocused,
              ]}
              onFocus={() => setFocusedId('dev-expire')}
              onPress={handleExpireSubscription}
              activeOpacity={0.8}
              role="button"
              aria-label="Simulate immediate expiration"
              testID="dev-expire-button">
              <Text style={styles.devExpireButtonText}>EXPIRE NOW</Text>
            </TouchableOpacity>
          )}
          {hasActiveMockEntitlement && (
            <TouchableOpacity
              accessibilityHint="Reset test entitlement to Free tier"
              style={[
                styles.devResetButton,
                focusedId === 'dev-reset' && styles.devResetButtonFocused,
              ]}
              onFocus={() => setFocusedId('dev-reset')}
              onPress={handleResetTestEntitlement}
              activeOpacity={0.8}
              role="button"
              aria-label="Reset test entitlement"
              testID="dev-reset-button">
              <Text style={styles.devResetButtonText}>RESET TEST SUB</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityHint="Restore purchases from local storage"
            style={[
              styles.restoreButton,
              focusedId === 'restore-purchases' && styles.restoreButtonFocused,
            ]}
            onFocus={() => setFocusedId('restore-purchases')}
            onPress={handleRestorePurchases}
            activeOpacity={0.8}
            role="button"
            aria-label="Restore purchases"
            testID="restore-purchases-button">
            <Text style={styles.restoreButtonText}>
              {restoring ? 'RESTORING...' : 'RESTORE PURCHASES'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityHint="Sign out of account"
            style={[
              styles.signOutButton,
              focusedId === 'sign-out' && styles.signOutButtonFocused,
            ]}
            onFocus={() => setFocusedId('sign-out')}
            onPress={handleSignOut}
            activeOpacity={0.8}
            role="button"
            aria-label="Sign out"
            testID="subscription-sign-out-button">
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Header & Toggle */}
      <View style={styles.headerSection}>
        <Text style={styles.stepText}>STEP 1 OF 2</Text>
        <Text style={styles.mainHeading}>
          Choose the plan that's right for you
        </Text>

        {/* Development Mock Entitlement Status Banner */}
        {hasActiveMockEntitlement && (
          <View
            style={[
              styles.devEntitlementBanner,
              currentStatus === 'canceled' && styles.devEntitlementBannerCanceled,
              currentStatus === 'expired' && styles.devEntitlementBannerExpired,
            ]}
            testID="dev-entitlement-banner">
            <View
              style={[
                styles.devEntitlementDot,
                currentStatus === 'canceled' && styles.devEntitlementDotCanceled,
                currentStatus === 'expired' && styles.devEntitlementDotExpired,
              ]}
            />
            <Text style={styles.devEntitlementBannerText}>
              DEV MOCK ENTITLEMENT:{' '}
              <Text style={styles.devEntitlementHighlight}>
                {currentEntitlement.planName.toUpperCase()} (
                {currentEntitlement.status.toUpperCase()})
              </Text>
              {currentEntitlement.expiresAt ? (
                <Text style={styles.devEntitlementExpiryText}>
                  {currentStatus === 'canceled'
                    ? ` • Access remains valid until: ${new Date(currentEntitlement.expiresAt).toLocaleDateString()}`
                    : currentStatus === 'expired'
                    ? ` • Expired on: ${new Date(currentEntitlement.expiresAt).toLocaleDateString()}`
                    : ` • Valid until: ${new Date(currentEntitlement.expiresAt).toLocaleDateString()}`}
                </Text>
              ) : null}
            </Text>
          </View>
        )}

        <TouchableOpacity accessibilityHint="TODO"
          style={[
            styles.cycleToggleContainer,
            focusedId === 'cycle-toggle' && styles.cycleToggleContainerFocused,
          ]}
          onFocus={() => setFocusedId('cycle-toggle')}
          onPress={() =>
            setBillingCycle((prev) =>
              prev === 'annually' ? 'monthly' : 'annually',
            )
          }
          activeOpacity={0.9}
          role="button"
          aria-label={`Billing cycle toggle, currently ${billingCycle}`}
          testID="cycle-toggle-button">
          <View
            style={[
              styles.cycleTab,
              billingCycle === 'annually' && styles.cycleTabActive,
            ]}>
            <Text
              style={[
                styles.cycleTabText,
                billingCycle === 'annually' && styles.cycleTabTextActive,
              ]}>
              Annually
            </Text>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>Best value</Text>
            </View>
          </View>
          <View
            style={[
              styles.cycleTab,
              billingCycle === 'monthly' && styles.cycleTabActive,
            ]}>
            <Text
              style={[
                styles.cycleTabText,
                billingCycle === 'monthly' && styles.cycleTabTextActive,
              ]}>
              Monthly
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Plans Horizontal Row */}
      <TVFocusGuideView style={styles.cardsRow} autoFocus>
        {plans.map((plan) => {
          const isFocused = focusedId === `card-${plan.id}`;
          const isCurrentActive =
            currentPlanTier === plan.tier && currentStatus === 'active';
          const isSelected = selectedPlanId === plan.id;
          const price =
            billingCycle === 'annually'
              ? plan.annualPriceFormatted
              : plan.monthlyPriceFormatted;
          const cycleLabel =
            billingCycle === 'annually' ? '/ annually' : '/ monthly';

          return (
            <View key={plan.id} style={styles.cardWrapper}>
              {plan.isMostRecommended ? (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Most recommended</Text>
                </View>
              ) : (
                <View style={styles.recommendedBadgePlaceholder} />
              )}

              <TouchableOpacity
                accessibilityHint="Select subscription plan"
                style={[
                  styles.card,
                  isFocused && styles.cardFocused,
                  isSelected && styles.cardSelected,
                ]}
                onFocus={() => setFocusedId(`card-${plan.id}`)}
                onPress={() => handlePlanSelect(plan)}
                activeOpacity={0.85}
                role="button"
                aria-label={`${plan.name} plan, ${price} ${cycleLabel}`}
                testID={`plan-card-${plan.id}`}>
                {/* Colored Header Banner */}
                <View
                  style={[
                    styles.cardBanner,
                    {backgroundColor: plan.accentColor},
                  ]}>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkBadgeText}>✓</Text>
                    </View>
                  )}

                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceAmount}>{price}</Text>
                    <Text style={styles.priceCycle}>{cycleLabel}</Text>
                  </View>

                  <View style={styles.discountChip}>
                    <Text style={styles.discountText}>
                      Save {plan.savePercent}%
                    </Text>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <View style={styles.qualitySection}>
                    <Text style={styles.qualityRating}>
                      {plan.qualityLabel.split(' ')[0]}
                    </Text>
                    <Text style={styles.qualitySub}>Video & sound quality</Text>
                  </View>

                  <View style={styles.featuresList}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Text style={styles.checkmark}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.selectButton,
                      isCurrentActive && styles.selectButtonActive,
                      isFocused && styles.selectButtonFocused,
                    ]}>
                    <Text
                      style={[
                        styles.selectButtonText,
                        isFocused && styles.selectButtonTextFocused,
                      ]}>
                      {updating && isSelected
                        ? 'PURCHASING...'
                        : isCurrentActive
                        ? 'CURRENT PLAN'
                        : isSelected
                        ? 'SELECTED'
                        : 'SELECT PLAN'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </TVFocusGuideView>

      {(updating || restoring) && (
        <ActivityIndicator
          size="large"
          color="#E50914"
          style={styles.loadingIndicator}
        />
      )}

      {toastMsg && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}
    </ScrollView>
  );
};
