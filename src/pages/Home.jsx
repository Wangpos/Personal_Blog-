import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Eye, Heart, Clock, User } from "lucide-react";
import toast from "react-hot-toast";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, [filter]);

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

    // Extract text from JSON content
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Latest Blog Posts
          </h1>
          <p className="text-gray-600">
            Discover stories, thinking, and expertise from writers
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No posts yet. Be the first to write!
            </p>
            <Link
              to="/create"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                <Link to={`/post/${post.id}`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-indigo-600">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {truncateText(getTextFromContent(post.content))}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <Link
                    to={`/profile/${post.profiles?.username}`}
                    className="flex items-center space-x-2 hover:text-indigo-600"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      {post.profiles?.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt={post.profiles.username}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                    <span className="font-medium">
                      {post.profiles?.full_name || post.profiles?.username}
                    </span>
                  </Link>

                  <div className="flex items-center space-x-4">
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
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
