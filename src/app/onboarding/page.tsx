'use client'
import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Check, Zap, MapPin, Home, Plus, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'

const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
 type Meter = {
  name: string;
  type: 'single-phase' | 'three-phase';
  reading: string;
};

type Appliance = {
  name: string;
  icon: string;
  power: string;
};

const [formData, setFormData] = useState<{
  name: string;
  region: string;
  meters: Meter[];
  appliances: Appliance[];
}>({
  name: '',
  region: '',
  meters: [{ name: '', type: 'single-phase', reading: '' }],
  appliances: []
});


  const steps = [
    { title: 'Welcome', description: 'Personal Information' },
    { title: 'Region', description: 'DISCO Selection' },
    { title: 'Meters', description: 'Meter Setup' },
    { title: 'Appliances', description: 'Device Configuration' }
  ]

  const discoRegions = [
    'KESC (Karachi)',
    'LESCO (Lahore)',
    'GEPCO (Gujranwala)',
    'FESCO (Faisalabad)',
    'IESCO (Islamabad)',
    'PESCO (Peshawar)',
    'TESCO (Tribal Areas)',
    'SEPCO (Sukkur)',
    'HESCO (Hyderabad)',
    'QESCO (Quetta)'
  ]

  const commonAppliances = [
    { name: 'Air Conditioner', icon: '❄️', power: '1500W' },
    { name: 'Refrigerator', icon: '🧊', power: '150W' },
    { name: 'LED Lights', icon: '💡', power: '10W' },
    { name: 'Washing Machine', icon: '🧺', power: '500W' },
    { name: 'Water Heater', icon: '🚿', power: '2000W' },
    { name: 'Microwave', icon: '📱', power: '800W' }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addMeter = () => {
    setFormData({
      ...formData,
      meters: [...formData.meters, { name: '', type: 'single-phase', reading: '' }]
    })
  }

  const removeMeter = (index: number) => {
    const newMeters = formData.meters.filter((_, i) => i !== index)
    setFormData({ ...formData, meters: newMeters })
  }

  const updateMeter = (index: number, field: string, value: string) => {
    const newMeters = [...formData.meters]
    newMeters[index] = { ...newMeters[index], [field]: value }
    setFormData({ ...formData, meters: newMeters })
  }

  const toggleAppliance = (appliance: any) => {
    const exists = formData.appliances.find((a: any) => a.name === appliance.name)
    if (exists) {
      setFormData({
        ...formData,
        appliances: formData.appliances.filter((a: any) => a.name !== appliance.name)
      })
    } else {
      setFormData({
        ...formData,
        appliances: [...formData.appliances, appliance]
      })
    }
  }

   const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-primary to-accent-blue p-4 rounded-2xl w-fit mx-auto">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Welcome to Volt</h2>
              <p className="text-foreground-secondary">Let's set up your account to start tracking your electricity usage</p>
            </div>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        )
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-4 rounded-2xl w-fit mx-auto">
                <MapPin className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Select Your Region</h2>
              <p className="text-foreground-secondary">Choose your DISCO region for accurate billing calculations</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {discoRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => setFormData({ ...formData, region })}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    formData.region === region
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-border-light text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-accent-amber to-accent-pink p-4 rounded-2xl w-fit mx-auto">
                <Home className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Setup Your Meters</h2>
              <p className="text-foreground-secondary">Add your electricity meters to start tracking</p>
            </div>
            
            <div className="space-y-4">
              {formData.meters.map((meter, index) => (
                <Card key={index}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Meter {index + 1}</h3>
                      {formData.meters.length > 1 && (
                        <button
                          onClick={() => removeMeter(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        label="Meter Name"
                        placeholder="e.g., Main House"
                        value={meter.name}
                        onChange={(e) => updateMeter(index, 'name', e.target.value)}
                      />
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground-secondary">Type</label>
                        <select
                          value={meter.type}
                          onChange={(e) => updateMeter(index, 'type', e.target.value)}
                          className="input-field w-full"
                        >
                          <option value="single-phase">Single Phase</option>
                          <option value="three-phase">Three Phase</option>
                        </select>
                      </div>
                      <Input
                        label="Current Reading"
                        placeholder="0000"
                        type="number"
                        value={meter.reading}
                        onChange={(e) => updateMeter(index, 'reading', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button variant="outline" onClick={addMeter} className="w-full">
                <Plus className="h-5 w-5 mr-2" />
                Add Another Meter
              </Button>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-primary to-accent-blue p-4 rounded-2xl w-fit mx-auto">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Add Your Appliances</h2>
              <p className="text-foreground-secondary">Select the appliances you want to track (optional)</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {commonAppliances.map((appliance) => {
                const isSelected = formData.appliances.find((a: any) => a.name === appliance.name)
                return (
                  <button
                    key={appliance.name}
                    onClick={() => toggleAppliance(appliance)}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-border-light text-foreground-secondary hover:text-foreground'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-2xl">{appliance.icon}</div>
                      <div>
                        <p className="font-medium">{appliance.name}</p>
                        <p className="text-sm opacity-75">{appliance.power}</p>
                      </div>
                      {isSelected && (
                        <div className="bg-primary rounded-full w-6 h-6 flex items-center justify-center mx-auto">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${index <= currentStep 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-border text-foreground-tertiary'
                  }
                `}>
                  {index < currentStep ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-24 h-0.5 mx-4 transition-all duration-300
                    ${index < currentStep ? 'bg-primary' : 'bg-border'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">{steps[currentStep].title}</h1>
            <p className="text-foreground-secondary">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          {renderStepContent()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button onClick={() => window.location.href = '/dashboard'}>
              Complete Setup
              <Check className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingWizard