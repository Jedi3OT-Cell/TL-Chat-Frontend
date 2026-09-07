import '@testing-library/jest-dom/vitest';

// jsdom does not implement scrollIntoView; ChatWindow calls it on mount.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
