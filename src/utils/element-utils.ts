export function getClosestParentElement(
  element: HTMLElement,
  selector: string,
  stopSelector?: string
): HTMLElement {
  let closestParent = null;
  while (element) {
    if (element.matches(selector)) {
      closestParent = element;
      break;
    } else if (stopSelector && element.matches(stopSelector)) {
      break;
    }
    element = element.parentElement;
  }
  return closestParent;
}
