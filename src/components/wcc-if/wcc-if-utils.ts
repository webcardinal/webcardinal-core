export function getSlotContent(elements: Element[], slotName: String) {
  let validElements = elements.filter((child) => {
    return child.getAttribute("slot") === slotName;
  });

  return validElements
    .map((slotElement) => {
      return slotElement.outerHTML;
    })
    .join("");
}
