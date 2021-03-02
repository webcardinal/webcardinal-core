export function getSlots(elements: Element[], slotName: string) {
  const validElements = elements.filter(child => {
    return child.getAttribute('slot') === slotName;
  });

  return validElements;
}

export function getSlotContent(elements: Element[], slotName: string) {
  return getSlots(elements, slotName)
    .map(slotElement => {
      return slotElement.outerHTML;
    })
    .join('');
}

export function removeElementChildren(element: Element) {
  while (element.children.length > 0) {
    element.children[0].remove();
  }
}
