// Generic webpack loader that replaces a piece of upstream source code at build time,
// so that the upstream files stay untouched. The patches are defined in pwa/patches/index.js.

/**
 * @this {import('webpack').LoaderContext<{ name: string, search: string, replace: string }>}
 * @param {string} source
 */
module.exports = function (source) {
  const { name, search, replace } = this.getOptions()

  if (!source.includes(search)) {
    this.emitWarning(new Error(
      `Patch "${name}": the patched code was not found in ${this.resourcePath}, upstream probably changed or fixed it. ` +
      'Check whether the patch is still needed and update or remove it in pwa/patches/index.js.'
    ))
    return source
  }

  return source.replace(search, replace)
}
