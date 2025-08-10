'use client'
import React, { useState } from 'react'
import { Home, Plus, Zap, TrendingUp, Activity } from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import MeterCard from '../../components/meters/MeterCard'
import CreateMeterModal from '../../components/meters/CreateMeterModal'
import { useMeters } from '../../hooks/useMeters'

const MetersPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { meters, loading, error, createMeter, updateMeter, deleteMeter } = useMeters()

  const handleCreateMeter = async (data: { label: string; type: string }) => {
    await createMeter(data)
  }

  const handleUpdateMeter = async (id: string, data: { label: string; type: string }) => {
    await updateMeter(id, data)
  }

  const handleDeleteMeter = async (id: string) => {
    await deleteMeter(id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-background-card rounded w-1/3"></div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-background-card rounded-2xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none opacity-20" />
      
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-accent-cyan p-3 rounded-2xl">
                    <Home className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground font-sora">Meter Management</h1>
                    <p className="text-xl text-foreground-secondary">Manage your electricity meters and connections</p>
                  </div>
                </div>
              </div>
              <Button 
                className="premium-button"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Meter
              </Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Meters',
                  value: meters.length.toString(),
                  icon: Home,
                  gradient: 'from-primary to-accent-cyan',
                  description: 'Connected meters'
                },
                {
                  title: 'Active Meters',
                  value: meters.filter(m => m.status === 'active').length.toString(),
                  icon: Zap,
                  gradient: 'from-accent-blue to-accent-purple',
                  description: 'Currently monitoring'
                },
                {
                  title: 'Total Readings',
                  value: '0', // Will be calculated from readings
                  icon: TrendingUp,
                  gradient: 'from-accent-amber to-accent-pink',
                  description: 'Recorded this month'
                },
                {
                  title: 'Avg. Usage',
                  value: '0',
                  unit: 'kWh',
                  icon: Activity,
                  gradient: 'from-accent-emerald to-primary',
                  description: 'Per meter/month'
                }
              ].map((stat, index) => (
                <Card key={index} className="card-premium animate-fade-in" ><div style={{ animationDelay: `${index * 0.1}s` }}>
 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-20`} />
                        <div className={`relative bg-gradient-to-r ${stat.gradient} p-3 rounded-2xl`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-foreground-secondary text-sm font-medium">{stat.title}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-foreground font-mono">{stat.value}</span>
                        {stat.unit && <span className="text-foreground-tertiary text-sm">{stat.unit}</span>}
                      </div>
                      <p className="text-xs text-foreground-muted">{stat.description}</p>
                    </div>
                  </div>
                    </div>
                 
                </Card>
              ))}
            </div>

            {/* Error State */}
            {error && (
              <Card className="border-red-500/20 bg-red-500/5">
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </Card>
            )}

            {/* Meters Grid */}
            {meters.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-foreground font-sora">Your Meters</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meters.map((meter, index) => (
                    <div key={meter.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <MeterCard
                        meter={meter}
                        onUpdate={handleUpdateMeter}
                        onDelete={handleDeleteMeter}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="text-center py-16">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/20 to-accent-cyan/20 p-6 rounded-3xl w-fit mx-auto">
                    <Home className="h-16 w-16 text-primary mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-foreground">No Meters Added</h3>
                    <p className="text-foreground-secondary max-w-md mx-auto">
                      Get started by adding your first electricity meter to begin tracking your usage and costs.
                    </p>
                  </div>
                  <Button 
                    className="premium-button"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Meter
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Create Meter Modal */}
      <CreateMeterModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMeter}
      />
    </div>
  )
}

export default MetersPage