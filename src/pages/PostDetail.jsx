import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import CommentSection from "../components/CommentSection";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import { Eye, Heart, Edit, Clock, ArrowLeft } from "lucide-react";
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

      if (!postData.is_published && (!user || postData.author_id !== user.id)) {
        toast.error("This post is not published");
        navigate("/");
        return;
      }

      setPost(postData);
      setAuthor(postData.profiles);

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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--navy)" }}
      >
        <div style={{ color: "var(--slate)" }}>Loading...</div>
      </div>
    );
  }

  if (!post) return null;

  // Check if content is empty or only contains empty document structure
  const hasContent =
    post.content && post.content.content && post.content.content.length > 0;

  const htmlContent = hasContent
    ? generateHTML(post.content, [
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
      ])
    : "<p>No content</p>";

  return (
    <div className="min-h-screen py-12" style={{ background: "var(--navy)" }}>
      <div className="section-container max-w-4xl">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 mb-8 transition-colors hover:text-[var(--green)]"
          style={{ color: "var(--green)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to posts</span>
        </Link>

        <article>
          {/* Post Card */}
          <div
            className="rounded-lg p-8 mb-6"
            style={{
              background: "var(--light-navy)",
              border: "1px solid var(--lightest-navy)",
            }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ color: "var(--lightest-slate)" }}
              >
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Link
                    to={`/profile/${author?.username}`}
                    className="flex items-center space-x-3 group"
                  >
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ background: "var(--green-tint)" }}
                    >
                      {author?.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.username}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span
                          style={{ color: "var(--green)" }}
                          className="font-semibold"
                        >
                          {author?.full_name?.charAt(0) ||
                            author?.username?.charAt(0) ||
                            "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div
                        style={{ color: "var(--lightest-slate)" }}
                        className="font-medium"
                      >
                        {author?.full_name}
                      </div>
                      <div
                        style={{ color: "var(--slate)" }}
                        className="text-sm"
                      >
                        @{author?.username}
                      </div>
                    </div>
                  </Link>

                  <div
                    className="flex items-center space-x-4 text-sm"
                    style={{ color: "var(--slate)" }}
                  >
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
                    className="flex items-center space-x-1 transition-colors hover:text-[var(--green)]"
                    style={{ color: "var(--green)" }}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Content */}
            <div
              className="content-prose mb-8"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Like Button */}
            <div
              className="flex items-center space-x-4 pt-6"
              style={{ borderTop: "1px solid var(--lightest-navy)" }}
            >
              <button
                onClick={handleLike}
                className="flex items-center space-x-2 px-4 py-2 rounded transition"
                style={{
                  background: liked
                    ? "rgba(100, 255, 218, 0.1)"
                    : "transparent",
                  border: "1px solid",
                  borderColor: liked ? "var(--green)" : "var(--lightest-navy)",
                  color: liked ? "var(--green)" : "var(--slate)",
                }}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                <span>{likesCount}</span>
              </button>
            </div>
          </div>

          {/* Comments */}
          <div
            className="rounded-lg p-8"
            style={{
              background: "var(--light-navy)",
              border: "1px solid var(--lightest-navy)",
            }}
          >
            <CommentSection postId={id} />
          </div>
        </article>
      </div>
    </div>
  );
}
