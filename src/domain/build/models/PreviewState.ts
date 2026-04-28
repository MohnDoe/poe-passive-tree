import type { HoverPreview } from "./HoverPreview";
import type { RefundPreview } from "./RefundPreview";

export interface PreviewState {
  hover: HoverPreview | null;
  refund: RefundPreview | null;
}
