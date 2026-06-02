import DOMPurify from 'dompurify';

const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'code', 'pre',
    'blockquote', 'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  ALLOWED_ATTR: [
    'href', 'name', 'target', 'rel',
    'src', 'alt', 'title', 'width', 'height',
    'style',
    'colspan', 'rowspan',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM: false,
};

// Force safe rel/target on every rendered <a>.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    if (!node.hasAttribute('target')) {
      node.setAttribute('target', '_blank');
    }
  }
});

export const sanitizeHtml = (dirty: string | null | undefined): string => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, RICH_TEXT_CONFIG);
};
