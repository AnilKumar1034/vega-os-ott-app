import {HomeContentItem} from '../data/home';
import {UserProfile} from '../profiles/types/Profile';
import {
  ContentAccessCheckResult,
  SubscriptionEntitlement,
  SubscriptionStatus,
  SubscriptionTier,
  TIER_RANK,
} from '../types/subscription';
import {canProfileAccessContent} from '../utils/contentAccessPolicy';
import {UserProfileData, getUserProfile} from './authService';
import {
  getPlanById,
  getPlanByName,
  getSubscriptionStatus,
  normalizeTier,
} from './subscriptionService';
import {strings} from '../constants/strings';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

export class EntitlementService {
  private static instance: EntitlementService;

  private cache: Map<string, {entitlement: SubscriptionEntitlement; cachedAt: number}> =
    new Map();
  private pendingRequests: Map<string, Promise<SubscriptionEntitlement>> =
    new Map();
  private requestSequenceMap: Map<string, number> = new Map();

  public static getInstance(): EntitlementService {
    if (!EntitlementService.instance) {
      EntitlementService.instance = new EntitlementService();
    }
    return EntitlementService.instance;
  }

  /**
   * Clears all cached entitlements. Must be invoked upon user sign-out or switching accounts.
   */
  public clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.requestSequenceMap.clear();
  }

  /**
   * Invalidates cached entitlement for a specific user.
   */
  public invalidateUser(userId: string): void {
    if (userId) {
      this.cache.delete(userId);
    }
  }

  /**
   * Resolves the subscription entitlement from a loaded user profile object.
   */
  public resolveEntitlementFromProfile(
    profile: UserProfileData | null,
  ): SubscriptionEntitlement {
    if (!profile) {
      return {
        userId: '',
        status: 'none',
        planId: 'free',
        planName: 'Free',
        tier: 'free',
        maxQuality: 'SD',
        lastVerifiedAt: Date.now(),
      };
    }

    const status: SubscriptionStatus = getSubscriptionStatus(profile);
    const subName = profile.subscription || 'Free';
    const tier: SubscriptionTier = normalizeTier(subName);
    const matchedPlan = getPlanByName(subName) || getPlanById(tier);

    let maxQuality: 'SD' | 'HD' | '4K' = 'HD';
    if (tier === 'premium' || tier === 'ultra4k') {
      maxQuality = '4K';
    } else if (tier === 'mobile' || tier === 'free') {
      maxQuality = 'SD';
    }

    return {
      userId: profile.uid,
      status,
      planId: matchedPlan?.id || tier,
      planName: matchedPlan?.name || subName,
      tier,
      maxQuality,
      startedAt: profile.subscriptionStartedAt,
      expiresAt: profile.subscriptionExpiresAt,
      billingCycle: profile.billingCycle as any,
      lastVerifiedAt: Date.now(),
    };
  }

  /**
   * Retrieves current entitlement for user. Uses cache when valid, otherwise reads from backend.
   */
  public async getEntitlement(
    userId: string,
    currentProfile?: UserProfileData | null,
  ): Promise<SubscriptionEntitlement> {
    if (!userId) {
      return this.resolveEntitlementFromProfile(null);
    }

    const cached = this.cache.get(userId);
    const now = Date.now();
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      return cached.entitlement;
    }

    // Reuse existing in-flight request for this user to prevent duplicate fetches
    const existingPromise = this.pendingRequests.get(userId);
    if (existingPromise) {
      return existingPromise;
    }

    const seq = (this.requestSequenceMap.get(userId) || 0) + 1;
    this.requestSequenceMap.set(userId, seq);

    const fetchPromise = (async () => {
      try {
        const profile = await getUserProfile(userId);
        const resolvedProfile = profile || currentProfile || null;
        const entitlement = this.resolveEntitlementFromProfile(resolvedProfile);

        // Discard stale asynchronous response if a newer request was dispatched
        if (this.requestSequenceMap.get(userId) === seq) {
          this.cache.set(userId, {entitlement, cachedAt: Date.now()});
        }
        return entitlement;
      } catch {
        // Network error must not be interpreted as expired.
        // Return existing cached entitlement if available, or fall back safely.
        if (cached) {
          return cached.entitlement;
        }
        if (currentProfile) {
          return this.resolveEntitlementFromProfile(currentProfile);
        }
        const fallback: SubscriptionEntitlement = {
          userId,
          status: 'unknown',
          planId: 'unknown',
          planName: 'Unknown',
          tier: 'free',
          maxQuality: 'SD',
          lastVerifiedAt: Date.now(),
        };
        return fallback;
      } finally {
        this.pendingRequests.delete(userId);
      }
    })();

    this.pendingRequests.set(userId, fetchPromise);
    return fetchPromise;
  }

  /**
   * Forces a refresh from the authoritative backend (Firestore).
   */
  public async refreshEntitlement(
    userId: string,
  ): Promise<SubscriptionEntitlement> {
    this.invalidateUser(userId);
    return this.getEntitlement(userId);
  }

  /**
   * Evaluates if a given content item is free/unrestricted.
   */
  public isContentFree(
    content: HomeContentItem | null | undefined,
    options?: {isLive?: boolean},
  ): boolean {
    if (!content) {
      return false;
    }
    // Live TV channels in freeLiveChannels are all free-to-air
    if (options?.isLive || (content as any).isLive) {
      return true;
    }
    if ((content as any).isFree === true) {
      return true;
    }
    const badge = String(content.badge || '').toUpperCase();
    if (badge === 'FREE' || badge === 'FREE PREVIEW') {
      return true;
    }
    // Specific free trailers
    const url = String(content.videoUrl || '').toLowerCase();
    if (
      url.includes('sintel/trailer.mp4') ||
      url.includes('bunny/trailer.mp4') ||
      url.includes('cc0-videos/flower.mp4')
    ) {
      return true;
    }
    return false;
  }

  /**
   * Identifies whether the content item specifically requires a 4K UHD plan.
   */
  public isContent4kUhd(content: HomeContentItem | null | undefined): boolean {
    if (!content) return false;
    const badge = String(content.badge || '').toUpperCase();
    const quality = String((content as any).quality || '').toUpperCase();
    if (badge.includes('4K') || badge.includes('UHD') || quality.includes('4K') || quality.includes('UHD')) {
      return true;
    }
    const id = String(content.id || '').toLowerCase();
    if (id.startsWith('global-blockbusters-') && badge === '4K UHD') {
      return true;
    }
    return false;
  }

  /**
   * Authoritative content-level access check.
   * Combines profile maturity restrictions and account subscription entitlement.
   */
  public checkContentAccess(
    userProfile: UserProfileData | null | undefined,
    activeProfile: UserProfile | null | undefined,
    content: HomeContentItem | null | undefined,
    options?: {isLive?: boolean},
  ): ContentAccessCheckResult {
    if (!content) {
      return {
        state: 'not_entitled',
        isEntitled: false,
        reason: 'not_entitled',
        message: 'Content not found.',
      };
    }

    // Step 1: Check Kids / Maturity rating restrictions first.
    // A paid subscription must NEVER bypass parental controls.
    if (!canProfileAccessContent(activeProfile, content)) {
      return {
        state: 'not_entitled',
        isEntitled: false,
        reason: 'parental_restricted',
        message:
          strings.parentalControls?.contentRestrictedMessage ||
          'This content is restricted for this viewing profile.',
      };
    }

    // Step 2: Unrestricted / Free content is always accessible
    if (this.isContentFree(content, options)) {
      return {
        state: 'entitled',
        isEntitled: true,
        reason: 'free_content',
        message: 'Free content accessible.',
      };
    }

    // Step 3: Protected content requires an authenticated user with valid subscription
    if (!userProfile) {
      return {
        state: 'not_entitled',
        isEntitled: false,
        reason: 'auth_required',
        message:
          strings.auth?.notSignedInSubtitle ||
          'Please sign in or create an account to access premium features.',
        requiredPlan: 'Standard',
      };
    }

    const entitlement = this.resolveEntitlementFromProfile(userProfile);

    // Step 4: Handle Expired Subscription
    if (entitlement.status === 'expired') {
      return {
        state: 'expired',
        isEntitled: false,
        reason: 'expired',
        message:
          'Your subscription has expired. Please renew your plan to continue watching.',
        requiredPlan: entitlement.planName,
      };
    }

    // Step 5: Check if user has no subscription or free tier for protected content
    if (
      entitlement.status === 'none' ||
      entitlement.tier === 'free' ||
      TIER_RANK[entitlement.tier] === 0
    ) {
      return {
        state: 'not_entitled',
        isEntitled: false,
        reason: 'not_entitled',
        message:
          'A subscription is required to watch this title. Choose a plan to start streaming.',
        requiredPlan: 'Standard',
        requiredTier: 'standard',
      };
    }

    // Step 6: 4K UHD content check
    if (this.isContent4kUhd(content)) {
      const userRank = TIER_RANK[entitlement.tier];
      const requiredRank = TIER_RANK.premium;
      if (userRank < requiredRank) {
        return {
          state: 'not_entitled',
          isEntitled: false,
          reason: 'upgrade_required',
          message:
            'This title is in 4K Ultra HD. Upgrade to the Premium plan to enjoy 4K streaming.',
          requiredPlan: 'Premium',
          requiredTier: 'premium',
        };
      }
    }

    // Step 7: Entitled
    return {
      state: 'entitled',
      isEntitled: true,
      reason: 'entitled',
      message: 'Access granted.',
    };
  }
}

export const entitlementService = EntitlementService.getInstance();
