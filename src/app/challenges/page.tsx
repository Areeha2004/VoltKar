'use client'
import React, { useState } from 'react'
import { 
  Trophy, 
  Target, 
  Zap, 
  Star, 
  Clock, 
  Users,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle,
  Lock
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const ChallengesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('challenges')

  const activeChallenges = [
    {
      id: 1,
      title: 'Summer Saver Challenge',
      description: 'Reduce AC usage by 20% this month',
      progress: 75,
      target: '20%',
      current: '15%',
      reward: 500,
      daysLeft: 12,
      icon: '❄️',
      difficulty: 'Medium',
      participants: 1200
    },
    {
      id: 2,
      title: 'Off-Peak Hero',
      description: 'Use 70% of daily consumption during off-peak hours',
      progress: 45,
      target: '70%',
      current: '45%',
      reward: 300,
      daysLeft: 5,
      icon: '🌙',
      difficulty: 'Hard',
      participants: 800
    },
    {
      id: 3,
      title: 'Device Detective',
      description: 'Identify and reduce phantom loads by 10%',
      progress: 90,
      target: '10%',
      current: '9%',
      reward: 200,
      daysLeft: 3,
      icon: '🔍',
      difficulty: 'Easy',
      participants: 2000
    }
  ]

  const completedChallenges = [
    {
      id: 4,
      title: 'April Energy Champion',
      description: 'Reduced monthly consumption by 25%',
      completedDate: '2024-04-30',
      reward: 750,
      icon: '🏆',
      rank: 15
    },
    {
      id: 5,
      title: 'Smart Scheduler',
      description: 'Used timer functions for 30 days straight',
      completedDate: '2024-04-15',
      reward: 400,
      icon: '⏰',
      rank: 8
    }
  ]

  const upcomingChallenges = [
    {
      id: 6,
      title: 'Monsoon Efficiency',
      description: 'Optimize humidity control devices',
      startDate: '2024-07-01',
      reward: 600,
      icon: '🌧️',
      difficulty: 'Medium',
      requirements: ['Complete 2 previous challenges', 'Have humidity sensors']
    },
    {
      id: 7,
      title: 'Zero Waste Weekend',
      description: 'Minimize energy waste during weekends',
      startDate: '2024-06-15',
      reward: 350,
      icon: '♻️',
      difficulty: 'Hard',
      requirements: ['Smart meter integration', 'Premium subscription']
    }
  ]

  const badges = [
    { name: 'Energy Saver', icon: '💚', unlocked: true, description: 'Save 1000 kWh total' },
    { name: 'Peak Shifter', icon: '🌅', unlocked: true, description: 'Complete 5 off-peak challenges' },
    { name: 'Smart Home Pro', icon: '🏠', unlocked: true, description: 'Connect 10+ smart devices' },
    { name: 'Community Leader', icon: '👑', unlocked: false, description: 'Rank in top 10 for 3 months' },
    { name: 'Efficiency Expert', icon: '⚡', unlocked: false, description: 'Achieve 95% efficiency score' },
    { name: 'Cost Crusher', icon: '💸', unlocked: false, description: 'Save Rs 10,000 in total' },
    { name: 'Green Warrior', icon: '🌿', unlocked: false, description: 'Reduce carbon footprint by 50%' },
    { name: 'Innovation Pioneer', icon: '🚀', unlocked: false, description: 'Test 5 beta features' }
  ]

  const leaderboard = [
    { rank: 1, name: 'Ahmad Hassan', savings: 2340, badge: '👑' },
    { rank: 2, name: 'Fatima Sheikh', savings: 2180, badge: '🥈' },
    { rank: 3, name: 'Ali Ahmed', savings: 2050, badge: '🥉' },
    { rank: 4, name: 'Sara Khan', savings: 1890, badge: '🏅' },
    { rank: 5, name: 'Omar Ali', savings: 1720, badge: '🏅' },
    { rank: 15, name: 'You', savings: 1240, badge: '⭐', isUser: true }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-primary bg-primary/20'
      case 'Medium': return 'text-accent-amber bg-accent-amber/20'
      case 'Hard': return 'text-red-500 bg-red-500/20'
      default: return 'text-foreground-secondary bg-background-secondary'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Challenge Center</h1>
                <p className="text-foreground-secondary">Gamify your energy savings and compete with others</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-accent-amber/20">
                  <Trophy className="h-5 w-5 text-accent-amber" />
                  <span className="font-semibold text-foreground">1,240 Points</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary/20">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Level 8</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-background-secondary p-1 rounded-xl">
              {[
                { id: 'challenges', label: 'Active Challenges', icon: Target },
                { id: 'badges', label: 'Badges', icon: Award },
                { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Active Challenges Tab */}
            {activeTab === 'challenges' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-6">
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/20 p-3 rounded-2xl">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground-secondary text-sm">Active</p>
                        <p className="text-2xl font-bold text-foreground">{activeChallenges.length}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="bg-accent-amber/20 p-3 rounded-2xl">
                        <Trophy className="h-6 w-6 text-accent-amber" />
                      </div>
                      <div>
                        <p className="text-foreground-secondary text-sm">Completed</p>
                        <p className="text-2xl font-bold text-foreground">{completedChallenges.length}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="bg-accent-blue/20 p-3 rounded-2xl">
                        <Star className="h-6 w-6 text-accent-blue" />
                      </div>
                      <div>
                        <p className="text-foreground-secondary text-sm">Total Points</p>
                        <p className="text-2xl font-bold text-foreground">1,240</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="bg-accent-purple/20 p-3 rounded-2xl">
                        <TrendingUp className="h-6 w-6 text-accent-purple" />
                      </div>
                      <div>
                        <p className="text-foreground-secondary text-sm">This Month</p>
                        <p className="text-2xl font-bold text-foreground">Rs 2,340</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Active Challenges */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Active Challenges</h2>
                  <div className="grid lg:grid-cols-2 gap-6">
                    {activeChallenges.map(challenge => (
                      <Card key={challenge.id} hover>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-3xl">{challenge.icon}</span>
                              <div>
                                <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                                <p className="text-sm text-foreground-secondary">{challenge.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                {challenge.difficulty}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground-secondary">Progress</span>
                              <span className="text-foreground font-medium">{challenge.current} / {challenge.target}</span>
                            </div>
                            <div className="w-full bg-background-secondary rounded-full h-2">
                              <div 
                                className="bg-primary rounded-full h-2 transition-all duration-300"
                                style={{ width: `${challenge.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-foreground-secondary">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{challenge.daysLeft} days left</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{challenge.participants.toLocaleString()} participants</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 text-accent-amber">
                              <Star className="h-4 w-4" />
                              <span className="font-semibold">{challenge.reward} pts</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Upcoming Challenges */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Upcoming Challenges</h2>
                  <div className="grid lg:grid-cols-2 gap-6">
                    {upcomingChallenges.map(challenge => (
                      <Card key={challenge.id}>
                        <div className="space-y-4 opacity-75">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-3xl grayscale">{challenge.icon}</span>
                              <div>
                                <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                                <p className="text-sm text-foreground-secondary">{challenge.description}</p>
                              </div>
                            </div>
                            <Lock className="h-5 w-5 text-foreground-tertiary" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="h-4 w-4 text-foreground-secondary" />
                              <span className="text-foreground-secondary">Starts {challenge.startDate}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-accent-amber">
                              <Star className="h-4 w-4" />
                              <span className="font-semibold">{challenge.reward} pts</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground-secondary">Requirements:</p>
                            <ul className="space-y-1">
                              {challenge.requirements.map((req, index) => (
                                <li key={index} className="flex items-center space-x-2 text-sm text-foreground-secondary">
                                  <CheckCircle className="h-3 w-3 text-primary" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Badges Tab */}
            {activeTab === 'badges' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Badge Collection</h2>
                  <p className="text-foreground-secondary">Unlock achievements by completing challenges and reaching milestones</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  {badges.map((badge, index) => (
                    <Card key={index} hover className={`text-center ${!badge.unlocked && 'opacity-50'}`}>
                      <div className="space-y-3">
                        <div className="text-4xl">{badge.unlocked ? badge.icon : '🔒'}</div>
                        <h3 className="font-semibold text-foreground">{badge.name}</h3>
                        <p className="text-sm text-foreground-secondary">{badge.description}</p>
                        {badge.unlocked && (
                          <div className="flex items-center justify-center space-x-1 text-primary">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Unlocked</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Monthly Leaderboard</h2>
                  <p className="text-foreground-secondary">Top savers this month - compete for rewards and recognition</p>
                </div>

                <Card>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Top Savers - June 2024</h3>
                      <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                        <TrendingUp className="h-4 w-4" />
                        <span>Updates daily</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {leaderboard.map((entry, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                          entry.isUser ? 'bg-primary/10 border border-primary/20' : 'bg-background-secondary'
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{entry.badge}</span>
                              <span className="font-bold text-foreground text-lg">#{entry.rank}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{entry.name}</p>
                              <p className="text-sm text-foreground-secondary">Rs {entry.savings.toLocaleString()} saved</p>
                            </div>
                          </div>
                          {entry.rank <= 3 && (
                            <div className="text-right">
                              <p className="text-sm text-accent-amber font-medium">
                                {entry.rank === 1 ? '1000' : entry.rank === 2 ? '500' : '250'} bonus points
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-foreground-secondary">
                          You're currently ranked #{leaderboard.find(e => e.isUser)?.rank} out of 2,847 participants
                        </p>
                        <Button variant="outline">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Full Rankings
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Monthly Rewards */}
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Monthly Rewards</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20 text-center">
                        <div className="text-3xl mb-2">🥇</div>
                        <h4 className="font-semibold text-foreground">1st Place</h4>
                        <p className="text-sm text-foreground-secondary">Rs 5,000 + Premium for 3 months</p>
                      </div>
                      <div className="p-4 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-center">
                        <div className="text-3xl mb-2">🥈</div>
                        <h4 className="font-semibold text-foreground">2nd Place</h4>
                        <p className="text-sm text-foreground-secondary">Rs 3,000 + Premium for 2 months</p>
                      </div>
                      <div className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-center">
                        <div className="text-3xl mb-2">🥉</div>
                        <h4 className="font-semibold text-foreground">3rd Place</h4>
                        <p className="text-sm text-foreground-secondary">Rs 2,000 + Premium for 1 month</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ChallengesPage