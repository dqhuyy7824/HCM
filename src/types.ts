export interface Character {
  id: string;
  name: string;
  title: string;
  period: string;
  bio: string;
  deathYear: number;
  avatarGradient: string; // Tailwind gradient classes
  avatarIcon: string; // Lucide icon name
  focusTopics: string[];
}

export interface TimelineEvent {
  year: number;
  title: string;
  period: string;
  description: string;
  significance: string;
  images: string; // Unsplash placeholder URL or premium visual element description
  references: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface AccuracyAnalysis {
  fact: string;
  interpretation: string;
  unverified: string;
}

export interface ImageAnalysisResult {
  siteName: string;
  period: string;
  significance: string;
  confidence: 'high' | 'low';
  explanation: string;
}
