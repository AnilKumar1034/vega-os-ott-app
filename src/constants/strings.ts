export const strings = {
  appName: 'LogiXstream',
  
  // Navigation & Screen Headers
  nav: {
    homeTitle: 'Discover Movies',
    homeDesc: 'Explore thousands of movies and TV shows.',
    moviesTitle: 'Movies Collection',
    moviesDesc: 'Browse all blockbuster movies.',
    seriesTitle: 'TV Series & Shows',
    seriesDesc: 'Binge-watch top-rated TV series.',
    categoriesTitle: 'Explore Genres',
    categoriesDesc: 'Browse content by categories and genres.',
    searchTitle: 'Search Catalog',
    searchDesc: 'Search by title, genre, cast, or director.',
    settingsTitle: 'Account & Settings',
    settingsDesc: 'Manage your profile and subscription tier.',
    videoPlayerTitle: 'Now Playing',
    videoPlayerDesc: 'Playing selected video stream.',
  },

  // Side Menu Options
  sideMenu: {
    home: 'Home',
    movies: 'Movies',
    series: 'Series',
    categories: 'Categories',
    search: 'Search',
    settings: 'Settings',
  },

  // Common Header Badges
  header: {
    hd: 'HD',
    uhd: '4K ULTRA HD',
    hdr: 'HDR10+',
    atmos: 'DOLBY ATMOS',
    live: 'LIVE',
  },

  // Actions & Buttons
  actions: {
    watchNow: 'Watch Now',
    play: 'Play',
    pause: 'Pause',
    addWatchlist: '+ Add to Watchlist',
    watchlist: 'Watchlist',
    trailer: 'Trailer',
    signIn: 'Sign In',
    register: 'Create Account',
    logOut: 'Log Out',
    registerNow: "Don't have an account? Register Now",
    alreadyHaveAccount: 'Already have an account? Sign In',
    retry: 'Retry',
    back: 'Back',
    backToDetails: 'Back to Details',
  },

  // Auth & Settings
  auth: {
    loginTitle: 'Sign In',
    loginSubtitle: 'Sign in to your LogiXstream Account',
    registerTitle: 'Create Account',
    registerSubtitle: 'Register for LogiXstream Streaming Services',
    usernameLabel: 'Username',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    subscriptionLabel: 'Subscription Plan',
    cityLabel: 'City',
    countryLabel: 'Country',
    accountUidLabel: 'Account UID',
    subscriptionTierLabel: 'Subscription Tier',
    notSignedInTitle: 'Not Signed In',
    notSignedInSubtitle: 'Please sign in or create an account to access premium features.',
    defaultUser: 'LogiXstream User',
    defaultSub: 'Standard',
    notSpecified: 'Not specified',
    notAvailable: 'N/A',
  },

  // Placeholders
  placeholders: {
    email: 'user@example.com',
    password: 'Enter your password',
    passwordMin: 'Min 6 characters',
    username: 'e.g. user_streamer',
    city: 'e.g. Bangalore',
    country: 'e.g. India',
    search: 'Search movies, series, cast...',
  },

  // Subscription Tiers
  subscriptions: {
    free: 'Free',
    basic: 'Basic',
    premium: 'Premium',
    ultra4k: '4K Ultra',
  },

  // Validation & Errors
  errors: {
    enterUsername: 'Please enter a username.',
    validEmail: 'Please enter a valid email address.',
    enterPassword: 'Please enter your password.',
    passwordLength: 'Password must be at least 6 characters.',
    enterCity: 'Please enter your city.',
    enterCountry: 'Please enter your country.',
    invalidLogin: 'Invalid email or password. Please try again.',
    failedRegister: 'Failed to create account. Please try again.',
  },

  // Movie Detail & Categories
  movieDetail: {
    overview: 'Overview',
    castCrew: 'Cast & Crew',
    moreLikeThis: 'More Like This',
    rating: 'Rating',
    duration: 'Duration',
    releaseYear: 'Release Year',
    genre: 'Genre',
    director: 'Director',
    seasons: 'Seasons',
  },

  // Search Screen
  search: {
    noResults: 'No results found for',
    trySearchingElse: 'Try searching for something else.',
  },
} as const;
