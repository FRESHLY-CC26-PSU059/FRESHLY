const sanitizeHtml = require('sanitize-html');

// Allowlist for admin-authored rich text (Tiptap / newsletters). Blocks
// <script>, inline handlers, and non-http/mailto URLs.
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'class'],
    span: ['style'],
    div: ['style'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
  allowedStyles: {
    '*': {
      color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$|^right$|^center$|^justify$/],
      'font-weight': [/^(bold|bolder|lighter|normal|\d{3})$/],
      'font-style': [/^(italic|normal|oblique)$/],
      'text-decoration': [/^(underline|line-through|none)$/],
    },
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        target: attribs.target || '_blank',
      },
    }),
  },
};

const sanitizeRichText = (html) => {
  if (typeof html !== 'string') return '';
  return sanitizeHtml(html, RICH_TEXT_OPTIONS);
};

const sanitizePlainText = (text) => {
  if (typeof text !== 'string') return '';
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
};

module.exports = {
  sanitizeRichText,
  sanitizePlainText,
};
