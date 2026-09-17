/* The standard preset, minus the rules that are wrong about this codebase.
   Every entry below is an override with a reason; no bespoke rule has been
   added, because none has earned its place yet. */
export default {
  extends: 'stylelint-config-standard',
  rules: {
    /* CSS Module keys are read from TypeScript as `styles.rewardBadge`, so the
       class names are camelCase by necessity. Renaming them to kebab-case
       would rename a key at every call site, and a key that misses renders
       `class="undefined"` with no error — the defect class this linter was
       adopted to guard. The pattern still holds the convention. */
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: (name) => `Expected class selector "${name}" to be camelCase` },
    ],

    /* The token partials group their ramps and semantic aliases with blank
       lines; that grouping is the only structure a 70-line list of custom
       properties has. The preset wants consecutive custom properties packed
       tight, which would erase it. */
    'custom-property-empty-line-before': null,

    /* `global(...)` is CSS Modules syntax, not CSS. Animation names must carry
       it or the module scopes them and every animation silently no-ops. */
    'declaration-property-value-no-unknown': [
      true,
      { ignoreProperties: { 'animation-name': '/^global\\(/' } },
    ],

    /* Safari supports no unprefixed `text-size-adjust`, so the prefix is the
       only form that does anything. */
    'property-no-vendor-prefix': [true, { ignoreProperties: ['-webkit-text-size-adjust'] }],
  },
  overrides: [
    {
      /* A keyframe step is one moment, and reads as one when its properties
         sit on one line. Expanding the 31 steps here to a declaration each
         triples the file and hides the shape of every frame. */
      files: ['src/styles/tokens/keyframes.css'],
      rules: { 'declaration-block-single-line-max-declarations': null },
    },
    {
      /* The imports here are grouped by family, one blank line apart. The
         preset wants consecutive `@import`s of the same name packed tight. */
      files: ['src/styles/tokens/fonts.css'],
      rules: { 'at-rule-empty-line-before': null },
    },
  ],
}
