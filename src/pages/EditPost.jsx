import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import RichTextEditor from "../components/RichTextEditor";
import { ArrowLeft, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function EditPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.author_id !== user.id) {
        toast.error("You can only edit your own posts");
        navigate("/");
        return;
      }

      setTitle(data.title);
      setContent(data.content);
      setIsPublished(data.is_published);
    } catch (error) {
      toast.error(error.message);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title,
          content,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Post updated!");
      navigate(`/post/${id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await supabase.from("posts").delete().eq("id", id);

      if (error) throw error;

      toast.success("Post deleted");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
        <div style={{ color: 'var(--slate)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Action Bar */}
        <div
          className="flex items-center justify-between mb-6 p-4 rounded-lg"
          style={{
            background: 'var(--light-navy)',
            border: '1px solid var(--lightest-navy)'
          }}
        >
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
                style={{ accentColor: 'var(--green)' }}
              />
              <label htmlFor="publish" className="text-sm" style={{ color: 'var(--light-slate)' }}>
                Published
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Delete</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/post/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-form"
              disabled={saving}
              className="btn-primary"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <form
          id="edit-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <input
              type="text"
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-bold border-none focus:outline-none placeholder-opacity-30"
              style={{
                background: 'transparent',
                color: 'var(--lightest-slate)'
              }}
            />
          </div>

          <div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Tell your story..."
            />
          </div>
        </form>
      </div>
    </div>
  );
}
