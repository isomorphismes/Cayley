# Display-neutral group structure

Cayley's reusable boundary is finite-group structure, not a particular page,
canvas, menu, or Android shell.

`js/GroupStructure.js` now owns the material that can be reused without choosing
a display:

- lazy ingestion of Group Explorer XML multiplication tables;
- the finite group law, identity, inverses, powers, generator closure, and
  generator discovery;
- conjugacy classes and the center as algebraic structure rather than UI
  panels;
- a complete generator-labelled Cayley graph record;
- a multiplication-table record;
- recognition of faithful cyclic and dihedral plane actions.

The records returned by `cayleyGraphForGroup`,
`multiplicationTableForGroup`, and `planarActionForGroup` contain plain data.
They can be serialized and passed across a JavaScript worker, native boundary,
or future Idriç boundary. They contain no coordinates, palette, viewport,
widget, or navigation decision.

## Boundary

The structure layer owns:

- element indices and multiplication;
- generator sets and explicit left/right multiplication convention;
- one algebraic Cayley edge for each element-generator pair;
- table cells as products;
- facts such as generator order, inverse, and involution status;
- whether the group admits the faithful 2D cyclic or dihedral action currently
  understood by the pattern compiler.

A consumer owns:

- node placement and edge routing;
- whether two opposite involution edges are drawn once or twice;
- arrows, loops, labels, colors, line widths, and animation;
- canvas, SVG, WebGL, rough framebuffer, native GPU, or textual output;
- first-paint order and lazy presentation;
- controls, gestures, menus, drawers, and page navigation.

That distinction is visible in the current mobile path. `Mobile.js` still uses
its deliberately crude circular Canvas2D drawing, but it consumes a Cayley
record rather than deriving group edges while drawing. `MobileTable.js`
likewise colors a multiplication-table record rather than querying the group
law cell by cell. The existing pictures are therefore replaceable instead of
being embedded in the model.

## Compatibility

`MobileGroup.js` remains as a compatibility name for the lazy finite-group
model. The pattern bridge delegates XML/JSON parsing and cyclic/dihedral
recognition to the same structure layer, while retaining pattern-source
compilation in `js/GroupPattern.js`.

The inherited Group Explorer model remains available. Objects exposing a
multiplication table, or an `order` and `mult(left, right)` operation, can be
adapted into the extracted finite-group model. This avoids requiring the old
views to migrate before the structure can be reused.

## Cross-pollination already available

The boundary matches patterns that have emerged elsewhere in these projects:

- **rough.framebuffer** accepts semantic shapes and compiles them into geometry
  operations before rasterization. A Cayley record can be compiled into that
  scene language without teaching the group model about pixels.
- **Wegert** separates scene/sample state from the renderer. Cayley can use the
  same division: group and representation records first, renderer state after.
- **swap** separates a permutation action from the geometry chosen to embody
  it. Swap actions can produce generator-labelled graph records; Cayley graph
  records can in turn use Swap-style geometric motion.
- **PatternLanguage** already separates affine program data from SVG output.
  The planar-action recognizer now lives below that compiler and can feed a
  different renderer or language.

The reverse direction matters too. Cayley's explicit generator, inverse,
order, and edge data can supply algebraic structure to geometry-first projects
without importing Group Explorer's interface.

## Deferred display and menu questions

This refactor deliberately does not choose the next display. The later design
conversation can compare graph layouts, multiplication-table treatments,
pattern views, rough or subpixel rendering, 3D group actions, animation, and
native GPU paths against the same records.

It also does not encode a menu tree. A later menu should expose capabilities of
the selected group and active representation rather than become another owner
of group state. Generator choice, left/right action, representation choice, and
renderer-specific controls can then be arranged differently on a phone,
desktop, gamepad, or script without changing the structure layer.
