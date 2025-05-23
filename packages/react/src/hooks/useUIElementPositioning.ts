import {
  useDismiss,
  useFloating,
  UseFloatingOptions,
  useInteractions,
  useTransitionStyles,
} from "@floating-ui/react";
import { useEffect, useMemo } from "react";

type UIElementPosition = {
  isMounted: boolean;
  ref: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
  getFloatingProps: ReturnType<typeof useInteractions>["getFloatingProps"];
  getReferenceProps: ReturnType<typeof useInteractions>["getReferenceProps"];
  setReference: ReturnType<typeof useFloating>["refs"]["setReference"];
};

export function useUIElementPositioning(
  show: boolean,
  referencePos: DOMRect | null,
  zIndex: number,
  options?: Partial<UseFloatingOptions>,
): UIElementPosition {
  const { refs, update, context, floatingStyles } = useFloating({
    open: show,
    ...options,
  });
  const { isMounted, styles } = useTransitionStyles(context);

  // handle "escape" and other dismiss events, these will add some listeners to
  // getFloatingProps which need to be attached to the floating element
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    update();
  }, [referencePos, update]);

  useEffect(() => {
    // Will be null on initial render when used in UI component controllers.
    if (referencePos === null) {
      return;
    }
    refs.setReference({
      getBoundingClientRect: () => referencePos,
    });
  }, [referencePos, refs]);

  return useMemo(() => {
    return {
      isMounted,
      ref: refs.setFloating,
      setReference: refs.setReference,
      style: {
        display: "flex",
        ...styles,
        ...floatingStyles,
        zIndex: zIndex,
      },
      getFloatingProps,
      getReferenceProps,
    };
  }, [
    floatingStyles,
    isMounted,
    refs.setFloating,
    refs.setReference,
    styles,
    zIndex,
    getFloatingProps,
    getReferenceProps,
  ]);
}
