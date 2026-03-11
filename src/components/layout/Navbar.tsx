import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, User, LogOut, Shield, Settings, Home, FileText, Apple, Lock } from "lucide-react";
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
import {
  BottomSheetMenu,
  BottomSheetItem,
  BottomSheetSeparator,
} from "@/components/ui/bottom-sheet-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export function Navbar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const profileFetchedRef = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut, isLoading } = useAuthStore();
  const { isAdmin } = useAdminCheck();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      setAvatarUrl(null);
      profileFetchedRef.current = null;
      return;
    }
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
    { href: "/", label: "Home", icon: Home },
    { href: "/audit", label: "Audit", icon: FileText },
    { href: "/nutrition", label: "Nutrition", icon: Apple },
    { href: "/vault", label: "The Vault", icon: Lock },
  ];

  const handleSignOut = async () => {
    navigate("/");
    await signOut();
    toast.success("Signed out successfully");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setSheetOpen(false);
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

        {/* Mobile menu button → opens bottom sheet */}
        <button
          className="md:hidden p-2"
          onClick={() => setSheetOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
      </nav>

      {/* Mobile bottom sheet menu */}
      {isMobile && (
        <BottomSheetMenu open={sheetOpen} onOpenChange={setSheetOpen} title="More">
          {navLinks.map((link) => (
            <BottomSheetItem
              key={link.href}
              icon={link.icon}
              label={link.label}
              selected={location.pathname === link.href}
              onClick={() => handleNavigate(link.href)}
            />
          ))}

          <BottomSheetSeparator />

          {isAuthenticated ? (
            <>
              <BottomSheetItem
                icon={Settings}
                label="Profile Settings"
                onClick={() => handleNavigate("/profile")}
              />
              {isAdmin && (
                <BottomSheetItem
                  icon={Shield}
                  label="Admin Dashboard"
                  onClick={() => handleNavigate("/admin")}
                />
              )}
              <BottomSheetSeparator />
              <BottomSheetItem
                icon={LogOut}
                label="Sign Out"
                destructive
                onClick={() => {
                  handleSignOut();
                  setSheetOpen(false);
                }}
              />
            </>
          ) : (
            <BottomSheetItem
              icon={User}
              label="Sign In"
              onClick={() => handleNavigate("/auth")}
            />
          )}
        </BottomSheetMenu>
      )}
    </header>
  );
}
