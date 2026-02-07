import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Clock, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { 
    isAuthenticated, 
    user, 
    signOut, 
    isTrialActive, 
    trialDaysRemaining, 
    hasActiveSubscription,
    initialize,
    isInitialized
  } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/audit", label: "Audit" },
    { href: "/nutrition", label: "Nutrition" },
    { href: "/vault", label: "The Vault" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const getTrialBadge = () => {
    if (hasActiveSubscription) {
      return (
        <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
          Pro
        </Badge>
      );
    }
    
    if (isTrialActive && trialDaysRemaining > 0) {
      return (
        <Badge variant="outline" className="gap-1 text-warning border-warning/30">
          <Clock className="w-3 h-3" />
          {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left
        </Badge>
      );
    }
    
    return null;
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
        </div>

        {/* Auth section */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {getTrialBadge()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="max-w-[120px] truncate">{user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/vault" className="cursor-pointer">
                      The Vault
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button variant="default" size="sm">Start Free Trial</Button>
              </Link>
            </>
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
            
            {isAuthenticated ? (
              <>
                <div className="pt-3 mt-2 border-t border-border">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {user?.email}
                    </span>
                    {getTrialBadge()}
                  </div>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full mt-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-3 mt-2 border-t border-border flex gap-2">
                <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="lg" className="w-full">Sign In</Button>
                </Link>
                <Link to="/auth" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button variant="default" size="lg" className="w-full">Start Trial</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
