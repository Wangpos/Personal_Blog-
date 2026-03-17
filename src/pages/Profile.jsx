import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Calendar, Edit2, User } from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const { username } = useParams();
  const { user, profile: currentUserProfile } = useAuth();

  const isOwnProfile = currentUserProfile?.username === username;

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      setProfile(data);
      setBio(data.bio || "");
    } catch (error) {
      toast.error("Profile not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq(
          "author_id",
          (
            await supabase
              .from("profiles")
              .select("id")
              .eq("username", username)
              .single()
          ).data?.id,
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error.message);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start space-x-6">
            <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="h-24 w-24 rounded-full"
                />
              ) : (
                <User className="h-12 w-12 text-indigo-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-gray-600">@{profile.username}</p>
                </div>
                {isOwnProfile && !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </span>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                  {profile.role || "Writer"}
                </span>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateBio}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setBio(profile.bio || "");
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">{profile.bio || "No bio yet"}</p>
              )}
            </div>
          </div>
        </div>

        {/* User Posts */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Posts ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No posts yet</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
