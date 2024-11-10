import { dirname, relative, resolve } from 'path'

const polyfillPath = resolve(import.meta.dirname, '../../src/renderer/composables/use-i18n-polyfill')

function getRelativePolyfillPath(filePath) {
  const relativePath = relative(dirname(filePath), polyfillPath).replaceAll('\\', '/')

  if (relativePath[0] !== '.') {
    return `./${relativePath}`
  }

  return relativePath
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    fixable: 'code'
  },
  create(context) {
    return {
      'ImportDeclaration[source.value="vue-i18n"]'(node) {
        const specifierIndex = node.specifiers.findIndex(specifier => specifier.type === 'ImportSpecifier' && specifier.imported.name === 'useI18n')

        if (specifierIndex !== -1) {
          context.report({
            node: node.specifiers.length === 1 ? node : node.specifiers[specifierIndex],
            message: "Please use FreeTube's useI18n polyfill, as vue-i18n's useI18n composable does not work when the vue-i18n is in legacy mode, which is needed for components using the Options API.",
            fix: context.physicalFilename === '<text>'
              ? undefined
              : (fixer) => {
                  const relativePath = getRelativePolyfillPath(context.physicalFilename)

                  // If the import only imports `useI18n`, we can just update the source/from text
                  // Else we need to create a new import for `useI18n` and remove useI18n from the original one
                  if (node.specifiers.length === 1) {
                    return fixer.replaceText(node.source, `'${relativePath}'`)
                  } else {
                    const specifier = node.specifiers[specifierIndex]

                    let specifierText = 'useI18n'

                    if (specifier.imported.name !== specifier.local.name) {
                      specifierText += ` as ${specifier.local.name}`
                    }

                    return [
                      fixer.removeRange([
                        specifierIndex === 0 ? specifier.start : node.specifiers[specifierIndex - 1].end,
                        specifierIndex === node.specifiers.length - 1 ? specifier.end : node.specifiers[specifierIndex + 1].start
                      ]),
                      fixer.insertTextAfter(node, `\nimport { ${specifierText} } from '${relativePath}'`)
                    ]
                  }
                }
          })
        }
      }
    }
  }
}
