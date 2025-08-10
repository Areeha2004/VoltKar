"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    image: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    password: formData.password,
    image: formData.image
  })
});


      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.error || 'Registration failed.' });
        return;
      }

      const { user } = await res.json();

      login({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.image || ''
      });

      router.push('/onboarding');
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary to-accent-blue p-3 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Volt</span>
          </Link>
        </div>

        <Card>
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
              <p className="text-foreground-secondary">Start your journey to smarter electricity usage</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
  {/* Full Name */}
  <div className="relative">
    <Input
      type="text"
      label="Full Name"
      placeholder="Enter your full name"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      required
    />
    <User className="absolute right-3 top-9 h-5 w-5 text-foreground-tertiary pointer-events-none" />
  </div>

  {/* Email */}
  <div className="relative">
    <Input
      type="email"
      label="Email Address"
      placeholder="Enter your email"
      value={formData.email}
      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      required
    />
    <Mail className="absolute right-3 top-9 h-5 w-5 text-foreground-tertiary pointer-events-none" />
  </div>

  {/* Password */}
  <div className="relative">
    <Input
      type={showPassword ? 'text' : 'password'}
      label="Password"
      placeholder="Create a password"
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      required
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-9 text-foreground-tertiary hover:text-foreground"
    >
      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  </div>

  {/* Confirm Password */}
  <div className="relative">
    <Input
      type="password"
      label="Confirm Password"
      placeholder="Confirm your password"
      value={formData.confirmPassword}
      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
      required
    />
    <Lock className="absolute right-3 top-9 h-5 w-5 text-foreground-tertiary pointer-events-none" />
  </div>

  {/* Terms & Conditions */}
 <div className="flex items-start space-x-2">
  <input
    type="checkbox"
    className="mt-1 rounded border-border"
    checked={acceptTerms}
    onChange={(e) => setAcceptTerms(e.target.checked)}
    required
  />
  <span className="text-sm text-foreground-secondary">
    I agree to the{' '}
    <Link href="/terms" className="text-primary hover:text-primary-dark">Terms of Service</Link>
    {' '}and{' '}
    <Link href="/privacy" className="text-primary hover:text-primary-dark">Privacy Policy</Link>
  </span>
</div>

  {/* Submit Button */}
  <Button type="submit" className="w-full">
    Create Account
  </Button>
</form>


            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-foreground-secondary">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </Button>

            <div className="text-center text-sm text-foreground-secondary">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SignupPage


