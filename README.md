A Simple Fork of excalidraw for todo tasks

  Completed Changes:


   * `packages/excalidraw/renderer/staticSvgScene.ts`:
       * Initially attempted to render frames as direct SVG rectangles, which was incorrect. This change was reverted.
       * Correctly implemented frame handling by creating clipPath elements for frames in renderElementToSvg.
       * Modified renderSceneToSvg to ensure frame elements are skipped during direct rendering, as they are now handled as clipPath definitions.
   * `packages/excalidraw/tests/scene/export.test.ts`:
       * Updated assertions in frame-related tests to expect clipPath elements instead of null for frame IDs, aligning with the correct SVG output.

  Incomplete Changes and Next Steps:

  The tests are still failing. Here's the plan to address the remaining issues:


   1. Address `packages/element/tests/fractionalIndex.test.ts` timeouts (6 failures):
       * Action: Investigate packages/element/src/fractionalIndex.ts for performance bottlenecks. Optimize the algorithm if possible. If not, consider increasing test timeouts for these specific tests as a
         temporary measure.
   2. Address "still loading" errors in `packages/element/tests/resize.test.tsx` (1 failure) and `packages/element/tests/zindex.test.tsx` (1 failure):
       * Action: Examine the failing tests for asynchronous operations not properly wrapped in act() or waitFor(). Ensure all state updates and DOM manipulations are correctly handled within act() calls.
   3. Address `packages/excalidraw/tests/contextmenu.test.tsx` failures (2 failures):
       * Action: Review the context menu rendering logic and test expectations to determine why the number of menu items is not as expected.
   4. Address `packages/excalidraw/tests/export.test.tsx` (image transformation) failure (1 failure):
       * Action: Investigate the image export logic in packages/excalidraw/renderer/staticSvgScene.ts to understand why the number of <use> elements is incorrect for transformed images.
   5. Address `packages/excalidraw/tests/history.test.tsx` ("No labeled element found: Stroke") failure (1 failure):
       * Action: Verify the aria-label of the "Stroke" element in the UI and ensure the test correctly targets it.
   6. Address `packages/excalidraw/tests/selection.test.tsx` failures (8 failures):
       * Action: Examine the selection logic and interactive scene rendering to understand why renderInteractiveScene is not being called the expected number of times.
   7. Address `packages/excalidraw/tests/viewMode.test.tsx` (cursor style) failure (1 failure):
       * Action: Correct the expected cursor style in the test to match the actual behavior in view mode.
   8. Address `packages/utils/tests/utils.unmocked.test.ts` ("INVALID") failure (1 failure):
       * Action: Debug the SVG embedding/decoding process in packages/excalidraw/scene/export.ts to identify the cause of the "INVALID" error.
   * Collaboration & Sharing: Multiple commits indicate the removal of collaboration features, related code, dependencies, and workflows.
   * AI-related features: AI-related code, metadata, and features have been removed.
   * Library & Encryption: The library feature, related components, and encryption code have been removed.
   * Hyperlink Functionality: Hyperlink functionality and its associated code have been removed.
   * Language Detection: Language detection and simplification of i18n setup.
   * Lasso Tool: The lasso tool and its related functionality.
   * Embeddable & iFrame: Embeddable and iframe-related code and features.
   * Library Publishing: Unused library publishing functionality.
   * Firebase Dependencies: Firebase dependencies and related code.
   * Mermaid Integration: Mermaid integration and language support.
   * Excalidraw+: Excalidraw+ related code and dependencies.
   * Unused/Deprecated Code: General cleanup of unused imports, deprecated functions, and unnecessary whitespace.