export function updateOverlayMask(
    prefix: string,
    overlayElement: HTMLElement,
    articles: Iterable<HTMLElement>,
    borderRadius: number,
): void {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollWidth = document.documentElement.scrollWidth;

    let svg = document.getElementById(`${prefix}-svg-mask`) as unknown as SVGSVGElement;
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = `${prefix}-svg-mask`;
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.style.position = "absolute";
        document.body.appendChild(svg);
    }

    const ns = "http://www.w3.org/2000/svg";
    const maskId = `${prefix}-mask`;

    let mask = svg.querySelector("mask") as SVGMaskElement;
    if (!mask) {
        mask = document.createElementNS(ns, "mask") as SVGMaskElement;
        mask.id = maskId;
        svg.appendChild(mask);
    }
    mask.innerHTML = "";

    const outerRect = document.createElementNS(ns, "rect");
    outerRect.setAttribute("x", "0");
    outerRect.setAttribute("y", "0");
    outerRect.setAttribute("width", String(scrollWidth));
    outerRect.setAttribute("height", String(scrollHeight));
    outerRect.setAttribute("fill", "white");
    mask.appendChild(outerRect);

    for (const article of articles) {
        const rect = article.getBoundingClientRect();
        const left = rect.left + scrollX;
        const top = rect.top + scrollY;
        const width = rect.width;
        const height = rect.height;

        const hole = document.createElementNS(ns, "rect");
        hole.setAttribute("x", String(left));
        hole.setAttribute("y", String(top));
        hole.setAttribute("width", String(width));
        hole.setAttribute("height", String(height));
        hole.setAttribute("rx", String(borderRadius));
        hole.setAttribute("ry", String(borderRadius));
        hole.setAttribute("fill", "black");
        mask.appendChild(hole);
    }

    overlayElement.style.maskImage = `url(#${maskId})`;
    overlayElement.style.webkitMaskImage = `url(#${maskId})`;
}

export function removeOverlayMask(prefix: string): void {
    const svgMask = document.getElementById(`${prefix}-svg-mask`);
    if (svgMask) svgMask.remove();
}
