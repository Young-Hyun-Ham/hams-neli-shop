import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { containsEventHtml, prepareEventContent } from "@/lib/event-content";

type EventContentProps = {
  content: string;
  className?: string;
};

export function EventContent({ content, className }: EventContentProps) {
  const isHtml = containsEventHtml(content);
  const preparedContent = useMemo(
    () =>
      isHtml
        ? prepareEventContent(content)
        : { html: "", backgroundColor: undefined },
    [content, isHtml],
  );

  if (!isHtml) {
    return (
      <div className={cn("event-content whitespace-pre-wrap", className)}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn("event-content", className)}
      style={{ backgroundColor: preparedContent.backgroundColor }}
      dangerouslySetInnerHTML={{ __html: preparedContent.html }}
    />
  );
}
