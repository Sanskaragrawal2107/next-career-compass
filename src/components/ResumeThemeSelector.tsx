
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Briefcase, CheckCircle } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
  icon: React.ReactNode;
}

const themes: Theme[] = [
  {
    id: 'professional-modern',
    name: 'Professional Modern',
    description: 'Clean, modern design with clear sections and excellent ATS compatibility',
    preview: 'Modern layout with organized sections, bullet points, and professional typography',
    icon: <FileText className="w-6 h-6" />
  },
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    description: 'Traditional corporate style emphasizing leadership and achievements',
    preview: 'Classic format with emphasis on results, executive summary, and career progression',
    icon: <Briefcase className="w-6 h-6" />
  }
];

interface ResumeThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (themeId: string) => void;
  isGenerating: boolean;
}

const ResumeThemeSelector = ({ isOpen, onClose, onSelectTheme, isGenerating }: ResumeThemeSelectorProps) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('');

  const handleConfirm = () => {
    if (selectedTheme) {
      onSelectTheme(selectedTheme);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Choose Resume Theme
          </DialogTitle>
          <DialogDescription>
            Select a theme for your ATS-optimized resume. Both themes are designed for maximum compatibility with applicant tracking systems.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {themes.map((theme) => (
            <Card 
              key={theme.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedTheme === theme.id 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                  : 'border-gray-200 hover:border-primary/50'
              }`}
              onClick={() => setSelectedTheme(theme.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {theme.icon}
                    <CardTitle className="ml-2 text-lg">{theme.name}</CardTitle>
                  </div>
                  {selectedTheme === theme.id && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <CardDescription>{theme.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-600">Preview: {theme.preview}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    ATS Optimized
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Keyword Friendly
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Professional
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedTheme || isGenerating}
          >
            {isGenerating ? 'Generating Resume...' : 'Generate Optimized Resume'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeThemeSelector;
