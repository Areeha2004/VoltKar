'use client'
import React from 'react'
import Link from 'next/link'
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Target, 
  ArrowRight,
  Star,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  BarChart3,
  Brain,
  Lightbulb
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Advanced machine learning algorithms analyze your usage patterns and provide intelligent recommendations.',
      gradient: 'from-primary to-accent-cyan'
    },
    {
      icon: BarChart3,
      title: 'Predictive Analytics',
      description: 'Accurate bill forecasting and usage predictions help you plan and optimize your electricity consumption.',
      gradient: 'from-accent-blue to-accent-purple'
    },
    {
      icon: Lightbulb,
      title: 'Smart Optimization',
      description: 'Intelligent device management and scheduling recommendations to maximize efficiency and savings.',
      gradient: 'from-accent-amber to-accent-pink'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption ensures your data remains private and protected.',
      gradient: 'from-accent-emerald to-primary'
    }
  ]

  const testimonials = [
    {
      name: 'Ahmad Hassan',
      role: 'Tech Executive, Karachi',
      content: 'Volt transformed how I manage electricity costs. The AI insights are incredibly accurate and saved me 35% on bills.',
      rating: 5,
      avatar: '👨‍💼'
    },
    {
      name: 'Fatima Sheikh',
      role: 'Business Owner, Lahore',
      content: 'The dual-meter optimization is brilliant. Managing multiple properties has never been this efficient and cost-effective.',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'Ali Ahmed',
      role: 'Software Engineer, Islamabad',
      content: 'As a tech professional, I appreciate the sophisticated analytics and clean interface. Truly premium experience.',
      rating: 5,
      avatar: '👨‍💻'
    }
  ]

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '₨2.5M+', label: 'Total Savings' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9★', label: 'User Rating' }
  ]

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,170,0.1),transparent_70%)] pointer-events-none" />
      
      {/* Navigation */}
      <nav className="relative z-50 glass-card border-b border-border/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent-cyan rounded-2xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                  <Zap className="h-7 w-7 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-foreground font-sora">Volt</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="nav-link">Features</a>
              <a href="#testimonials" className="nav-link">Reviews</a>
              <a href="#pricing" className="nav-link">Pricing</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="md">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="md" className="premium-button">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-12 animate-fade-in">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI-Powered Electricity Management</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold text-foreground leading-tight font-sora">
                Smart Energy
                <br />
                <span className="gradient-text">Intelligence</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-foreground-secondary max-w-4xl mx-auto leading-relaxed">
                Transform your electricity management with AI-powered insights, predictive analytics, 
                and intelligent optimization designed for Pakistani households and businesses.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/signup">
                <Button size="lg" className="premium-button text-lg px-12 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-12 py-6 border-border-light hover:border-primary">
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-12 text-foreground-tertiary">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>30-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-4xl md:text-5xl font-bold gradient-text font-sora">{stat.value}</div>
                <div className="text-foreground-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground font-sora">
              Powerful <span className="gradient-text">Features</span>
            </h2>
            <p className="text-xl text-foreground-secondary max-w-3xl mx-auto">
              Advanced technology meets elegant design to deliver the ultimate electricity management experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group card-premium animate-fade-in">
               <div
                className="inner-animation-wrapper"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
   <div className="space-y-6">
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
                    <div className={`relative bg-gradient-to-r ${feature.gradient} p-4 rounded-2xl w-fit`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-foreground font-sora">{feature.title}</h3>
                    <p className="text-foreground-secondary leading-relaxed text-lg">{feature.description}</p>
                  </div>
                </div>
  </div>
                
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground font-sora">
              Trusted by <span className="gradient-text">Thousands</span>
            </h2>
            <p className="text-xl text-foreground-secondary max-w-3xl mx-auto">
              Join the growing community of satisfied customers who have transformed their energy management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-premium animate-fade-in" >
                <div
    className="inner-animation-wrapper"
    style={{ animationDelay: `${index * 0.2}s` }}
  ><div className="space-y-6">
                  <div className="flex items-center space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-accent-amber fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground-secondary italic text-lg leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">{testimonial.name}</p>
                      <p className="text-foreground-tertiary">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
    {/* your card contents */}
  </div>
                
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="card-premium text-center gradient-border">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground font-sora">
                  Ready to <span className="gradient-text">Transform</span> Your Energy?
                </h2>
                <p className="text-xl text-foreground-secondary">
                  Join thousands of users who are already saving money and optimizing their electricity usage
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-1"
                />
                <Button className="premium-button">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-foreground-muted">
                Start your 30-day free trial. No credit card required.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 bg-background-secondary/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent-cyan rounded-2xl blur-lg opacity-50" />
                  <div className="relative bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground font-sora">Volt</span>
              </div>
              <p className="text-foreground-secondary leading-relaxed">
                AI-powered electricity management platform designed for the modern Pakistani household and business.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-foreground text-lg">Product</h3>
              <ul className="space-y-3 text-foreground-secondary">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Demo</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-foreground text-lg">Support</h3>
              <ul className="space-y-3 text-foreground-secondary">
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-foreground text-lg">Contact</h3>
              <ul className="space-y-3 text-foreground-secondary">
                <li className="flex items-center space-x-3">
                  <Mail className="h-4 w-4" />
                  <span>hello@volt.pk</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="h-4 w-4" />
                  <span>+92 300 1234567</span>
                </li>
                <li className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4" />
                  <span>Karachi, Pakistan</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 mt-16 pt-8 text-center text-foreground-tertiary">
            <p>&copy; 2024 Volt. All rights reserved. Made with ⚡ in Pakistan.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage