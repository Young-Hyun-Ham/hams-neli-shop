const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "alt",
  "data-event-body",
  "href",
  "src",
  "style",
  "target",
  "title",
]);
const ALLOWED_STYLE_PROPERTIES = new Set([
  "background-color",
  "background-image",
  "background-position",
  "background-repeat",
  "background-size",
  "border-collapse",
  "border-color",
  "border-radius",
  "border-style",
  "border-width",
  "color",
  "display",
  "font-family",
  "font-size",
  "min-height",
  "padding",
  "text-align",
  "width",
]);
const HTML_TAG_PATTERN =
  /<(?:a|blockquote|br|code|div|em|h[1-4]|hr|img|li|ol|p|pre|s|span|strong|table|tbody|td|th|thead|tr|u|ul)(?:\s|>|\/)/i;

const isSafeHref = (value: string) => {
  const href = value.trim();
  return (
    href.startsWith("/") ||
    href.startsWith("#") ||
    /^(https?:|mailto:|tel:)/i.test(href)
  );
};

const sanitizeStyle = (element: HTMLElement) => {
  for (const property of Array.from(element.style)) {
    if (!ALLOWED_STYLE_PROPERTIES.has(property)) {
      element.style.removeProperty(property);
      continue;
    }
    if (property === "background-image") {
      const value = element.style.getPropertyValue(property).trim();
      const urlMatch = value.match(/^url\(["']?(.*?)["']?\)$/i);
      if (!urlMatch || !/^https?:\/\//i.test(urlMatch[1]))
        element.style.removeProperty(property);
    }
  }
  if (!element.getAttribute("style")?.trim()) element.removeAttribute("style");
};

export const containsEventHtml = (content: string) =>
  HTML_TAG_PATTERN.test(content);

export const sanitizeEventHtml = (content: string) => {
  if (typeof window === "undefined") {
    return content;
  }

  const document = new DOMParser().parseFromString(content, "text/html");

  for (const element of Array.from(document.body.querySelectorAll("*"))) {
    const tagName = element.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase();
      if (!ALLOWED_ATTRIBUTES.has(attributeName)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === "a") {
      const href = element.getAttribute("href");
      if (!href || !isSafeHref(href)) {
        element.removeAttribute("href");
      }

      if (element.getAttribute("target") === "_blank") {
        element.setAttribute("rel", "noopener noreferrer");
      } else {
        element.removeAttribute("target");
      }
    }

    if (tagName === "img") {
      const src = element.getAttribute("src");
      if (!src || !/^https?:\/\//i.test(src.trim())) {
        element.remove();
        continue;
      }
    }

    if (element instanceof HTMLElement && element.hasAttribute("style"))
      sanitizeStyle(element);
  }

  return document.body.innerHTML;
};

export const prepareEventContent = (content: string) => {
  const html = sanitizeEventHtml(content);

  if (typeof window === "undefined") {
    return { html, backgroundColor: undefined };
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  const root =
    document.body.children.length === 1
      ? (document.body.firstElementChild as HTMLElement | null)
      : null;

  if (root?.dataset.eventBody !== "true") {
    return { html, backgroundColor: undefined };
  }

  return {
    html: root.innerHTML,
    backgroundColor: root.style.backgroundColor || undefined,
  };
};
