export function getSlotContent(elements: Element[], slotName: string) {
  const validElements = elements.filter(child => {
    return child.getAttribute('slot') === slotName;
  });

  return validElements
    .map(slotElement => {
      return slotElement.outerHTML;
    })
    .join('');
}
