import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PenSquare, LogOut, User, Home, Users, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: 'rgba(10, 25, 47, 0.85)',
        borderBottom: '1px solid rgba(100, 255, 218, 0.1)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <PenSquare
                className="h-7 w-7 transition-colors"
                style={{ color: 'var(--green)' }}
              />
              <span
                className="text-xl font-bold transition-colors group-hover:text-[var(--green)]"
                style={{ color: 'var(--lightest-slate)' }}
              >
                Blog
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  to="/"
                  className="flex items-center space-x-1 px-4 py-2 rounded text-sm font-medium transition-all hover:text-[var(--green)]"
                  style={{ color: 'var(--light-slate)' }}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link> 
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/create"
                  className="btn-primary"
                >
                  <PenSquare className="h-4 w-4 mr-2" />
                  <span>Write</span>
                </Link>
                {profile?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-3 py-2 rounded transition-all hover:text-[var(--green)]"
                    style={{ color: 'var(--light-slate)' }}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="hidden md:inline text-sm">Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded transition-all hover:text-[var(--green)]"
                  style={{ color: 'var(--light-slate)' }}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">
                    {profile?.username || "Profile"}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 rounded transition-all hover:text-[var(--green)]"
                  style={{ color: 'var(--slate)' }}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded text-sm font-medium transition-all hover:text-[var(--green)]"
                  style={{ color: 'var(--light-slate)' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
