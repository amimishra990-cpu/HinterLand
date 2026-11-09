import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

function renderWordParts(node: ReactNode): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
      .split(/(\s+)/)
      .filter((part) => part.length > 0)
      .map((part, index) => {
        if (/^\s+$/.test(part)) {
          return part;
        }

        return (
          <span key={`${part}-${index}`} className="wm-word">
            <span className="wm-inner">{part}</span>
          </span>
        );
      });
  }

  if (Array.isArray(node)) {
    return node.flatMap((entry) => renderWordParts(entry));
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    const child = node.props?.children;
    if (child === undefined) {
      return node;
    }

    return cloneElement(node as ReactElement<{ children?: ReactNode }>, {
      children: <WordRevealText>{child}</WordRevealText>,
    });
  }

  return node;
}

export function WordRevealText({ children }: { children: ReactNode }) {
  return <>{Children.toArray(children).flatMap((child) => renderWordParts(child))}</>;
}
