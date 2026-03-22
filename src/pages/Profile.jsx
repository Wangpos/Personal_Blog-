import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, Edit2, User, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const { username } = useParams();
  const { user, profile: currentUserProfile } = useAuth();

  const isOwnProfile =
    currentUserProfile?.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    fetchProfile();
    fetchUserPosts();
  }, [username]);

  const fetchProfile = async () => {
    try {
      console.log("Fetching profile for username:", username);
      // Try exact match first
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", username)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
      console.log("Profile fetched successfully:", data);
      setProfile(data);
      setBio(data.bio || "");
    } catch (error) {
      console.error("Error in fetchProfile:", error.message);
      toast.error("Profile not found");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!username) {
      console.warn("Username is not available for fetching posts");
      return;
    }

    try {
      console.log("Fetching posts for username:", username);
      // First get the profile to find author_id (case-insensitive)
      const { data: profilesData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username);

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }
      if (!profilesData || profilesData.length === 0) {
        console.warn("Profile not found for username:", username);
        return;
      }

      const authorId = profilesData[0].id;
      console.log("Found author ID:", authorId);

      // Then fetch posts using the author_id
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", authorId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Posts fetch error:", error);
        throw error;
      }
      console.log("Posts fetched successfully:", data);
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
      setPosts([]);
    }
  };

  const handleUpdateBio = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Bio updated!");
      setEditing(false);
      fetchProfile();
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
        <div style={{ color: "var(--slate)" }}>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--navy)" }}
      >
        <div style={{ color: "var(--slate)" }}>Profile not found</div>
      </div>
    );
  }

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

        {/* Profile Header */}
        <div
          className="rounded-lg p-8 mb-6"
          style={{
            background: "var(--light-navy)",
            border: "1px solid var(--lightest-navy)",
          }}
        >
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--green-tint)" }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="h-24 w-24 rounded-full"
                />
              ) : (
                <User className="h-12 w-12" style={{ color: "var(--green)" }} />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1
                    className="text-3xl font-bold"
                    style={{ color: "var(--lightest-slate)" }}
                  >
                    {profile.full_name || profile.username}
                  </h1>
                  <p style={{ color: "var(--slate)" }}>@{profile.username}</p>
                </div>
                {isOwnProfile && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <div
                className="flex items-center space-x-4 text-sm mb-4"
                style={{ color: "var(--slate)" }}
              >
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </span>
                <span className="tag">{profile.role || "Writer"}</span>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="textarea-field"
                  />
                  <div className="flex space-x-3">
                    <button onClick={handleUpdateBio} className="btn-primary">
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setBio(profile.bio || "");
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--light-slate)" }}>
                  {profile.bio || "No bio yet"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Posts */}
        <div
          className="rounded-lg p-8"
          style={{
            background: "var(--light-navy)",
            border: "1px solid var(--lightest-navy)",
          }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--lightest-slate)" }}
          >
            Posts ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <p className="text-center py-8" style={{ color: "var(--slate)" }}>
              No posts yet
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block p-4 rounded-lg transition-all"
                  style={{
                    background: "var(--navy)",
                    border: "1px solid var(--lightest-navy)",
                  }}
                >
                  <h3
                    className="text-xl font-semibold mb-2 transition-colors hover:text-[var(--green)]"
                    style={{ color: "var(--lightest-slate)" }}
                  >
                    {post.title}
                  </h3>
                  <div
                    className="flex items-center space-x-4 text-sm"
                    style={{ color: "var(--slate)" }}
                  >
                    <span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span>{post.views || 0} views</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
