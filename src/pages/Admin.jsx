import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import StatCard from "../components/StatCard";
import {
  LayoutDashboard,
  FileText,
  Users,
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  HardDrive,
  Database,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Activity,
  UserPlus,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Admin() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Stats state
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalUsers: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    storageUsed: 0,
    storageLimit: 1073741824, // 1GB in bytes
  });

  // Data lists
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch posts stats
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, is_published, views, created_at, title, author_id");

      if (postsError) throw postsError;

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Fetch likes count
      const { count: likesCount, error: likesError } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true });

      if (likesError) throw likesError;

      // Fetch comments count
      const { count: commentsCount, error: commentsError } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true });

      if (commentsError) throw commentsError;

      // Fetch storage info
      const { data: storageData, error: storageError } =
        await supabase.storage.getBucket("blog-images");

      // Calculate stats
      const publishedPosts =
        postsData?.filter((p) => p.is_published).length || 0;
      const totalViews =
        postsData?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

      setStats({
        totalPosts: postsData?.length || 0,
        publishedPosts,
        draftPosts: (postsData?.length || 0) - publishedPosts,
        totalUsers: usersCount || 0,
        totalViews,
        totalLikes: likesCount || 0,
        totalComments: commentsCount || 0,
        storageUsed: 0, // Will calculate from storage data
        storageLimit: 1073741824,
      });

      // Fetch detailed posts with author info
      const { data: postsWithAuthors, error: postsWithAuthorsError } =
        await supabase.from("posts").select("*, profiles(username, full_name)");

      if (postsWithAuthorsError) throw postsWithAuthorsError;
      setPosts(postsWithAuthors || []);

      // Fetch users
      const { data: usersData, error: usersDataError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersDataError) throw usersDataError;
      setUsers(usersData || []);

      // Generate recent activity
      const activity = generateRecentActivity(
        postsWithAuthors || [],
        usersData || [],
      );
      setRecentActivity(activity);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (postsData, usersData) => {
    const activities = [];

    // Add recent posts
    postsData.slice(0, 5).forEach((post) => {
      activities.push({
        id: `post-${post.id}`,
        type: "post",
        title: post.title,
        user: post.profiles?.full_name || post.profiles?.username || "Unknown",
        timestamp: post.created_at,
        status: post.is_published ? "published" : "draft",
      });
    });

    // Add recent users
    usersData.slice(0, 3).forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: "user",
        title: "New user registered",
        user: user.full_name || user.username,
        timestamp: user.created_at,
        status: "active",
      });
    });

    // Sort by timestamp
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      toast.success("Post deleted successfully");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTogglePublish = async (postId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_published: !currentStatus })
        .eq("id", postId);

      if (error) throw error;

      toast.success(currentStatus ? "Post unpublished" : "Post published");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.profiles?.username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "published" && post.is_published) ||
      (filterStatus === "draft" && !post.is_published);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--navy)" }}
      >
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[var(--green)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ color: "var(--slate)" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--navy)" }}>
      {/* Admin Header */}
      <div
        className="sticky top-16 z-40 backdrop-blur-md border-b"
        style={{
          background: "rgba(10, 25, 47, 0.95)",
          borderColor: "var(--lightest-navy)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--lightest-slate)" }}
              >
                Admin Dashboard
              </h1>
              <p style={{ color: "var(--slate)" }} className="text-sm">
                Welcome back, {profile?.full_name || profile?.username}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "posts", label: "Posts", icon: FileText },
              { id: "users", label: "Users", icon: Users },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[var(--green)]"
                    : "text-[var(--slate)] hover:text-[var(--light-slate)]"
                }`}
                style={{
                  background:
                    activeTab === tab.id ? "var(--green-tint)" : "transparent",
                  border:
                    activeTab === tab.id
                      ? "1px solid var(--green)"
                      : "1px solid transparent",
                }}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Posts"
                value={stats.totalPosts}
                subtitle={`${stats.publishedPosts} published, ${stats.draftPosts} drafts`}
                icon={FileText}
                color="green"
              />
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                subtitle="Registered accounts"
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Total Views"
                value={stats.totalViews.toLocaleString()}
                subtitle="Across all posts"
                icon={Eye}
                color="purple"
              />
              <StatCard
                title="Engagement"
                value={stats.totalLikes + stats.totalComments}
                subtitle={`${stats.totalLikes} likes, ${stats.totalComments} comments`}
                icon={Heart}
                color="orange"
              />
            </div>

            {/* Storage & Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Storage Usage */}
              <div
                className="rounded-lg p-6"
                style={{
                  background: "var(--light-navy)",
                  border: "1px solid var(--lightest-navy)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(100, 255, 218, 0.1)" }}
                  >
                    <HardDrive
                      className="h-5 w-5"
                      style={{ color: "var(--green)" }}
                    />
                  </div>
                  <div>
                    <h3
                      style={{ color: "var(--lightest-slate)" }}
                      className="font-semibold"
                    >
                      Storage Usage
                    </h3>
                    <p style={{ color: "var(--slate)" }} className="text-sm">
                      Blog images & assets
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: "var(--slate)" }}>
                      {formatBytes(stats.storageUsed)} used
                    </span>
                    <span style={{ color: "var(--slate)" }}>
                      {formatBytes(stats.storageLimit)} limit
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--navy)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((stats.storageUsed / stats.storageLimit) * 100, 100)}%`,
                        background: "var(--green)",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="grid grid-cols-2 gap-4 pt-4"
                  style={{ borderTop: "1px solid var(--lightest-navy)" }}
                >
                  <div>
                    <p style={{ color: "var(--slate)" }} className="text-xs">
                      Database
                    </p>
                    <p
                      style={{ color: "var(--lightest-slate)" }}
                      className="font-semibold"
                    >
                      {stats.totalPosts} posts
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div
                className="rounded-lg p-6"
                style={{
                  background: "var(--light-navy)",
                  border: "1px solid var(--lightest-navy)",
                }}
              >
                <h3
                  style={{ color: "var(--lightest-slate)" }}
                  className="font-semibold mb-4"
                >
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/create"
                    className="btn-primary text-center text-sm py-2"
                  >
                    <FileText className="h-4 w-4 inline mr-1" />
                    New Post
                  </Link>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="btn-secondary text-center text-sm py-2"
                  >
                    <UserPlus className="h-4 w-4 inline mr-1" />
                    Manage Users
                  </button>
                  <button
                    onClick={() => setActiveTab("posts")}
                    className="btn-secondary text-center text-sm py-2"
                  >
                    <Edit className="h-4 w-4 inline mr-1" />
                    Edit Posts
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className="btn-secondary text-center text-sm py-2"
                  >
                    <BarChart3 className="h-4 w-4 inline mr-1" />
                    View Analytics
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div
                className="rounded-lg p-6"
                style={{
                  background: "var(--light-navy)",
                  border: "1px solid var(--lightest-navy)",
                }}
              >
                <h3
                  style={{ color: "var(--lightest-slate)" }}
                  className="font-semibold mb-4"
                >
                  Recent Activity
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p style={{ color: "var(--slate)" }} className="text-sm">
                      No recent activity
                    </p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 rounded-lg"
                        style={{ background: "var(--navy)" }}
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              activity.type === "post"
                                ? "rgba(100, 255, 218, 0.1)"
                                : "rgba(100, 181, 246, 0.1)",
                          }}
                        >
                          {activity.type === "post" ? (
                            <FileText
                              className="h-4 w-4"
                              style={{ color: "var(--green)" }}
                            />
                          ) : (
                            <Users
                              className="h-4 w-4"
                              style={{ color: "#64b5f6" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            style={{ color: "var(--lightest-slate)" }}
                            className="text-sm font-medium truncate"
                          >
                            {activity.title}
                          </p>
                          <p
                            style={{ color: "var(--slate)" }}
                            className="text-xs"
                          >
                            by {activity.user} •{" "}
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                          style={{
                            background:
                              activity.status === "published"
                                ? "rgba(100, 255, 218, 0.1)"
                                : activity.status === "draft"
                                  ? "rgba(255, 183, 77, 0.1)"
                                  : "rgba(100, 181, 246, 0.1)",
                            color:
                              activity.status === "published"
                                ? "var(--green)"
                                : activity.status === "draft"
                                  ? "#ffb74d"
                                  : "#64b5f6",
                          }}
                        >
                          {activity.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            {/* Filters */}
            <div
              className="rounded-lg p-4 flex flex-col md:flex-row gap-4"
              style={{
                background: "var(--light-navy)",
                border: "1px solid var(--lightest-navy)",
              }}
            >
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "var(--slate)" }}
                />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Posts Table */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "var(--light-navy)",
                border: "1px solid var(--lightest-navy)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--navy)" }}>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Post
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Author
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Status
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Views
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Date
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center"
                          style={{ color: "var(--slate)" }}
                        >
                          No posts found
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((post) => (
                        <tr
                          key={post.id}
                          style={{
                            borderTop: "1px solid var(--lightest-navy)",
                          }}
                        >
                          <td className="px-6 py-4">
                            <Link
                              to={`/post/${post.id}`}
                              className="font-medium hover:text-[var(--green)] transition-colors"
                              style={{ color: "var(--lightest-slate)" }}
                            >
                              {post.title || "Untitled"}
                            </Link>
                          </td>
                          <td
                            className="px-6 py-4"
                            style={{ color: "var(--slate)" }}
                          >
                            {post.profiles?.username || "Unknown"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                handleTogglePublish(post.id, post.is_published)
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                              style={{
                                background: post.is_published
                                  ? "rgba(100, 255, 218, 0.1)"
                                  : "rgba(255, 183, 77, 0.1)",
                                color: post.is_published
                                  ? "var(--green)"
                                  : "#ffb74d",
                              }}
                            >
                              {post.is_published ? (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  Draft
                                </>
                              )}
                            </button>
                          </td>
                          <td
                            className="px-6 py-4"
                            style={{ color: "var(--slate)" }}
                          >
                            {post.views || 0}
                          </td>
                          <td
                            className="px-6 py-4"
                            style={{ color: "var(--slate)" }}
                          >
                            {new Date(post.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/edit/${post.id}`}
                                className="p-2 rounded transition-colors hover:bg-[var(--lightest-navy)]"
                                style={{ color: "var(--slate)" }}
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="p-2 rounded transition-colors hover:bg-red-500/10"
                                style={{ color: "#ef5350" }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "var(--light-navy)",
                border: "1px solid var(--lightest-navy)",
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--navy)" }}>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        User
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Role
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Joined
                      </th>
                      <th
                        className="text-left px-6 py-4 text-sm font-medium"
                        style={{ color: "var(--slate)" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        style={{ borderTop: "1px solid var(--lightest-navy)" }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center"
                              style={{ background: "var(--green-tint)" }}
                            >
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.username}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <span
                                  className="font-semibold"
                                  style={{ color: "var(--green)" }}
                                >
                                  {(user.full_name || user.username)?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p
                                className="font-medium"
                                style={{ color: "var(--lightest-slate)" }}
                              >
                                {user.full_name || user.username}
                              </p>
                              <p
                                style={{ color: "var(--slate)" }}
                                className="text-sm"
                              >
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background:
                                user.role === "admin"
                                  ? "rgba(100, 255, 218, 0.1)"
                                  : "rgba(100, 181, 246, 0.1)",
                              color:
                                user.role === "admin"
                                  ? "var(--green)"
                                  : "#64b5f6",
                            }}
                          >
                            {user.role || "Writer"}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ color: "var(--slate)" }}
                        >
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/profile/${user.username}`}
                            className="text-sm hover:underline"
                            style={{ color: "var(--green)" }}
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Content Distribution */}
              <div
                className="rounded-lg p-6"
                style={{
                  background: "var(--light-navy)",
                  border: "1px solid var(--lightest-navy)",
                }}
              >
                <h3
                  className="font-semibold mb-6"
                  style={{ color: "var(--lightest-slate)" }}
                >
                  Content Distribution
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: "var(--slate)" }}>
                        Published Posts
                      </span>
                      <span style={{ color: "var(--lightest-slate)" }}>
                        {stats.publishedPosts}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--navy)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${
                            stats.totalPosts
                              ? (stats.publishedPosts / stats.totalPosts) * 100
                              : 0
                          }%`,
                          background: "var(--green)",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: "var(--slate)" }}>Draft Posts</span>
                      <span style={{ color: "var(--lightest-slate)" }}>
                        {stats.draftPosts}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--navy)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${
                            stats.totalPosts
                              ? (stats.draftPosts / stats.totalPosts) * 100
                              : 0
                          }%`,
                          background: "#ffb74d",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Overview */}
              <div
                className="rounded-lg p-6"
                style={{
                  background: "var(--light-navy)",
                  border: "1px solid var(--lightest-navy)",
                }}
              >
                <h3
                  className="font-semibold mb-6"
                  style={{ color: "var(--lightest-slate)" }}
                >
                  Engagement Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: "var(--navy)" }}
                  >
                    <Heart
                      className="h-5 w-5 mb-2"
                      style={{ color: "var(--green)" }}
                    />
                    <p style={{ color: "var(--slate)" }} className="text-sm">
                      Total Likes
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "var(--lightest-slate)" }}
                    >
                      {stats.totalLikes}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: "var(--navy)" }}
                  >
                    <MessageSquare
                      className="h-5 w-5 mb-2"
                      style={{ color: "#64b5f6" }}
                    />
                    <p style={{ color: "var(--slate)" }} className="text-sm">
                      Comments
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "var(--lightest-slate)" }}
                    >
                      {stats.totalComments}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: "var(--navy)" }}
                  >
                    <Eye
                      className="h-5 w-5 mb-2"
                      style={{ color: "#ba68c8" }}
                    />
                    <p style={{ color: "var(--slate)" }} className="text-sm">
                      Total Views
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "var(--lightest-slate)" }}
                    >
                      {stats.totalViews}
                    </p>
                  </div>
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: "var(--navy)" }}
                  >
                    <TrendingUp
                      className="h-5 w-5 mb-2"
                      style={{ color: "#ffb74d" }}
                    />
                    <p style={{ color: "var(--slate)" }} className="text-sm">
                      Avg Views/Post
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "var(--lightest-slate)" }}
                    >
                      {stats.totalPosts
                        ? Math.round(stats.totalViews / stats.totalPosts)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
