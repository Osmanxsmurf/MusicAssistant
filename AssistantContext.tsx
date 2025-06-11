import { createContext, useContext, ReactNode } from 'react';

interface AssistantService {
  searchYouTube: (query: string) => Promise<any[]>;
  getYouTubeVideoId: (url: string) => string | null;
}

interface AssistantContextType {
  assistantService: AssistantService;
  isAssistantLoading: boolean;
  assistantError: string | null;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

const assistantService: AssistantService = {
  searchYouTube: async (query: string) => {
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  },
  getYouTubeVideoId: (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
};

export function AssistantProvider({ children }: { children: ReactNode }) {
  return (
    <AssistantContext.Provider
      value={{
        assistantService,
        isAssistantLoading: false,
        assistantError: null
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
} 