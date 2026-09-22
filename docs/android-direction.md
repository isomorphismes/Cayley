# Android direction

Status: current architecture and migration target. This document does not claim
that the native application is implemented.

## Product outcome

Cayley should replace the WebView testing vehicle as the Android product
without discarding the mathematical source material or the useful product
lessons it exposed.

The first complete native slice should:

- select one bundled group without enumerating or rendering the whole catalog;
- show the Cayley diagram first;
- make the generated symmetry/pattern view the next view;
- keep the multiplication table available but secondary;
- keep names, order, generators, presentations, and the large library/index out
  of startup;
- run on the 32-bit ARMv7 MIRO A1 without a JavaScript/WebView application core.

The current `Mobile.*` path from merged isomorphismes/Cayley PR #8, “Start
mobile app with one random group's visuals,” is the behavioral reference for
lazy first paint. It is not the permanent implementation language or runtime
architecture.

## Current baseline and historical branch

Current `cayley` contains the merged symmetry, Android-package, F-Droid, and
mobile-first-paint work. The existing `android-app/` Java/WebView/Gradle project
remains a compatibility and packaging baseline until the native slice replaces
it; its presence does not give it ownership of application behavior.

Commit `e0dfb410903a7eacef70620fc07b5bb0c2817046` on
`native-android-random-group` records two useful design decisions: inherited
Group Explorer belongs behind a reference boundary, and high-level control
belongs in Idriç. That branch is based on the older mobile-first-paint head and
performs a wholesale tree move. Do not merge it wholesale into current
`cayley`.

## Ownership boundaries

| Concern | Owner and constraint |
| --- | --- |
| Program semantics | Idriç owns group selection, the minimal loaded group state, view order, and interaction state. Do not duplicate these decisions in Java, JavaScript, Gradle, JNI, or packaging scripts. |
| Rendering | Rendering consumes checked group/visual state through an explicit boundary. Generated shader output, host renderer code, and CPU reference behavior are separate evidence. A CPU or handwritten-shader path cannot be reported as Idriç shader-backend execution. |
| Android runtime boundary | Use the direct DEX/ART line in `isomorphisms/idric-arm-thumb`, pinned to the exact `isomorphisms/Idric` compiler revision. A narrow NativeActivity/JNI adapter may bridge to a native renderer, but it must not own program semantics. Java source, Kotlin, `javac`, Gradle, and `d8` are not compiler stages. |
| APK packaging and signing | Keep packaging replaceable and below the app. Put build/package machinery under `_/build`, preserve `org.isomorphisms.groupexplorer`, use a persistent public test signer, and keep `versionCode` nondecreasing. Package assembly, alignment, signing, installation, and launch remain separate evidence stages. |
| Store and F-Droid metadata | Keep F-Droid machinery under `_/build/fdroid` and canonical Triple-T metadata under the Android module's `src/main/play` tree. Candidate, submission, and publication evidence follow the `isomorphisms/ai-ci` F-Droid contract and remain distinct. |
| Inherited source and licensing | Preserve Ray Ellis and Nathan Carter attribution, Group Explorer's LGPL obligations, the fork notice, full license texts, and separate third-party terms. Moving inherited code behind a legacy/reference boundary must not erase provenance. |

## Dependencies exposed by current work

### Idriç and direct DEX

The current generic DEX backend already proves checked Idriç/ANF to directly
encoded DEX 035 and ART execution. Its documented generic slice is still
narrow: Int32 and Text operations, without general constructors, arrays,
Android lifecycle classes, framework calls, or resource handling. The existing
directly encoded NativeActivity adapter is explicitly application-specific to
Wegert.

Extend the generic checked boundary only for capabilities Cayley actually
needs. Do not put a Cayley-specific hard-coded class encoder into the generic
backend merely to get the first APK.

### Rendering

`isomorphisms/idris-shader-backend` currently emits and validates GLSL ES for a
restricted numerical subset and has separate physical PowerVR and Mali
acceptance. It still consumes ordinary Idris 2, not current Idriç, and it does
not yet implement a Cayley-diagram renderer. GPU capability in that repository
therefore does not by itself satisfy this target.

Define the Cayley rendering input explicitly—vertices/elements,
generator-labelled edges, layout positions, colors, and viewport—and add the
required compiler/renderer slice. Keep any Canvas2D or CPU implementation as a
reference oracle unless it is deliberately selected as a separately named
production renderer.

### Packaging and release

Follow the separation already demonstrated by current Wegert work:

- direct DEX/JNI qualification is separate from F-Droid source-build
  qualification;
- package construction does not certify semantic execution;
- F-Droid signs its own build unless an upstream reproducible-signing policy is
  chosen explicitly;
- legacy `fastlane/metadata/android` must not remain a fallback once Triple-T
  becomes canonical.

Do not migrate the present Cayley packaging tree piecemeal before the native
source and runtime boundary exist. Move it as a coherent packaging change tied
to the native slice.

## Stale mobile PR audit

### isomorphismes/Cayley PR #1, “Make Group Explorer usable on phones”

- **Already present or superseded:** visualization-first startup and
  hidden-by-default secondary controls are superseded by `Mobile.html`,
  `Mobile.js`, and merged isomorphismes/Cayley PR #8, “Start mobile app with one
  random group's visuals.”
- **Ported here:** the sound testing idea—ordinary `npm test` should exercise
  the current mobile path—is retained by running
  `tests/mobile-first-paint.test.mjs` alongside the pattern tests.
- **Historical/design documentation only:** coarse-pointer target sizes,
  bottom-sheet controls, scrollable mathematical tables, and viewport
  containment remain useful interaction observations.
- **Obsolete for Android:** responsive desktop library cards, Group Info/Sheet
  repair, and the inherited toolbar layout do not define the native phone
  product.
- **Contrary if promoted:** treating the squeezed inherited web application as
  the Android architecture would restore the catalog and metadata-first model
  that the later mobile-first path rejected.

### isomorphismes/Cayley PR #3, “Build PR 1 as an Android APK”

- **Already present or superseded:** the local-origin asset server, manifest,
  icon, WebView activity, and Gradle wrapper were carried forward and revised by
  merged isomorphismes/Cayley PR #5, “Package PR 2 symmetry patterns as Android
  APK,” isomorphismes/Cayley PR #7, “Add F-Droid release path for Group
  Explorer,” and isomorphismes/Cayley PR #8, “Start mobile app with one random
  group's visuals.”
- **No unique product behavior remains to port.**
- **Historical only:** it proved that the August web source could be bundled
  for testing.
- **Obsolete architecture:** Java/WebView/Gradle ownership of the application
  is not the native Idriç target.

### isomorphismes/Cayley PR #4, “Prototype ƒ⁻¹ mobile escape hatch”

- **Historical/design documentation only:** app-level destinations should not
  permanently crowd the visualization, and mathematical controls should remain
  separate from navigation.
- **Superseded problem:** the current `Mobile.*` startup has no inherited
  toolbar to compress.
- **Not accepted product behavior:** ƒ⁻¹ was provisional, has no recorded
  device acceptance, and should not constrain native navigation.
- **Actively unsafe implementation detail:** the branch replaces the 13-byte
  `visualizer.js -> visualizer.md` symlink target with thousands of bytes while
  retaining symlink mode, so the head does not preserve the repository's
  literate-source link.

## Native-slice acceptance

- A fresh implementation branch starts from current `cayley`; no stale mobile
  branch is rebased or merged wholesale.
- One checked Idriç program owns group selection, minimal group state, view
  ordering, and interaction state.
- Startup reads one bundled group without enumerating the whole inherited
  catalog.
- The first visible result is a Cayley diagram; generated symmetry/pattern is
  next; multiplication table is secondary or on demand.
- Direct DEX output is generated from exact pinned Idriç compiler/backend heads
  with no Java/Kotlin/`javac`/`d8` semantic path.
- Any JNI/NativeActivity layer is narrow, documented, and replaceable.
- The running renderer identifies whether its shader was backend-generated and
  whether any fallback was selected.
- APK assembly, alignment, signing, install, launch, semantic behavior, and
  rendering evidence are recorded separately.
- The exact APK replaces the prior installed test package without uninstalling
  it first.
- Physical MIRO A1 acceptance records Android build, `armeabi-v7a`,
  PowerVR/Imagination renderer identity, package/artifact hash, direct DEX/ART
  execution, first-paint behavior, touch interaction, and no WebView application
  core.
- Attribution, LGPL texts, third-party notices, and source availability survive
  the transition.
- F-Droid candidate evidence uses current Triple-T and `ai-ci` conventions;
  submission and publication remain separate gates.
