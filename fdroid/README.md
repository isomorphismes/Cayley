# F-Droid release path

Cayley is a modified Android distribution of Group Explorer, not a replacement claim over the upstream project.

Upstream: https://github.com/nathancarter/group-explorer

Modified source: https://github.com/isomorphisms/Cayley

The upstream README credits Ray Ellis and Nathan Carter and declares LGPL v3. The fork preserves that attribution and license. See `NOTICE.md`, `COPYING.LESSER`, `COPYING`, and `lib/three-146/LICENSE` for provenance and bundled third-party licensing.

## Current compatibility release

The original release stack has landed on `cayley`:

- isomorphismes/Cayley PR #2, “Add scriptable symmetry pattern language”;
- isomorphismes/Cayley PR #5, “Package PR 2 symmetry patterns as Android APK”;
- isomorphismes/Cayley PR #7, “Add F-Droid release path for Group Explorer”;
- isomorphismes/Cayley PR #8, “Start mobile app with one random group's visuals.”

This path packages the current visualization-first `Mobile.*` source in the
inherited Java/WebView/Gradle wrapper. It is a compatibility and release
baseline, not ownership of the future Android application's semantics. The
native Idriç/DEX/rendering direction and its separate packaging boundary are
recorded in [`../docs/android-direction.md`](../docs/android-direction.md).

Do not create an Android release tag on a branch-only commit. Tag only an exact
integrated `cayley` commit whose Android and F-Droid checks apply to that same
source state.

Before submitting a third-party app to F-Droid, follow F-Droid's current inclusion guidance, including notifying the upstream app authors when the submitter is not the upstream author.

Release procedure:

1. Require the `Pattern tests` and `F-Droid release build` checks to pass on the integrated `cayley` release commit.
2. Confirm the Android package is `org.isomorphisms.groupexplorer`, the launcher/store name is `Cayley`, `versionName` is `0.1.0`, and `versionCode` is `1`.
3. Tag that exact commit `android-v0.1.0`.
4. Copy `fdroid/org.isomorphisms.groupexplorer.yml.template` to `metadata/org.isomorphisms.groupexplorer.yml` in fdroiddata and replace `REPLACE_WITH_FULL_RELEASE_COMMIT_SHA` with the 40-character SHA of that integrated release commit. F-Droid's initial build metadata should identify the exact source revision rather than a branch or tag name.
5. Keep `fastlane/metadata/android/en-US/` synchronized with the app.

The F-Droid build uses the Android project in `android-app/` and bundles the checked-in Group Explorer web source. F-Droid signs the resulting release APK with its own key. The current F-Droid Gradle selector maps Android Gradle Plugin 8.7.x to Gradle 8.9, and the release CI uses that same Gradle version.

## Version policy

`org.isomorphisms.groupexplorer` is the stable Android application ID. Android `versionName` and `versionCode` belong to this distribution and are independent of the inherited Group Explorer web version. Increment `versionCode` for every published Android release and tag releases as `android-v<versionName>`.

The initial Android release is `0.1.0` / `1`; the embedded inherited Group Explorer web code retains its upstream 3.6.1 identity. This avoids pretending the fork has issued a new upstream Group Explorer release.
