import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { lowlight } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Strikethrough,
  Palette,
} from "lucide-react";
import { useState, useCallback } from "react";
import { uploadImage } from "../lib/supabaseStorage";
import toast from "react-hot-toast";

const MenuBar = ({ editor }) => {
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor) return null;

  const addImage = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
        toast.success("Image uploaded!");
      } catch (error) {
        // Error already toasted in uploadImage
      } finally {
        setUploading(false);
      }
    };

    input.click();
  }, [editor]);

  const buttonClass = (isActive) =>
    `p-2 rounded transition-all duration-150 ${
      isActive
        ? "text-[var(--green)]"
        : "text-[var(--slate)] hover:text-[var(--green)] hover:bg-[var(--green-tint)]"
    }`;

  const dividerClass = "w-px h-6 mx-1";

  return (
    <div
      className="sticky top-0 p-2 flex flex-wrap gap-1 z-10"
      style={{
        background: "var(--light-navy)",
        borderBottom: "1px solid var(--lightest-navy)",
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive("bold"))}
        type="button"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive("italic"))}
        type="button"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive("underline"))}
        type="button"
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive("strike"))}
        type="button"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={buttonClass(editor.isActive("code"))}
        type="button"
        title="Code"
      >
        <Code className="h-4 w-4" />
      </button>

      <div
        className={dividerClass}
        style={{ background: "var(--lightest-navy)" }}
      />

      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={buttonClass(false)}
          type="button"
          title="Text Color"
        >
          <Palette className="h-4 w-4" />
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 rounded-lg bg-[var(--light-navy)] border border-[var(--lightest-navy)] z-20">
            <div className="grid grid-cols-4 gap-2">
              {[
                "#64ffda",
                "#ff6b6b",
                "#ffd93d",
                "#6bcf7f",
                "#4d96ff",
                "#d946ef",
                "#ffffff",
                "#a8b2d1",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-[var(--lightest-navy)] hover:border-[var(--green)]"
                  style={{ backgroundColor: color }}
                  type="button"
                  title={`Color: ${color}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={dividerClass}
        style={{ background: "var(--lightest-navy)" }}
      />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
        type="button"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
        type="button"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 3 }))}
        type="button"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      <div
        className={dividerClass}
        style={{ background: "var(--lightest-navy)" }}
      />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive("bulletList"))}
        type="button"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive("orderedList"))}
        type="button"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive("blockquote"))}
        type="button"
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div
        className={dividerClass}
        style={{ background: "var(--lightest-navy)" }}
      />

      <button
        onClick={addImage}
        disabled={uploading}
        className={`${buttonClass(false)} ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        type="button"
        title="Insert Image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}) {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Underline,
      TextStyle,
      Color,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file).then((url) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadImage(file).then((url) => {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              });
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        border: isFocused
          ? "1px solid var(--green)"
          : "1px solid var(--lightest-navy)",
        boxShadow: isFocused ? "0 0 0 2px var(--green-tint)" : "none",
      }}
    >
      {isFocused && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="notion-editor" />
    </div>
  );
}
