import logicalSpec from 'stylelint-use-logical-spec'
import a11y from '@double-great/stylelint-a11y'
/** @type {import('stylelint').Config} */
export default {
  plugins: [logicalSpec, ...a11y],
  extends: ['stylelint-config-standard', 'stylelint-config-sass-guidelines'],
  overrides: [
    {
      files: '**/*.scss',
      customSyntax: 'postcss-scss',
      rules: {
        'max-nesting-depth': null,
        'selector-max-compound-selectors': null
      }
    },
    {
      files: '**/*.css',
      rules: { }
    }
  ],
  rules: {
    'selector-no-qualifying-type': [
      true,
      {
        ignore: ['attribute']
      }
    ],
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global']
      }
    ],
    'a11y/no-outline-none': true,
    'liberty/use-logical-spec': ['always']
  }
}
