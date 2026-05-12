# Edit Product Sheet Bottom Sheet

## Plan

- Add a shared `BottomSheet` UI component that handles backdrop, scroll lock, drag-to-close, Escape close, and accessible dialog semantics.
- Rename the product editing component from `EditProductModal` to `EditProductSheet` because the UI is now a bottom sheet.
- Keep existing product edit form behavior unchanged while replacing the centered modal layout with the bottom-sheet structure.
- Update imports/usages in `ProductOnboardingClient`.
- Run targeted lint for the changed files.
