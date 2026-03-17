import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, User, UserCircle, ArrowRight } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, username, fullName);

    setLoading(false);
    if (!error) {
      navigate("/login");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ background: 'var(--navy)', marginTop: '-64px', paddingTop: '64px' }}
    >
      <div
        className="max-w-md w-full p-8 sm:p-10 rounded-lg"
        style={{
          background: 'var(--light-navy)',
          border: '1px solid var(--lightest-navy)',
          boxShadow: '0 10px 30px -15px var(--navy-shadow)'
        }}
      >
        <div className="text-center">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--lightest-slate)' }}
          >
            Create Account
          </h2>
          <p style={{ color: 'var(--slate)' }}>
            Already have an account?{" "}
            <Link to="/login" className="link-underline">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--light-slate)' }}
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: 'var(--slate)' }}
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--light-slate)' }}
              >
                Full Name
              </label>
              <div className="relative">
                <UserCircle
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  style={{ color: 'var(--slate)' }}
                />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--light-slate)' }}
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: 'var(--slate)' }}
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field pl-10"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--light-slate)' }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: 'var(--slate)' }}
              />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input-field pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-6"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              "Creating account..."
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
