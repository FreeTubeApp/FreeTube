import DOMPurify from 'dompurify'

const USE_NATIVE_SANITIZER = process.env.IS_ELECTRON || ('Sanitizer' in window && typeof HTMLElement.prototype.setHTML === 'function')

let sanitizer
/** @type {import('dompurify').Config | undefined} */
let domPurifyStrictConfig

/** @type {import('vue').FunctionDirective<HTMLElement, string, 'lenient'>} */
export const vSaferHtml = (element, { value, oldValue, modifiers }) => {
  if (oldValue === null || value !== oldValue) {
    if (modifiers.lenient) {
      // Use the default browser sanitizer configuration e.g. for the changelog
      if (USE_NATIVE_SANITIZER) {
        element.setHTML(value)
      } else {
        element.innerHTML = DOMPurify.sanitize(value, { RETURN_TRUSTED_TYPE: false })
      }
    } else if (USE_NATIVE_SANITIZER) {
      // Use a much stricter sanitzer configuration, should be used in most places
      if (sanitizer === undefined) {
        sanitizer = new Sanitizer({
          comments: false,
          elements: [
            'br',
            'b',
            'i',
            's',
            {
              name: 'a',
              attributes: ['data-time', 'dir', 'href', 'lang', 'tabindex']
            },
            // live chat emojis (see parseLocalTextRuns)
            {
              name: 'img',
              attributes: ['alt', 'height', 'loading', 'src', 'style', 'width']
            }
          ]
        })
      }

      element.setHTML(value, { sanitizer })
    } else {
      if (domPurifyStrictConfig === undefined) {
        domPurifyStrictConfig = {
          ALLOWED_TAGS: ['br', 'b', 'i', 's', 'a', 'img'],
          ALLOWED_ATTR: ['alt', 'data-time', 'dir', 'height', 'href', 'lang', 'loading', 'src', 'style', 'tabindex', 'width']
        }
      }

      element.innerHTML = DOMPurify.sanitize(value, domPurifyStrictConfig)
    }
  }
}
