# RelayId manifest

Production update metadata for RelayId Android and Wear OS builds.

Manifest: https://relayid.github.io/manifest/manifest.json

Downloads:

- Android: https://relayid.github.io/manifest/android/
- Wear OS: https://relayid.github.io/manifest/wear/

Direct APK updates and Google Play updates remain independent and supported together. This repository publishes only update metadata and stable download pages; APKs are built and signed in their own repositories.

Trusted app and watch workflows dispatch publish events here. The workflow validates package identity, version ordering, URLs, and SHA-256 metadata before deploying `public/` to GitHub Pages.

Local validation:

```text
npm test
```
