export function createOverlayElement(id, position) {
    const existing = document.getElementById(id);
    if (existing)
        return existing;
    const el = document.createElement("pre");
    el.id = id;
    el.style.cssText =
        `position:fixed;${position};margin:0;padding:4px 8px;` +
            "font:12px monospace;color:#0f0;background:rgba(0,0,0,0.5);" +
            "pointer-events:none;z-index:9999;white-space:pre";
    document.body.appendChild(el);
    return el;
}
//# sourceMappingURL=overlay.js.map