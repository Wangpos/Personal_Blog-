import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import CommentSection from "../components/CommentSection";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Eye, Heart, Edit, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function PostDetail() {
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
    if (user) {
      checkLiked();
    }
    incrementViews();
  }, [id, user]);

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("id", id)
        .single();

      if (postError) throw postError;

      // Check if post is unpublished and user is not the author
      if (!postData.is_published && (!user || postData.author_id !== user.id)) {
        toast.error("This post is not published");
        navigate("/");
        return;
      }

      setPost(postData);
      setAuthor(postData.profiles);

      // Get likes count
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id);

      setLikesCount(count || 0);
    } catch (error) {
      toast.error(error.message);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const checkLiked = async () => {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single();

    setLiked(!!data);
  };

  const incrementViews = async () => {
    await supabase.rpc("increment_views", { post_id: id });
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      if (liked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", id)
          .eq("user_id", user.id);
        setLikesCount((prev) => prev - 1);
        setLiked(false);
      } else {
        await supabase.from("likes").insert({ post_id: id, user_id: user.id });
        setLikesCount((prev) => prev + 1);
        setLiked(true);
      }
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

  if (!post) return null;

  const htmlContent = post.content
    ? generateHTML(post.content, [StarterKit])
    : "<p>No content</p>";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <article className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <Link
                  to={`/profile/${author?.username}`}
                  className="flex items-center space-x-2 hover:text-indigo-600"
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    {author?.avatar_url ? (
                      <img
                        src={author.avatar_url}
                        alt={author.username}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="text-indigo-600 font-semibold">
                        {author?.full_name?.charAt(0) ||
                          author?.username?.charAt(0) ||
                          "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {author?.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{author?.username}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center space-x-3 text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.views || 0}</span>
                  </span>
                </div>
              </div>

              {user && user.id === post.author_id && (
                <Link
                  to={`/edit/${post.id}`}
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              )}
            </div>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Like Button */}
          <div className="flex items-center space-x-4 pt-6 border-t">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
                liked
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <CommentSection postId={id} />
        </div>
      </article>
    </div>
  );
}
