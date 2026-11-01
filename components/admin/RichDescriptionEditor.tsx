"use client";

import { Bold, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Undo2, Redo2 } from "lucide-react";
import { useRef, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { sanitizeProductDescription } from "@/lib/product-description";

const tools = [
  { label: "Bold", icon: Bold, command: "bold" },
  { label: "Italic", icon: Italic, command: "italic" },
  { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
  { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
] as const;

export function RichDescriptionEditor({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [image, setImage] = useState("");
  const [panel, setPanel] = useState<"link" | "image" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [initialHtml] = useState(() => sanitizeProductDescription(value));

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode)) savedRange.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    editor.current?.focus();
    const selection = window.getSelection();
    if (!selection || !editor.current) return;
    const range = savedRange.current && editor.current.contains(savedRange.current.commonAncestorContainer)
      ? savedRange.current : document.createRange();
    if (range !== savedRange.current) {
      range.selectNodeContents(editor.current);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function format(command: string, value?: string) {
    restoreSelection();
    document.execCommand(command, false, value);
    if (editor.current) onChange(editor.current.innerHTML);
    rememberSelection();
  }

  function addLink() {
    const href = linkUrl.trim();
    if (!/^https:\/\/\S+$/i.test(href) && !/^mailto:\S+$/i.test(href) && !/^\/(?!\/)\S*$/.test(href)) {
      setLinkError("Enter a link starting with https://, mailto:, or /.");
      return;
    }
    restoreSelection();
    if (window.getSelection()?.isCollapsed) {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.textContent = href;
      document.execCommand("insertHTML", false, anchor.outerHTML);
      if (editor.current) onChange(editor.current.innerHTML);
      rememberSelection();
    } else format("createLink", href);
    setPanel(null);
    setLinkUrl("");
    setLinkError("");
  }

  function insertImage() {
    if (!image) return;
    restoreSelection();
    document.execCommand("insertImage", false, image);
    if (editor.current) onChange(editor.current.innerHTML);
    setImage("");
    rememberSelection();
    setPanel(null);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring/40">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2" role="group" aria-label="Description formatting">
        <select aria-label="Text style" defaultValue="p" className="h-8 rounded-md border bg-background px-2 text-sm" onFocus={rememberSelection} onChange={(event) => { format("formatBlock", event.target.value); event.target.value = "p"; }}>
          <option value="p">Normal text</option>
          <option value="h2">Large heading</option>
          <option value="h3">Small heading</option>
        </select>
        {tools.map(({ label, icon: Icon, command }) => (
          <Button key={label} type="button" size="sm" variant="ghost" aria-label={label} title={label} onMouseDown={(event) => event.preventDefault()} onClick={() => format(command)}>
            <Icon className="size-4" /> {label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => { rememberSelection(); setPanel(panel === "link" ? null : "link"); }} aria-expanded={panel === "link"}>
          <LinkIcon className="size-4" /> Add link
        </Button>
        <Button type="button" size="sm" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => { rememberSelection(); setPanel(panel === "image" ? null : "image"); }} aria-expanded={panel === "image"}>
          <ImagePlus className="size-4" /> Add image
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Undo" title="Undo" onMouseDown={(event) => event.preventDefault()} onClick={() => format("undo")}><Undo2 /></Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Redo" title="Redo" onMouseDown={(event) => event.preventDefault()} onClick={() => format("redo")}><Redo2 /></Button>
      </div>
      {panel === "link" && (
        <div className="space-y-2 border-b bg-muted/20 p-3">
          <label htmlFor={`${id}-link`} className="text-sm font-medium">Link address</label>
          <div className="flex flex-wrap gap-2">
            <input id={`${id}-link`} type="url" value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }} placeholder="https://example.com" className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLink(); } }} />
            <Button type="button" size="sm" onClick={addLink} disabled={!linkUrl.trim()}>Insert link</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPanel(null)}>Cancel</Button>
          </div>
          <p className="text-xs text-muted-foreground">Select words in the description first to turn them into a link.</p>
          {linkError && <p role="alert" className="text-xs text-destructive">{linkError}</p>}
        </div>
      )}
      {panel === "image" && (
        <div className="space-y-2 border-b bg-muted/20 p-3">
          <p className="text-sm font-medium">Add an image to the description</p>
          <ImageUpload id={`${id}-image`} folder="products" value={image} onChange={setImage} preview />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={insertImage} disabled={!image}>Insert image</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPanel(null)}>Cancel</Button>
          </div>
        </div>
      )}
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
          onInput={(event) => { onChange(event.currentTarget.innerHTML); rememberSelection(); }}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onBlur={rememberSelection}
          onPaste={(event) => {
            event.preventDefault();
            document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
            if (editor.current) onChange(editor.current.innerHTML);
          }}
          data-placeholder="Start typing here… Tell customers what the product does, its key benefits, and what’s included."
          className="min-h-64 max-w-none text-sm leading-relaxed outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_a]:text-primary [&_a]:underline [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:list-disc"
        />
        <p className="border-t pt-3 text-xs text-muted-foreground">Type or paste your description above. To format text, select it and choose a button. Press Enter for a new paragraph.</p>
      </div>
    </div>
  );
}
