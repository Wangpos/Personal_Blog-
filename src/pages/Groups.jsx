import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Users as UsersIcon, Plus, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const groupIds = memberData.map((m) => m.group_id);

      if (groupIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*, profiles(username, full_name)")
        .in("id", groupIds);

      if (groupsError) throw groupsError;

      setGroups(groupsData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: groupName,
          description: groupDescription,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      toast.success("Group created!");
      setGroupName("");
      setGroupDescription("");
      setShowCreateForm(false);
      fetchGroups();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
        <div style={{ color: 'var(--slate)' }}>Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" style={{ background: 'var(--navy)' }}>
      <div className="section-container max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: 'var(--lightest-slate)' }}
            >
              <span style={{ color: 'var(--green)' }}>Groups</span>
            </h1>
            <p style={{ color: 'var(--slate)' }}>
              Collaborate with students and teachers
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Create Group Form */}
        {showCreateForm && (
          <div
            className="rounded-lg p-6 mb-6"
            style={{
              background: 'var(--light-navy)',
              border: '1px solid var(--lightest-navy)'
            }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--lightest-slate)' }}
            >
              Create New Group
            </h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label
                  htmlFor="groupName"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--light-slate)' }}
                >
                  Group Name
                </label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Computer Science Class 2024"
                  className="input-field"
                />
              </div>
              <div>
                <label
                  htmlFor="groupDescription"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--light-slate)' }}
                >
                  Description
                </label>
                <textarea
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Describe the purpose of this group..."
                  rows={3}
                  className="textarea-field"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setGroupName("");
                    setGroupDescription("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center"
            style={{
              background: 'var(--light-navy)',
              border: '1px solid var(--lightest-navy)'
            }}
          >
            <UsersIcon
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: 'var(--slate)' }}
            />
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--lightest-slate)' }}
            >
              No groups yet
            </h3>
            <p style={{ color: 'var(--slate)' }}>
              Create a group to start collaborating
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--green-tint)' }}
                    >
                      <UsersIcon className="h-6 w-6" style={{ color: 'var(--green)' }} />
                    </div>
                    <div>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: 'var(--lightest-slate)' }}
                      >
                        {group.name}
                      </h3>
                      <p style={{ color: 'var(--slate)' }} className="text-sm">
                        Created by{" "}
                        {group.profiles?.full_name || group.profiles?.username}
                      </p>
                    </div>
                  </div>
                </div>

                <p style={{ color: 'var(--light-slate)' }} className="mb-4">
                  {group.description || "No description"}
                </p>

                <div
                  className="flex items-center justify-between pt-4"
                  style={{ borderTop: '1px solid var(--lightest-navy)' }}
                >
                  <span style={{ color: 'var(--slate)' }} className="text-sm">
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </span>
                  <button
                    className="flex items-center space-x-1 transition-colors hover:text-[var(--green)]"
                    style={{ color: 'var(--green)' }}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm">View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
