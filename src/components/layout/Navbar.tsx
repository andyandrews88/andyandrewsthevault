import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Shield, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/stores/authStore";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const profileFetchedRef = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut, isLoading } = useAuthStore();
  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      setAvatarUrl(null);
      profileFetchedRef.current = null;
      return;
    }
    // Only fetch once per user id
    if (profileFetchedRef.current === user.id) return;
    profileFetchedRef.current = user.id;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();
      setDisplayName(data?.display_name || user.email?.split("@")[0] || "Account");
      setAvatarUrl(data?.avatar_url || null);
    };
    fetchProfile();
  }, [user]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/audit", label: "Audit" },
    { href: "/nutrition", label: "Nutrition" },
    { href: "/vault", label: "The Vault" },
  ];

  const handleSignOut = async () => {
    navigate("/");
    await signOut();
    toast.success("Signed out successfully");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <nav className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src={logo} 
            alt="Andy Andrews" 
            className="h-12 md:h-16 lg:h-20 w-auto invert brightness-100 hover:brightness-125 transition-all"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm transition-colors ${
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Auth buttons */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="max-w-[120px] truncate">
                    {displayName || 'Account'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Profile Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer">
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate('/auth')}
              disabled={isLoading}
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden glass border-t border-border">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block py-3 px-4 rounded-lg text-base transition-colors ${
                  location.pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile auth button */}
            <div className="pt-2 border-t border-border mt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 py-3 px-4 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 py-3 px-4 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 py-3 px-4 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="block py-3 px-4 rounded-lg text-base bg-primary text-primary-foreground text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
