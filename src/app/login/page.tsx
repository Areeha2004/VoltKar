"use client"
import React, { useState,useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Zap,ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const LoginPage: React.FC = () => {
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get("error");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reset, setReset] = useState(false);
const [msg,      setMsg]      = useState<string | null>(null);
  // clear stale OAuth session on mismatch
  useEffect(() => {
    if (error === "OAuthAccountNotLinked" || error === "SessionRequired") {
  router.replace("/login"); // skip signOut
}

  }, [error]);

  useEffect(() => {
    if (reset) router.replace("/login");
  }, [reset, router]);

  // ← NEW handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    setIsLoading(false);
    if (res?.error) {
      setErrors({ general: "Invalid credentials" });
    } else {
      
      router.push("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
  const res = await signIn("google", {
    callbackUrl: "/dashboard",
    redirect: true, // just to be explicit
  });
};


 return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(0,212,170,0.15),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-12 animate-fade-in">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent-cyan rounded-3xl blur-xl opacity-50" />
              <div className="relative bg-gradient-to-r from-primary to-accent-cyan p-4 rounded-3xl">
                <Zap className="h-10 w-10 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold text-foreground font-sora">Volt</span>
          </Link>
        </div>

        <Card className="card-premium animate-slide-up">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-foreground font-sora">Welcome Back</h1>
              <p className="text-foreground-secondary text-lg">Sign in to your account to continue your energy journey</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="absolute right-6 top-12 h-5 w-5 text-foreground-muted" />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-12 text-foreground-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 text-sm cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border bg-background-card text-primary focus:ring-primary/20" 
                  />
                  <span className="text-foreground-secondary">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-light transition-colors">
                  Forgot password?
                </Link>
              </div>

             <Button type="submit" className="w-full premium-button text-base py-3 flex items-center justify-center">
  <span>Sign In</span>
  <ArrowRight className="ml-2 h-5 w-5" />
</Button>

            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background-card text-foreground-secondary">Or continue with</span>
              </div>
            </div>
<Button
  variant="outline"
  size="md"
  onClick={handleGoogleSignIn}
  className="w-full"
>
  <svg
    className="h-5 w-5 text-foreground-secondary"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    {/* Google Icon Paths */}
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>

  <span className="text-foreground-secondary">
    Continue with Google
  </span>
</Button>




<div className="text-center mt-6">
    <button
      onClick={() => signOut({ callbackUrl: "/LoginPage" })}
      className="text-sm text-primary underline hover:text-white-800"
    >
      Log out / Reset
    </button>
  </div>
            <div className="text-center text-foreground-secondary">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary-light font-semibold transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
export default LoginPage;