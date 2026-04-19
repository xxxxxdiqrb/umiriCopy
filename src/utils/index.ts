export function createElement<T extends Element = Element>(htmlString: string): T {
    const range = document.createRange();
    return range.createContextualFragment(htmlString).children[0] as T;
}
