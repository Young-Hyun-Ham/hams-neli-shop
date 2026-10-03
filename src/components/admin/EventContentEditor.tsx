import { lazy, Suspense, useMemo, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  Images,
  ImagePlus,
  Italic,
  Loader2,
  Strikethrough,
  Table2,
  Underline,
  X,
} from "lucide-react";

import { EventContent } from "@/components/EventContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { eventStorage, type EventStorageImage } from "@/lib/eventStorage";

const Editor = lazy(() => import("@monaco-editor/react"));
type Props = { id: string; value: string; onChange: (value: string) => void };
type MonacoEditor = Parameters<OnMount>[0];

const FONTS = [
  ["기본 글꼴", "Noto Sans KR, sans-serif"],
  ["명조체", "Playfair Display, serif"],
  ["고딕체", "Arial, sans-serif"],
  ["코드체", "JetBrains Mono, monospace"],
] as const;
const SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "40px",
];
const COLOR_PRESETS = [
  "#ffffff",
  "#fff1f5",
  "#fce7f3",
  "#ede9fe",
  "#dbeafe",
  "#dcfce7",
  "#fef3c7",
  "#ffedd5",
  "#e5e7eb",
  "#fecaca",
  "#bfdbfe",
  "#bbf7d0",
];
const normalizeHex = (value: string) =>
  /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;

type ColorPickerProps = {
  label: string;
  initialColor: string;
  onApply: (color: string) => void;
};

function ColorPicker({ label, initialColor, onApply }: ColorPickerProps) {
  const [color, setColor] = useState(initialColor);
  const [draft, setDraft] = useState(initialColor);
  const [open, setOpen] = useState(false);

  const apply = () => {
    const nextColor = normalizeHex(draft);
    if (!nextColor) return;
    setColor(nextColor);
    onApply(nextColor);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className="mr-2 h-4 w-4 rounded border"
          style={{ backgroundColor: color }}
        />
        {label}
      </Button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">{label} 팔레트</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-3 grid grid-cols-6 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={`${preset} 선택`}
                className="aspect-square rounded-md border shadow-sm hover:ring-2 hover:ring-ring"
                style={{ backgroundColor: preset }}
                onClick={() => {
                  setColor(preset);
                  setDraft(preset);
                }}
              />
            ))}
          </div>
          <input
            type="color"
            aria-label={`사용자 지정 ${label}`}
            className="mb-3 h-24 w-full cursor-pointer rounded-md border bg-transparent p-1"
            value={color}
            onChange={(event) => {
              setColor(event.target.value);
              setDraft(event.target.value);
            }}
          />
          <div className="border-t pt-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              HEX
            </label>
            <div className="flex gap-2">
              <input
                value={draft}
                maxLength={7}
                spellCheck={false}
                onChange={(event) => setDraft(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm uppercase"
                placeholder="#FFF1F5"
              />
              <Button
                type="button"
                size="sm"
                disabled={!normalizeHex(draft)}
                onClick={apply}
              >
                적용
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EventContentEditor({ id, value, onChange }: Props) {
  const editorRef = useRef<MonacoEditor | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateImages, setTemplateImages] = useState<EventStorageImage[]>([]);
  const [templateToken, setTemplateToken] = useState<string>();
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [imageSearch, setImageSearch] = useState("");
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableColumns, setTableColumns] = useState(2);
  const [tableBorderWidth, setTableBorderWidth] = useState(1);
  const [tableBorderStyle, setTableBorderStyle] = useState("solid");
  const [tableBorderColor, setTableBorderColor] = useState("#d1d5db");
  const [tableCellPadding, setTableCellPadding] = useState(8);

  const visibleImages = useMemo(() => {
    const keyword = imageSearch.trim().toLocaleLowerCase();
    return keyword
      ? templateImages.filter((image) =>
          image.name.toLocaleLowerCase().includes(keyword),
        )
      : templateImages;
  }, [imageSearch, templateImages]);

  const wrapSelection = (
    openTag: string,
    closeTag: string,
    fallback = "텍스트",
  ) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) return;
    const selectedText = model.getValueInRange(selection) || fallback;
    editor.executeEdits("event-content-toolbar", [
      {
        range: selection,
        text: `${openTag}${selectedText}${closeTag}`,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };

  const insertSpace = () => {
    const editor = editorRef.current;
    const selection = editor?.getSelection();
    if (!editor || !selection) return;
    editor.executeEdits("event-content-space", [
      {
        range: selection,
        text: '<span style="display: inline-block; width: 1em;"></span>',
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };

  const insertTable = () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) return;

    const rows = Math.min(20, Math.max(1, tableRows));
    const columns = Math.min(10, Math.max(1, tableColumns));
    const borderWidth = Math.min(10, Math.max(0, tableBorderWidth));
    const cellPadding = Math.min(32, Math.max(0, tableCellPadding));
    const selectedText = model.getValueInRange(selection).trim();
    const cellStyle = `border-width: ${borderWidth}px; border-style: ${tableBorderStyle}; border-color: ${tableBorderColor}; padding: ${cellPadding}px;`;
    const body = Array.from({ length: rows }, (_, rowIndex) => {
      const cells = Array.from({ length: columns }, (_, columnIndex) => {
        const content =
          rowIndex === 0 && columnIndex === 0 ? selectedText || "내용" : "내용";
        return `<td style="${cellStyle}">${content}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("\n  ");
    const table = `<table style="width: 100%; border-collapse: collapse;">\n  <tbody>\n  ${body}\n  </tbody>\n</table>`;

    editor.executeEdits("event-content-table", [
      { range: selection, text: table, forceMoveMarkers: true },
    ]);
    setTableOpen(false);
    editor.focus();
  };

  const applyInlineStyle = (style: string) =>
    wrapSelection(`<span style="${style}">`, "</span>");
  const applyDocumentBackground = (color: string) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    const current = model.getValue();
    const parsed = new DOMParser().parseFromString(current, "text/html");
    const root =
      parsed.body.children.length === 1
        ? (parsed.body.firstElementChild as HTMLElement | null)
        : null;
    const content =
      root?.dataset.eventBody === "true" ? root.innerHTML : current;
    editor.executeEdits("event-body-background", [
      {
        range: model.getFullModelRange(),
        text: `<div data-event-body="true" style="background-color: ${color};">${content}</div>`,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };
  const insertImage = (url: string) => {
    const editor = editorRef.current;
    const selection = editor?.getSelection();
    if (!editor || !selection) return;
    const safeUrl = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    editor.executeEdits("event-content-image", [
      {
        range: selection,
        text: `<img src="${safeUrl}" alt="이벤트 이미지" style="display: block; width: 100%; border-radius: 12px;" />`,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };

  const loadTemplateImages = async (reset = false) => {
    if (templateLoading || (!reset && templateLoaded && !templateToken)) return;
    setTemplateLoading(true);
    setTemplateError("");
    try {
      const page = await eventStorage.getEventImages(
        reset ? undefined : templateToken,
      );
      setTemplateImages((current) =>
        reset
          ? page.items
          : [
              ...current,
              ...page.items.filter(
                (item) =>
                  !current.some((saved) => saved.fullPath === item.fullPath),
              ),
            ],
      );
      setTemplateToken(page.nextPageToken);
      setTemplateLoaded(true);
    } catch (error) {
      console.error("Failed to load event template images:", error);
      setTemplateError(
        "이미지 목록을 불러오지 못했습니다. Firebase Storage 권한을 확인해 주세요.",
      );
    } finally {
      setTemplateLoading(false);
    }
  };

  const toggleTemplates = () => {
    const nextOpen = !templateOpen;
    setTemplateOpen(nextOpen);
    if (nextOpen && !templateLoaded) void loadTemplateImages(true);
  };

  const handleBackgroundImage = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    setUploadError("");
    try {
      const url = await eventStorage.uploadImage(file);
      insertImage(url);
      setTemplateImages((current) => [
        { name: file.name, fullPath: url, url },
        ...current,
      ]);
    } catch (error) {
      console.error("Failed to upload event content background:", error);
      setUploadError(
        "배경 이미지를 업로드하지 못했습니다. Firebase 설정과 Storage 권한을 확인해 주세요.",
      );
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  return (
    <div
      id={id}
      className="overflow-visible rounded-md border border-input bg-background"
    >
      <div className="relative border-b bg-muted/30">
        <div className="flex flex-wrap items-center gap-2 p-2">
          <select
            aria-label="글꼴"
            defaultValue=""
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            onChange={(event) => {
              if (event.target.value)
                applyInlineStyle(`font-family: ${event.target.value};`);
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              글꼴
            </option>
            {FONTS.map(([label, font]) => (
              <option key={font} value={font}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="글자 크기"
            defaultValue=""
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            onChange={(event) => {
              if (event.target.value)
                applyInlineStyle(`font-size: ${event.target.value};`);
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              크기
            </option>
            {SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="flex items-center rounded-md border border-input bg-background">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="굵게"
              onClick={() => wrapSelection("<strong>", "</strong>")}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="기울임"
              onClick={() => wrapSelection("<em>", "</em>")}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="취소선"
              onClick={() => wrapSelection("<s>", "</s>")}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="밑줄"
              onClick={() => wrapSelection("<u>", "</u>")}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2"
              title="한 글자 공백"
              onClick={insertSpace}
            >
              공백
            </Button>
          </div>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={tableOpen}
              onClick={() => setTableOpen((current) => !current)}
            >
              <Table2 className="mr-2 h-4 w-4" />표
            </Button>
            {tableOpen && (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-80 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">표 설정</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setTableOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium">
                    행
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tableRows}
                      onChange={(event) =>
                        setTableRows(Number(event.target.value))
                      }
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium">
                    열
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={tableColumns}
                      onChange={(event) =>
                        setTableColumns(Number(event.target.value))
                      }
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium">
                    테두리 두께(px)
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={tableBorderWidth}
                      onChange={(event) =>
                        setTableBorderWidth(Number(event.target.value))
                      }
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium">
                    테두리 종류
                    <select
                      value={tableBorderStyle}
                      onChange={(event) =>
                        setTableBorderStyle(event.target.value)
                      }
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="solid">실선</option>
                      <option value="dashed">파선</option>
                      <option value="dotted">점선</option>
                      <option value="double">이중선</option>
                      <option value="none">없음</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium">
                    테두리 색상
                    <input
                      type="color"
                      value={tableBorderColor}
                      onChange={(event) =>
                        setTableBorderColor(event.target.value)
                      }
                      className="mt-1 h-9 w-full cursor-pointer rounded-md border bg-background p-1"
                    />
                  </label>
                  <label className="text-xs font-medium">
                    셀 여백(px)
                    <input
                      type="number"
                      min={0}
                      max={32}
                      value={tableCellPadding}
                      onChange={(event) =>
                        setTableCellPadding(Number(event.target.value))
                      }
                      className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={insertTable}
                >
                  적용
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center rounded-md border border-input bg-background">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="왼쪽 정렬"
              onClick={() =>
                wrapSelection('<div style="text-align: left;">', "</div>")
              }
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="가운데 정렬"
              onClick={() =>
                wrapSelection('<div style="text-align: center;">', "</div>")
              }
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="오른쪽 정렬"
              onClick={() =>
                wrapSelection('<div style="text-align: right;">', "</div>")
              }
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative flex flex-wrap items-center gap-2 border-t p-2">
          <ColorPicker
            label="글자색"
            initialColor="#222222"
            onApply={(color) => applyInlineStyle(`color: ${color};`)}
          />
          <ColorPicker
            label="글자배경색"
            initialColor="#fff1f5"
            onApply={(color) => applyInlineStyle(`background-color: ${color};`)}
          />
          <ColorPicker
            label="배경색"
            initialColor="#ffffff"
            onApply={applyDocumentBackground}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              void handleBackgroundImage(event.target.files?.[0])
            }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingImage}
            onClick={() => imageInputRef.current?.click()}
          >
            {uploadingImage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            이미지
          </Button>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={templateOpen}
              onClick={toggleTemplates}
            >
              <Images className="mr-2 h-4 w-4" />
              템플릿
            </Button>
            {templateOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(24rem,calc(100vw-3rem))] rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    list={`${id}-event-image-names`}
                    value={imageSearch}
                    onChange={(event) => setImageSearch(event.target.value)}
                    placeholder="이미지 이름 찾기"
                    className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setTemplateOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <datalist id={`${id}-event-image-names`}>
                  {templateImages.map((image) => (
                    <option key={image.fullPath} value={image.name} />
                  ))}
                </datalist>
                <div
                  className="max-h-80 overflow-x-hidden overflow-y-auto pr-1"
                  onScroll={(event) => {
                    const target = event.currentTarget;
                    if (
                      target.scrollHeight -
                        target.scrollTop -
                        target.clientHeight <
                        80 &&
                      templateToken &&
                      !templateLoading
                    )
                      void loadTemplateImages();
                  }}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {visibleImages.map((image) => (
                      <button
                        key={image.fullPath}
                        type="button"
                        title={image.name}
                        className="group overflow-hidden rounded-lg border bg-muted text-left hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                        onClick={() => {
                          insertImage(image.url);
                          setTemplateOpen(false);
                        }}
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          loading="lazy"
                          className="aspect-square w-full object-cover"
                        />
                        <span className="block truncate px-1.5 py-1 text-[11px]">
                          {image.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!templateLoading &&
                    visibleImages.length === 0 &&
                    !templateError && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        일치하는 이미지가 없습니다.
                      </p>
                    )}
                  {templateLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                  {templateError && (
                    <p className="py-3 text-sm text-destructive">
                      {templateError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            미리보기
          </Button>
        </div>
      </div>
      {uploadError && (
        <p className="border-b px-3 py-2 text-sm text-destructive">
          {uploadError}
        </p>
      )}
      <div className="overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              에디터를 불러오는 중...
            </div>
          }
        >
          <Editor
            height="260px"
            language="html"
            theme="vs-light"
            value={value}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            onChange={(next) => onChange(next ?? "")}
            loading={
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                에디터를 불러오는 중...
              </div>
            }
            options={{
              ariaLabel: "이벤트 내용 HTML 편집기",
              automaticLayout: true,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 14,
              lineHeight: 22,
              lineNumbers: "on",
              glyphMargin: false,
              folding: false,
              minimap: { enabled: false },
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: "on",
            }}
          />
        </Suspense>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>이벤트 내용 미리보기</DialogTitle>
          </DialogHeader>
          <EventContent
            content={value}
            className="min-h-40 rounded-2xl border bg-background p-6 text-base leading-8"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
