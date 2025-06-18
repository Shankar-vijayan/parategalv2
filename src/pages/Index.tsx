
import { useState } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import ChatRoom from '@/components/ChatRoom';

const Index = () => {
  const [user, setUser] = useState<{ username: string; avatar: string; room: string } | null>(null);

  const handleOnboardingComplete = (userData: { username: string; avatar: string; room: string }) => {
    console.log('Onboarding completed for user:', userData);
    setUser(userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900">
      {!user ? (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      ) : (
        <ChatRoom user={user} />
      )}
    </div>
  );
};

export default Index;
