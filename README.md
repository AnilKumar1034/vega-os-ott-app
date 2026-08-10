# LogiXstream
A modern OTT streaming application built for Amazon Vega OS, showcasing media playback, navigation, authentication, and platform best practices.

## Deeplinks

This app supports custom deeplinks using the `logixstream://` scheme.

Example URLs:

- `logixstream://home`
- `logixstream://movies`
- `logixstream://search?q=rrr`
- `logixstream://movie/horizon`
- `logixstream://movie/jawan`
- `logixstream://play/kalki`
- `logixstream://settings`
- `logixstream://profile`

How to launch on a Vega OS target:

1. Install and run the app on the target device or emulator.
2. Open one of the URLs above from a browser, shell, or test harness that can hand off custom URL schemes to the installed app.
3. For movie-specific links, use a content ID that exists in the mock catalog, such as `horizon`, `jawan`, `kalki`, or `kgf-2`.

Example shell commands:

- `vmsgr send logixstream://search?q=rrr`
- `vmsgr send logixstream://movie/jawan`
- `vmsgr send logixstream://play/jawan?seek=120`

Protected routes:

- `logixstream://settings`
- `logixstream://profile`
- `logixstream://edit-profile`
- `logixstream://play/jawan`

If a protected deeplink is opened while the user is signed out, the app redirects to the login screen first and then returns to the original route after successful sign-in.

If you are testing from a device shell, the exact command depends on the tooling available in your Vega OS setup. The key requirement is to launch the URL with the `logixstream://` scheme so the target routes into the app.
