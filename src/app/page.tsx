'use client'
import HeroLanding from './components/HeroLanding'
import JournalingOverview from './components/JournalingOverview'
import HowJournalingWorks from './components/HowJounalingWorks'
import AnalysisLanding from './components/AnalysisLanding'
import PricingLanding from './components/PricingLanding'
import FrequentlyAskedQuestions from './components/FrequentlyAskedQuestions'
import PrivacyAndSecurityLanding from './components/PrivacyAndSecurityLanding'

export default function Home() {
  return (
    <main className="bg-dark text-white">
      <HeroLanding />
      <JournalingOverview />
      <HowJournalingWorks />
      <AnalysisLanding />
      <PricingLanding />
      <FrequentlyAskedQuestions />
      <PrivacyAndSecurityLanding />
    </main >
  );
}

