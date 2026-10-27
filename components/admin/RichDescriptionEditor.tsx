"use client";

import { Bold, Heading2, Heading3, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Underline } from "lucide-react";
import { useRef, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { sanitizeProductDescription } from "@/lib/product-description";

const tools = [
  { label: "Bold", icon: Bold, command: "bold" },
  { label: "Italic", icon: Italic, command: "italic" },
  { label: "Underline", icon: Underline, command: "underline" },
  { label: "Heading 2", icon: Heading2, command: "formatBlock", value: "h2" },
  { label: "Heading 3", icon: Heading3, command: "formatBlock", value: "h3" },
  { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
  { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
] as const;

export function RichDescriptionEditor({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [image, setImage] = useState("");
  const initialHtml = useRef(sanitizeProductDescription(value)).current;

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode)) savedRange.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    editor.current?.focus();
    if (!savedRange.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange.current);
  }

  function format(command: string, value?: string) {
    restoreSelection();
    document.execCommand(command, false, value);
    if (editor.current) onChange(editor.current.innerHTML);
    rememberSelection();
  }

  function addLink() {
    const href = window.prompt("Paste a link (https:// or mailto:)");
    if (href) format("createLink", href);
  }

  function insertImage() {
    if (!image) return;
    restoreSelection();
    document.execCommand("insertImage", false, image);
    if (editor.current) onChange(editor.current.innerHTML);
    setImage("");
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring/40">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2" aria-label="Description formatting">
        {tools.map(({ label, icon: Icon, command, ...tool }) => (
          <Button key={label} type="button" size="icon-sm" variant="ghost" aria-label={label} title={label} onMouseDown={(event) => event.preventDefault()} onClick={() => format(command, "value" in tool ? tool.value : undefined)}>
            <Icon className="size-4" />
          </Button>
        ))}
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Add link" title="Add link" onMouseDown={(event) => event.preventDefault()} onClick={addLink}>
          <LinkIcon className="size-4" />
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">Rich text</span>
      </div>
      <div className="grid gap-3 p-3">
        <div
          ref={editor}
          id={id}
          role="textbox"
          aria-label="Product description"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: initialHtml }}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onBlur={rememberSelection}
          onPaste={(event) => {
            event.preventDefault();
            document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
            if (editor.current) onChange(editor.current.innerHTML);
          }}
          data-placeholder="Write a clear product description. Use headings, lists, links, and images."
          className="min-h-40 max-w-none text-sm leading-relaxed outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:list-disc"
        />
        <div className="flex flex-wrap items-end gap-2 border-t pt-3">
          <div className="min-w-0 flex-1">
            <ImageUpload id={`${id}-image`} folder="products" value={image} onChange={setImage} preview />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={insertImage} disabled={!image}>
            <ImagePlus className="size-4" /> Insert image
          </Button>
        </div>
      </div>
    </div>
  );
}
