import {StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {sizes} from '../theme/sizes';

export const THEME = {
  bg: '#0E0618',
  cardBg: '#180E24',
  inputBg: '#150A20',
  inputBorder: '#351B4D',
  inputFocusedBorder: '#C084FC',
  purplePill: '#7928CA',
  purplePillActive: '#9333EA',
  purpleButton: '#581C87',
  purpleButtonFocused: '#A855F7',
  keyDefaultBg: 'rgba(255, 255, 255, 0.05)',
  keyDefaultBorder: 'rgba(255, 255, 255, 0.08)',
  keyFocusedBg: '#FFFFFF',
  keyFocusedText: '#000000',
  textMuted: '#A79BB7',
  micPurple: '#C084FC',
};

export const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  content: {
    flex: 1,
    paddingLeft: sizes.menuWidthCollapsed || 90,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },

  // 1. Top Header Area
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingRight: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 16,
  },
  avatarButtonFocused: {
    borderColor: '#FFFFFF',
    transform: [{scale: 1.08}],
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarKidsEmoji: {
    fontSize: 22,
  },

  searchCenterArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    maxWidth: 820,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.inputBorder,
    paddingHorizontal: 14,
    marginRight: 12,
  },
  searchBarContainerFocused: {
    borderColor: THEME.inputFocusedBorder,
    backgroundColor: '#1C0D2E',
  },
  micIconWrapper: {
    marginRight: 10,
  },
  micSymbol: {
    fontSize: 18,
    color: THEME.micPurple,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  headerClearButton: {
    padding: 6,
    marginLeft: 6,
  },
  headerClearSymbol: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: 'bold',
  },

  headerSquareButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: THEME.purpleButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  headerSquareButtonFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: THEME.purpleButtonFocused,
    transform: [{scale: 1.05}],
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  funnelSymbol: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  settingsIconButtonFocused: {
    borderColor: '#FFFFFF',
  },
  appLogoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    resizeMode: 'contain',
  },

  // 2. Main Two-Column Body
  mainSplitBody: {
    flex: 1,
    flexDirection: 'row',
  },

  // LEFT PANE: Active Filters, On-screen Keyboard, Suggestions
  leftPane: {
    width: 370,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },

  // Active filter tags row (Movie ×, Hindi ×, Romance ×, Drama ×)
  activeFiltersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  filterTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.purplePill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterTagPillFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: THEME.purplePillActive,
    transform: [{scale: 1.04}],
  },
  filterTagPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  filterTagCloseSymbol: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: 'bold',
  },
  filterResetPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterResetPillFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: colors.heroAccent,
  },
  filterResetPillText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Virtual Keyboard
  keyboardContainer: {
    marginBottom: 16,
  },
  keyboardRow: {
    flexDirection: 'row',
    marginBottom: 6,
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 34,
    height: 36,
    backgroundColor: THEME.keyDefaultBg,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.keyDefaultBorder,
  },
  keyButtonFocused: {
    backgroundColor: THEME.keyFocusedBg,
    borderColor: '#FFFFFF',
    transform: [{scale: 1.1}],
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
  keyText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  keyTextFocused: {
    color: THEME.keyFocusedText,
    fontWeight: 'bold',
  },

  keyBackspace: {
    width: 54,
  },
  keySpace: {
    flex: 1,
    marginHorizontal: 8,
  },
  keyClear: {
    width: 54,
  },
  keyActionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Word Suggestions & Quick Keywords
  keywordsContainer: {
    marginTop: 8,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 6,
  },
  keywordPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  keywordPillFocused: {
    backgroundColor: THEME.purplePill,
    borderColor: '#FFFFFF',
    transform: [{scale: 1.05}],
  },
  keywordText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  keywordTextFocused: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Recent Searches inside Left Pane
  recentContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clearRecentLink: {
    padding: 4,
  },
  clearRecentLinkText: {
    color: THEME.micPurple,
    fontSize: 11,
    fontWeight: '600',
  },
  recentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  // RIGHT PANE: Results Grid
  rightPane: {
    flex: 1,
    paddingLeft: 24,
  },
  resultsGrid: {
    flex: 1,
  },
  resultsGridContent: {
    paddingBottom: 80,
  },
  resultsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  resultsCountText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },

  // 3-Column Grid of 16:9 Landscape Cards
  gridColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  gridCardContainer: {
    width: '31.8%',
  },
  cardTouchable: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: THEME.cardBg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardTouchableFocused: {
    borderColor: '#FFFFFF',
    transform: [{scale: 1.03}],
    shadowColor: THEME.purplePillActive,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  cardThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#231535',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardInfo: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardMeta: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty, Loading, Error States
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: THEME.textMuted,
    fontSize: 15,
    marginTop: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: THEME.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 400,
  },
  actionButton: {
    backgroundColor: THEME.purpleButton,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  actionButtonFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: THEME.purpleButtonFocused,
    transform: [{scale: 1.05}],
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  queryWarningBanner: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderColor: 'rgba(217, 119, 6, 0.6)',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  queryWarningText: {
    color: '#FDE68A',
    fontSize: 12,
    textAlign: 'center',
  },
  hiddenPill: {
    display: 'none',
  },
});
