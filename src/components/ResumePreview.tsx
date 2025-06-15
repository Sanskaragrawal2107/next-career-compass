
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Edit, FileText, Share } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GeneratedResume {
  id: string;
  job_title: string | null;
  theme: string | null;
  optimized_content: string;
  created_at: string;
}

interface ResumePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  resume: GeneratedResume | null;
}

const ResumePreview = ({ isOpen, onClose, resume }: ResumePreviewProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!resume) return;
    
    setIsDownloading(true);
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Download failed",
          description: "Please allow popups for this site to download the resume.",
          variant: "destructive",
        });
        return;
      }

      // Write the resume content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resume - ${resume.job_title || 'Optimized Resume'}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
            h1, h2, h3 { color: #2563eb; margin-bottom: 10px; }
            h1 { border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
            h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-top: 25px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
            .contact-info { margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
          </style>
        </head>
        <body>
          ${resume.optimized_content}
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
              Download as PDF
            </button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();

      toast({
        title: "Resume ready for download",
        description: "Click 'Download as PDF' in the new window to save your resume.",
      });

    } catch (error) {
      console.error('Error preparing resume for download:', error);
      toast({
        title: "Download failed",
        description: "Failed to prepare resume for download. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!resume) return;
    
    try {
      // Extract text content from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = resume.optimized_content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      await navigator.clipboard.writeText(textContent);
      toast({
        title: "Copied to clipboard",
        description: "Resume content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy resume content.",
        variant: "destructive",
      });
    }
  };

  if (!resume) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Resume Preview - {resume.job_title || 'Optimized Resume'}
          </DialogTitle>
          <DialogDescription>
            Your ATS-optimized resume has been generated. Review the content and download when ready.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 h-[500px] border rounded-md p-4">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: resume.optimized_content }}
            />
          </ScrollArea>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Theme: {resume.theme?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} • 
              Generated: {new Date(resume.created_at).toLocaleDateString()}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyToClipboard}>
                <Share className="w-4 h-4 mr-2" />
                Copy Text
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDownloadPDF} disabled={isDownloading}>
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Preparing...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreview;
