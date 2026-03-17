import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import RichTextEditor from "../components/RichTextEditor";
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Fixed Action Bar */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-8 py-4 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  ← Back
                </button>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="publish"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="publish" className="text-sm text-gray-600">
                    Publish
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading ? "Saving..." : isPublished ? "Publish" : "Save Draft"}
              </button>
            </div>
          </div>

          {/* Title Input - Notion Style */}
          <div className="px-24 pt-12">
            <input
              type="text"
              placeholder="Untitled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-5xl font-bold border-none focus:outline-none placeholder-gray-300"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif',
                lineHeight: "1.2",
              }}
            />
          </div>

          {/* Editor */}
          <div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Press '/' for commands or just start typing..."
            />
          </div>
        </form>
      </div>
    </div>
  );
}
