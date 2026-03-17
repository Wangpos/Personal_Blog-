import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();

    const subscription = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment,
      });

      if (error) throw error;

      setNewComment("");
      toast.success("Comment added!");
      fetchComments();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comment deleted");
      fetchComments();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h3
        className="text-2xl font-bold flex items-center space-x-2"
        style={{ color: 'var(--lightest-slate)' }}
      >
        <MessageCircle className="h-6 w-6" style={{ color: 'var(--green)' }} />
        <span>Comments ({comments.length})</span>
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="textarea-field"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <Send className="h-4 w-4" />
            <span>{loading ? "Posting..." : "Post Comment"}</span>
          </button>
        </form>
      ) : (
        <p style={{ color: 'var(--slate)' }}>Please sign in to comment</p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg p-4"
            style={{
              background: 'var(--navy)',
              border: '1px solid var(--lightest-navy)'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--green-tint)' }}
                >
                  {comment.profiles?.avatar_url ? (
                    <img
                      src={comment.profiles.avatar_url}
                      alt={comment.profiles.username}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <span style={{ color: 'var(--green)' }} className="font-semibold">
                      {comment.profiles?.full_name?.charAt(0) ||
                        comment.profiles?.username?.charAt(0) ||
                        "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span style={{ color: 'var(--lightest-slate)' }} className="font-medium">
                      {comment.profiles?.full_name ||
                        comment.profiles?.username}
                    </span>
                    <span style={{ color: 'var(--slate)' }} className="text-sm">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--light-slate)' }} className="mt-1">{comment.content}</p>
                </div>
              </div>

              {user && user.id === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="transition-colors hover:text-red-400"
                  style={{ color: 'var(--slate)' }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
