"use client";
import React from 'react'
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { 
 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Plus, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  Lightbulb

} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const Dashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const name = session?.user?.name
    ?? session?.user?.email?.split("@")[0]
    ?? "User";

  const image = session?.user?.image;

  // Fallback initials
  const initials = name
    .split(" ")
    .map(p => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const metrics = [
    {
      title: 'Current Usage',
      value: '850',
      unit: 'kWh',
      change: '+12%',
      changeType: 'increase',
      icon: Zap,
      gradient: 'from-accent-blue to-accent-purple'
    },
    {
      title: 'Forecast Bill',
      value: '18,500',
      unit: 'PKR',
      change: '-8%',
      changeType: 'decrease',
      icon: DollarSign,
      gradient: 'from-primary to-accent-cyan'
    },
    {
      title: 'Cost to Date',
      value: '12,400',
      unit: 'PKR',
      change: '+5%',
      changeType: 'increase',
      icon: TrendingUp,
      gradient: 'from-accent-amber to-accent-pink'
    },
    {
      title: 'Efficiency Score',
      value: '78',
      unit: '%',
      change: '+15%',
      changeType: 'decrease',
      icon: Target,
      gradient: 'from-accent-emerald to-primary'
    }
  ]

  const alerts = [
    {
      type: 'warning',
      title: 'High Usage Alert',
      message: 'Your AC usage is 25% higher than usual this week',
      time: '2 hours ago',
      priority: 'high'
    },
    {
      type: 'success',
      title: 'Optimization Success',
      message: 'You saved Rs 340 by following our recommendations',
      time: '1 day ago',
      priority: 'medium'
    },
    {
      type: 'info',
      title: 'Bill Reminder',
      message: 'Estimated bill generation in 5 days',
      time: '2 days ago',
      priority: 'low'
    }
  ]

  const recentReadings = [
    { date: '2024-01-15', meter: 'Main House', reading: 15420, usage: 180, cost: 3200 },
    { date: '2024-01-10', meter: 'Main House', reading: 15240, usage: 165, cost: 2950 },
    { date: '2024-01-05', meter: 'Guest House', reading: 8750, usage: 95, cost: 1700 },
  ]

  const quickActions = [
    { icon: Plus, label: 'Enter Reading', href: '/readings', color: 'from-primary to-accent-cyan' },
    { icon: TrendingUp, label: 'View Analytics', href: '/analytics', color: 'from-accent-blue to-accent-purple' },
    { icon: Settings, label: 'Manage Devices', href: '/devices', color: 'from-accent-amber to-accent-pink' },
    { icon: Target, label: 'Start Challenge', href: '/challenges', color: 'from-accent-emerald to-primary' }
  ]

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-accent-amber" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-primary" />
      case 'info':
        return <Info className="h-5 w-5 text-accent-blue" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getAlertBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-accent-amber'
      case 'medium': return 'border-l-4 border-l-primary'
      case 'low': return 'border-l-4 border-l-accent-blue'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-30" />
      
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground font-sora">
                  Good morning, <span className="gradient-text">{name}</span>
                </h1>
                <p className="text-xl text-foreground-secondary">Here's your electricity overview for today</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button  className="premium-button h-13">
                  <Plus className="h-4 w-5 mr-2" />
                  Enter Reading
                </Button>
                <Button variant="outline" size="md">
                  <Settings className="h-5 w-5 mr-2" />
                  Optimize
                </Button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <Card key={index} className="card-premium animate-fade-in"><div style={{ animationDelay: `${index * 0.1}s` }}>
                   <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${metric.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${metric.gradient} p-3 rounded-2xl`}>
                          <metric.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 text-sm font-medium ${
                        metric.changeType === 'decrease' ? 'text-primary' : 'text-accent-amber'
                      }`}>
                        {metric.changeType === 'decrease' ? 
                          <ArrowDown className="h-4 w-4" /> : 
                          <ArrowUp className="h-4 w-4" />
                        }
                        <span>{metric.change}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-foreground-secondary text-sm font-medium">{metric.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-foreground font-mono">{metric.value}</span>
                        <span className="text-foreground-tertiary text-sm">{metric.unit}</span>
                      </div>
                      <p className="text-xs text-foreground-muted">vs last month</p>
                    </div>
                  </div>
                  </div>
                 
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Alerts Panel */}
              <div className="lg:col-span-2">
                <Card className="card-premium">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-2 rounded-xl">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground font-sora">Smart Alerts</h2>
                      </div>
                      <Button variant="ghost" size="sm">View All</Button>
                    </div>
                    
                    <div className="space-y-4">
                      {alerts.map((alert, index) => (
                        <div key={index} className={`flex items-start space-x-4 p-6 rounded-2xl bg-background-card/50 backdrop-blur-sm ${getAlertBorder(alert.priority)} animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="flex-shrink-0 mt-1">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground text-lg">{alert.title}</h3>
                            <p className="text-foreground-secondary leading-relaxed">{alert.message}</p>
                            <p className="text-foreground-muted text-sm">{alert.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="card-premium">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-primary to-accent-cyan p-2 rounded-xl">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Quick Actions</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center space-x-4 p-4 rounded-2xl bg-background-card/30 hover:bg-background-card/60 border border-border/50 hover:border-border-light transition-all duration-300 group animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className={`bg-gradient-to-r ${action.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-medium text-foreground text-lg">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Readings */}
            <Card className="card-premium">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-2 rounded-xl">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground font-sora">Recent Readings</h2>
                  </div>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                
                <div className="overflow-hidden rounded-2xl border border-border/50">
                  <table className="w-full">
                    <thead className="bg-background-card/50">
                      <tr>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Date</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Meter</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Reading</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Usage</th>
                        <th className="text-left py-4 px-6 text-foreground-secondary font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReadings.map((reading, index) => (
                        <tr key={index} className="border-t border-border/30 hover:bg-background-card/30 transition-colors">
                          <td className="py-4 px-6 text-foreground font-mono">{reading.date}</td>
                          <td className="py-4 px-6 text-foreground">{reading.meter}</td>
                          <td className="py-4 px-6 text-foreground font-mono">{reading.reading.toLocaleString()}</td>
                          <td className="py-4 px-6 text-foreground font-mono">{reading.usage} kWh</td>
                          <td className="py-4 px-6 text-primary font-mono font-semibold">Rs {reading.cost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard