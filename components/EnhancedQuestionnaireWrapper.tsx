'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import NavBarTop from '@/components/NavBarTop'
import NavbarStepperBottom from '@/components/NavbarStepperBottom'
import ProgressTracker from '@/components/ProgressTracker'
import { usePropertyListingStore } from '@/stores/propertyListingStore'
import useAuthStore from '@/stores/authStore'

interface EnhancedQuestionnaireWrapperProps {
  children: React.ReactNode
  showProgressTracker?: boolean
}

function EnhancedQuestionnaireWrapper({ 
  children, 
  showProgressTracker = false 
}: EnhancedQuestionnaireWrapperProps) {
  const router = useRouter()
  const {
    currentStep,
    steps,
    nextStep,
    previousStep,
    validateCurrentStep,
    submitForm,
  } = usePropertyListingStore()
  
  const { isLoggedIn } = useAuthStore()

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const totalSteps = steps.length
  
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (isLastStep) {
        handleFinish()
      } else {
        nextStep()
      }
    } else {
      console.warn('Please complete all required fields before proceeding')
      alert('Please complete all required fields before proceeding to the next step.')
    }
  }

  const handleBack = () => previousStep()

  const handleFinish = async () => {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }
    try {
      await submitForm()
      router.push('/property/success')
    } catch (error) {
      console.error('Failed to submit property listing:', error)
    }
  }

  return (
    <>
      <NavBarTop isQuestionnaire={true} />

      <div className="mx-auto w-full max-w-7xl min-h-screen flex pt-24 pb-32 px-4 sm:px-6">
        {/* Progress Tracker Sidebar - Hidden on Mobile */}
        {showProgressTracker && (
          <div className="hidden lg:block w-80 p-6 flex-shrink-0">
            <div className="sticky top-24">
              <ProgressTracker />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex items-start justify-center ${showProgressTracker ? 'lg:pl-6' : ''}`}>
          <div className="w-full max-w-4xl">
            {children}
          </div>
        </div>
      </div>

      <NavbarStepperBottom
        level={Math.ceil((currentStep + 1) / (totalSteps / 3))}
        progress={progressPercentage}
        isLastStep={isLastStep}
        isBackHidden={isFirstStep}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
      />
    </>
  )
}

export default EnhancedQuestionnaireWrapper