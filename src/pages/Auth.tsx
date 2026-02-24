import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Lock, Mail, User, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { lovable } from "@/integrations/lovable/index";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/vault");
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please confirm your email before signing in");
      } else {
        toast.error(error.message);
      }
      return;
    }
    
    toast.success("Welcome back!");
    navigate("/vault");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const { error } = await signUp(email, password, name);
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    
    toast.success("Account created! Check your email to confirm, then sign in.");
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Google sign-in failed. Please try again.");
        console.error("Google OAuth error:", error);
      }
    } catch (err) {
      toast.error("Google sign-in failed. Please try again.");
      console.error("Google OAuth error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const accountBenefits = [
    "Save your nutrition data across devices",
    "Track your meals and progress over time",
    "Access your audit results anywhere",
    "100% free - no payment required"
  ];

  const GoogleButton = () => (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleGoogleSignIn}
      disabled={googleLoading || isLoading}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {googleLoading ? "Signing in..." : "Continue with Google"}
    </Button>
  );

  const Divider = () => (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(192 91% 54% / 0.05) 0%, transparent 50%)'
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Performance Architect</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your free account</p>
        </div>

        <Card variant="elevated">
          <Tabs defaultValue="signup">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="signup">Create Account</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Create Your Account</CardTitle>
                <CardDescription>Join free and save your progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-2">
                  {accountBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                <GoogleButton />
                <Divider />

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-name" type="text" placeholder="Andy Andrews" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="andy@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }} className={`pl-10 ${errors.email ? 'border-destructive' : ''}`} required />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }} className={`pl-10 ${errors.password ? 'border-destructive' : ''}`} minLength={8} required />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <Button variant="hero" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our Terms and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signin">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Welcome back</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleButton />
                <Divider />

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signin-email" type="email" placeholder="andy@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }} className={`pl-10 ${errors.email ? 'border-destructive' : ''}`} required />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }} className={`pl-10 ${errors.password ? 'border-destructive' : ''}`} required />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  <Button variant="hero" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
