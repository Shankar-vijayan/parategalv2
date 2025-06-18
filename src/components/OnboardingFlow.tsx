// src/components/OnboardingFlow.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Crown, Diamond, Sparkles } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: (userData: {
    username: string;
    avatar: string;
    room: string;
  }) => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const profiles = [
    {
      username: "Lilly",
      avatar:
        "https://lblczomeozfpjoboekci.supabase.co/storage/v1/object/public/chat-uploads/profile_picture/lilly_profile.jpg",
    },
    {
      username: "Bobby",
      avatar:
        "https://lblczomeozfpjoboekci.supabase.co/storage/v1/object/public/chat-uploads/profile_picture/bobby_profile.jpg",
    },
  ];

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError("");

    // Auto-select profile based on password
    if (value === "647074") {
      setSelectedProfile("Lilly");
    } else if (value === "121101") {
      setSelectedProfile("Bobby");
    } else {
      setSelectedProfile("");
    }
  };

  const handleLogin = () => {
    if (!selectedProfile) {
      setError("Invalid VIP access code");
      return;
    }

    if (password !== "647074" && password !== "121101") {
      setError("Invalid VIP access code");
      return;
    }

    const profile = profiles.find((p) => p.username === selectedProfile);
    if (profile) {
      onComplete({
        username: profile.username,
        avatar: profile.avatar,
        room: "private",
      });
    }
  };

  const canProceed = () => {
    return selectedProfile && password.length > 0;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-black relative overflow-hidden">
      {/* Elite background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 text-gold-400/20 transform rotate-12">
          <Crown className="w-20 h-20" />
        </div>
        <div className="absolute top-32 right-16 text-purple-300/20 transform -rotate-12">
          <Diamond className="w-16 h-16" />
        </div>
        <div className="absolute bottom-40 left-20 text-gold-300/20 transform rotate-45">
          <Sparkles className="w-18 h-18" />
        </div>
        <div className="absolute bottom-20 right-10 text-purple-400/20 transform -rotate-45">
          <Crown className="w-14 h-14" />
        </div>

        {/* Luxury particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gold-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="animate-fade-in border-0 bg-black/40 backdrop-blur-xl shadow-2xl ring-1 ring-gold-500/20 max-h-[calc(100vh-2rem)] overflow-y-auto"> {/* ADDED: max-h-[calc(100vh-2rem)] overflow-y-auto */}
          <CardHeader className="text-center pb-8 bg-gradient-to-b from-gold-900/30 to-purple-900/30 rounded-t-lg border-b border-gold-500/20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-400 via-yellow-500 to-gold-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-gold-400/30">
              <Crown className="w-12 h-12 text-black" />
            </div>
            <CardTitle className="text-4xl font-bold mb-3 bg-gradient-to-r from-gold-400 via-yellow-300 to-gold-500 bg-clip-text text-transparent">
              ELITE BOUTIQUE
            </CardTitle>
            <CardDescription className="text-gold-200/80 font-medium text-lg">
              Exclusive VIP Access Portal
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Diamond className="w-4 h-4 text-gold-400" />
              <span className="text-gold-300/60 text-sm font-light tracking-wider">
                LUXURY • PRIVATE • EXCLUSIVE
              </span>
              <Diamond className="w-4 h-4 text-gold-400" />
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            {selectedProfile && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-gold-300 flex items-center gap-2 tracking-wide">
                  <Crown className="w-4 h-4 text-gold-400" />
                  VIP MEMBER SELECTED
                </label>
                <div className="flex justify-center">
                  <div className="p-6 rounded-2xl border-2 border-gold-400/50 bg-gradient-to-br from-gold-900/20 to-purple-900/20 text-center shadow-xl backdrop-blur-sm">
                    <img
                      src={
                        profiles.find((p) => p.username === selectedProfile)
                          ?.avatar
                      }
                      alt={selectedProfile}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-gold-400/70 shadow-xl ring-2 ring-gold-300/30"
                    />
                    <span className="text-lg font-bold text-gold-200 tracking-wide">
                      {selectedProfile}
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Sparkles className="w-3 h-3 text-gold-400" />
                      <span className="text-xs text-gold-400 font-medium">
                        VIP MEMBER
                      </span>
                      <Sparkles className="w-3 h-3 text-gold-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-semibold text-gold-300 flex items-center gap-2 tracking-wide">
                <Diamond className="w-4 h-4 text-gold-400" />
                VIP ACCESS CODE
              </label>
              <Input
                type="password"
                placeholder="Enter your exclusive access code..."
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="bg-black/30 border-2 border-gold-500/30 focus:border-gold-400 text-gold-100 placeholder:text-gold-400/50 rounded-xl h-14 text-center font-medium shadow-inner backdrop-blur-sm text-lg tracking-widest"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-4 rounded-xl border border-red-500/30 backdrop-blur-sm">
                <Crown className="w-5 h-5 mx-auto mb-2 text-red-400" />
                {error}
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={!canProceed()}
              className="w-full bg-gradient-to-r from-gold-600 via-yellow-500 to-gold-600 hover:from-gold-500 hover:via-yellow-400 hover:to-gold-500 text-black border-0 disabled:opacity-50 h-14 rounded-xl font-bold text-lg shadow-2xl hover:shadow-gold-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none tracking-wide"
            >
              <Crown className="w-6 h-6 mr-3" />
              ENTER ELITE BOUTIQUE
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingFlow;
