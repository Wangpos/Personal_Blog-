import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import RichTextEditor from "../components/RichTextEditor";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-6 space-y-6"
        >
          <div>
            <input
              type="text"
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-bold border-none focus:outline-none focus:ring-0 placeholder-gray-300"
            />
          </div>

          <div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Tell your story..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="publish" className="text-sm text-gray-700">
                  Published
                </label>
              </div>

              <button
                type="button"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Delete Post
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate(`/post/${id}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
