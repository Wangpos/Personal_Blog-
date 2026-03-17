import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Eye, Clock, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from("posts")
        .select("*, profiles(username, full_name, avatar_url)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setPosts(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getTextFromContent = (content) => {
    if (!content) return "";
    if (typeof content === "string") return content;

    try {
      const extractText = (node) => {
        if (node.type === "text") return node.text;
        if (node.content) {
          return node.content.map(extractText).join(" ");
        }
        return "";
      };
      return extractText(content);
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
        <div style={{ color: 'var(--slate)' }}>Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16" style={{ background: 'var(--navy)' }}>
      <div className="section-container">
        {/* Header */}
        <div className="mb-16">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--lightest-slate)' }}
          >
            Latest <span style={{ color: 'var(--green)' }}>Posts</span>
          </h1>
          <p style={{ color: 'var(--slate)', maxWidth: '500px' }}>
            Discover stories, insights, and expertise from our community of writers.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div
            className="text-center py-16 rounded-lg"
            style={{ background: 'var(--light-navy)', border: '1px solid var(--lightest-navy)' }}
          >
            <p style={{ color: 'var(--slate)', marginBottom: '1.5rem' }}>
              No posts yet. Be the first to write!
            </p>
            <Link to="/create" className="btn-primary">
              Create Post
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className="glass-card p-6 flex flex-col animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to={`/post/${post.id}`} className="flex-1">
                  <h2
                    className="text-xl font-semibold mb-3 transition-colors hover:text-[var(--green)]"
                    style={{ color: 'var(--lightest-slate)' }}
                  >
                    {post.title}
                  </h2>
                </Link>

                <p
                  className="mb-6 line-clamp-3 flex-1"
                  style={{ color: 'var(--slate)' }}
                >
                  {truncateText(getTextFromContent(post.content))}
                </p>

                <div
                  className="flex items-center justify-between pt-4 mt-auto"
                  style={{ borderTop: '1px solid var(--lightest-navy)' }}
                >
                  <Link
                    to={`/profile/${post.profiles?.username}`}
                    className="flex items-center space-x-2 transition-colors hover:text-[var(--green)]"
                    style={{ color: 'var(--light-slate)' }}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--green-tint)' }}
                    >
                      {post.profiles?.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt={post.profiles.username}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4" style={{ color: 'var(--green)' }} />
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {post.profiles?.full_name || post.profiles?.username}
                    </span>
                  </Link>

                  <div className="flex items-center space-x-4 text-sm" style={{ color: 'var(--slate)' }}>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.views || 0}</span>
                    </span>
                  </div>
                </div>

                <Link
                  to={`/post/${post.id}`}
                  className="mt-4 flex items-center text-sm font-medium transition-all group"
                  style={{ color: 'var(--green)' }}
                >
                  <span>Read more</span>
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
