/**
 * @fileoverview Disallow Unicode escape sequences in string literals and template quasis.
 * Detects patterns like \uFFFF and \u{FFFFF} inside string literals and template literals.
 */

'use strict';

const UNICODE_ESCAPE_RE = /\\u(?:[0-9A-Fa-f]{4}|\{[0-9A-Fa-f]+\})/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Unicode escape sequences like \\uHHHH and \\u{HHHHHH} in string literals',
      category: 'Possible Errors',
      recommended: false,
    },
    schema: [],
    messages: {
      avoid: 'Avoid Unicode escape sequences in string literals (e.g. \\uHHHH or \\u{HHHHHH}). Use plain characters instead.',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();

    /**
     * Check a raw source snippet for unicode escape sequences.
     * @param {string} raw
     * @returns {boolean}
     */
    function hasUnicodeEscape(raw) {
      if (!raw) return false;
      return UNICODE_ESCAPE_RE.test(raw);
    }

    /**
     * Report node if its raw representation contains unicode escapes.
     * @param {ASTNode} node
     * @param {string} raw
     */
    function reportIfFound(node, raw) {
      if (hasUnicodeEscape(raw)) {
        context.report({
          node,
          messageId: 'avoid',
        });
      }
    }

    return {
      Literal(node) {
        // Only check string literals
        if (typeof node.value === 'string') {
          // Prefer node.raw if available, otherwise fallback to source text
          const raw = node.raw || sourceCode.getText(node);
          reportIfFound(node, raw);
        }
      },

      TemplateElement(node) {
        // TemplateElement.value.raw contains the raw text of the template chunk
        if (node && node.value && typeof node.value.raw === 'string') {
          reportIfFound(node, node.value.raw);
        } else {
          // Fallback: get source slice for the node
          const raw = sourceCode.getText(node);
          reportIfFound(node, raw);
        }
      },
    };
  },
};