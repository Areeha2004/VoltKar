'use client'

import React, { useState } from 'react'
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Lock,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import Sidebar from '../../components/layout/Sidebar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const ChallengesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'badges' | 'leaderboard'>('challenges')

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
      icon: '\u2744\uFE0F',
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
      icon: '\uD83C\uDF19',
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
      icon: '\uD83D\uDD0D',
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
      icon: '\uD83C\uDFC6',
      rank: 15
    },
    {
      id: 5,
      title: 'Smart Scheduler',
      description: 'Used timer functions for 30 days straight',
      completedDate: '2024-04-15',
      reward: 400,
      icon: '\u23F0',
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
      icon: '\uD83C\uDF27\uFE0F',
      difficulty: 'Medium',
      requirements: ['Complete 2 previous challenges', 'Have humidity sensors']
    },
    {
      id: 7,
      title: 'Zero Waste Weekend',
      description: 'Minimize energy waste during weekends',
      startDate: '2024-06-15',
      reward: 350,
      icon: '\u267B\uFE0F',
      difficulty: 'Hard',
      requirements: ['Smart meter integration', 'Premium subscription']
    }
  ]

  const badges = [
    { name: 'Energy Saver', icon: '\uD83D\uDC9A', unlocked: true, description: 'Save 1000 kWh total' },
    { name: 'Peak Shifter', icon: '\uD83C\uDF05', unlocked: true, description: 'Complete 5 off-peak challenges' },
    { name: 'Smart Home Pro', icon: '\uD83C\uDFE0', unlocked: true, description: 'Connect 10+ smart devices' },
    { name: 'Community Leader', icon: '\uD83D\uDC51', unlocked: false, description: 'Rank in top 10 for 3 months' },
    { name: 'Efficiency Expert', icon: '\u26A1', unlocked: false, description: 'Achieve 95% efficiency score' },
    { name: 'Cost Crusher', icon: '\uD83D\uDCB8', unlocked: false, description: 'Save Rs 10,000 in total' },
    { name: 'Green Warrior', icon: '\uD83C\uDF3F', unlocked: false, description: 'Reduce carbon footprint by 50%' },
    { name: 'Innovation Pioneer', icon: '\uD83D\uDE80', unlocked: false, description: 'Test 5 beta features' }
  ]

  const leaderboard = [
    { rank: 1, name: 'Ahmad Hassan', savings: 2340, badge: '\uD83D\uDC51' },
    { rank: 2, name: 'Fatima Sheikh', savings: 2180, badge: '\uD83E\uDD48' },
    { rank: 3, name: 'Ali Ahmed', savings: 2050, badge: '\uD83E\uDD49' },
    { rank: 4, name: 'Sara Khan', savings: 1890, badge: '\uD83C\uDFC5' },
    { rank: 5, name: 'Omar Ali', savings: 1720, badge: '\uD83C\uDFC5' },
    { rank: 15, name: 'You', savings: 1240, badge: '\u2B50', isUser: true }
  ]

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'Easy') return 'text-primary bg-primary/20'
    if (difficulty === 'Medium') return 'text-accent-amber bg-accent-amber/20'
    if (difficulty === 'Hard') return 'text-red-500 bg-red-500/20'
    return 'text-foreground-secondary bg-background-secondary'
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Challenge Center</h1>
                <p className="text-foreground-secondary">Gamify your energy savings and compete with others</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 rounded-xl bg-accent-amber/20 px-4 py-2">
                  <Trophy className="h-5 w-5 text-accent-amber" />
                  <span className="font-semibold text-foreground">1,240 Points</span>
                </div>
                <div className="flex items-center space-x-2 rounded-xl bg-primary/20 px-4 py-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Level 8</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-1 rounded-xl bg-background-secondary p-1">
              {[
                { id: 'challenges', label: 'Active Challenges', icon: Target },
                { id: 'badges', label: 'Badges', icon: Award },
                { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'challenges' | 'badges' | 'leaderboard')}
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === 'challenges' && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-4">
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="rounded-2xl bg-primary/20 p-3">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground-secondary">Active</p>
                        <p className="text-2xl font-bold text-foreground">{activeChallenges.length}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="rounded-2xl bg-accent-amber/20 p-3">
                        <Trophy className="h-6 w-6 text-accent-amber" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground-secondary">Completed</p>
                        <p className="text-2xl font-bold text-foreground">{completedChallenges.length}</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="rounded-2xl bg-accent-blue/20 p-3">
                        <Star className="h-6 w-6 text-accent-blue" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground-secondary">Total Points</p>
                        <p className="text-2xl font-bold text-foreground">1,240</p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center space-x-3">
                      <div className="rounded-2xl bg-accent-purple/20 p-3">
                        <TrendingUp className="h-6 w-6 text-accent-purple" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground-secondary">This Month</p>
                        <p className="text-2xl font-bold text-foreground">Rs 2,340</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Active Challenges</h2>
                  <div className="grid gap-6 lg:grid-cols-2">
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
                            <span className={`rounded px-2 py-1 text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                              {challenge.difficulty}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground-secondary">Progress</span>
                              <span className="font-medium text-foreground">
                                {challenge.current} / {challenge.target}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-background-secondary">
                              <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${challenge.progress}%` }} />
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

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">Upcoming Challenges</h2>
                  <div className="grid gap-6 lg:grid-cols-2">
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

            {activeTab === 'badges' && (
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-foreground">Badge Collection</h2>
                  <p className="text-foreground-secondary">Unlock achievements by completing challenges and reaching milestones</p>
                </div>
                <div className="grid gap-6 md:grid-cols-4">
                  {badges.map((badge, index) => (
                    <Card key={index} hover className={`text-center ${!badge.unlocked ? 'opacity-50' : ''}`}>
                      <div className="space-y-3">
                        <div className="text-4xl">{badge.unlocked ? badge.icon : '\uD83D\uDD12'}</div>
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

            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-foreground">Monthly Leaderboard</h2>
                  <p className="text-foreground-secondary">Top savers this month and reward standings</p>
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
                        <div
                          key={index}
                          className={`flex items-center justify-between rounded-xl p-4 transition-all ${
                            entry.isUser ? 'border border-primary/20 bg-primary/10' : 'bg-background-secondary'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{entry.badge}</span>
                              <span className="text-lg font-bold text-foreground">#{entry.rank}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{entry.name}</p>
                              <p className="text-sm text-foreground-secondary">Rs {entry.savings.toLocaleString()} saved</p>
                            </div>
                          </div>
                          {entry.rank <= 3 && (
                            <p className="text-sm font-medium text-accent-amber">
                              {entry.rank === 1 ? '1000' : entry.rank === 2 ? '500' : '250'} bonus points
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="space-y-2 text-center">
                        <p className="text-sm text-foreground-secondary">
                          You&apos;re currently ranked #{leaderboard.find(e => e.isUser)?.rank} out of 2,847 participants
                        </p>
                        <Button variant="outline">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          View Full Rankings
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Monthly Rewards</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-accent-amber/20 bg-accent-amber/10 p-4 text-center">
                        <div className="mb-2 text-3xl">{'\uD83E\uDD47'}</div>
                        <h4 className="font-semibold text-foreground">1st Place</h4>
                        <p className="text-sm text-foreground-secondary">Rs 5,000 + Premium for 3 months</p>
                      </div>
                      <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/10 p-4 text-center">
                        <div className="mb-2 text-3xl">{'\uD83E\uDD48'}</div>
                        <h4 className="font-semibold text-foreground">2nd Place</h4>
                        <p className="text-sm text-foreground-secondary">Rs 3,000 + Premium for 2 months</p>
                      </div>
                      <div className="rounded-xl border border-accent-purple/20 bg-accent-purple/10 p-4 text-center">
                        <div className="mb-2 text-3xl">{'\uD83E\uDD49'}</div>
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
