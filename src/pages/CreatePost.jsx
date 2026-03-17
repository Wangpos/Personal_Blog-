import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import RichTextEditor from "../components/RichTextEditor";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title,
            content,
            author_id: user.id,
            is_published: isPublished,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success(isPublished ? "Post published!" : "Draft saved!");
      navigate(`/post/${data.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Fixed Action Bar */}
          <div
            className="sticky top-16 backdrop-blur-md px-8 py-4 z-20"
            style={{
              background: 'rgba(10, 25, 47, 0.95)',
              borderBottom: '1px solid var(--lightest-navy)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center space-x-1 transition-colors hover:text-[var(--green)]"
                  style={{ color: 'var(--slate)' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Back</span>
                </button>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="publish"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded"
                    style={{
                      accentColor: 'var(--green)',
                      background: 'var(--light-navy)',
                      borderColor: 'var(--lightest-navy)'
                    }}
                  />
                  <label htmlFor="publish" className="text-sm" style={{ color: 'var(--light-slate)' }}>
                    Publish
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Saving..." : isPublished ? "Publish" : "Save Draft"}
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div className="px-8 md:px-16 pt-8">
            <input
              type="text"
              placeholder="Untitled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl md:text-5xl font-bold border-none focus:outline-none placeholder-opacity-30"
              style={{
                background: 'transparent',
                color: 'var(--lightest-slate)',
              }}
            />
          </div>

          {/* Editor */}
          <div className="px-8 md:px-16">
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your story..."
            />
          </div>
        </form>
      </div>
    </div>
  );
}
