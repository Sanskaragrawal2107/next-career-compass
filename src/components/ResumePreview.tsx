
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
      // Create a blob with the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resume - ${resume.job_title || 'Optimized Resume'}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px;
              background: white;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none !important; }
            }
            h1, h2, h3 { color: #2563eb; margin-bottom: 10px; }
            h1 { border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
            h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; margin-top: 25px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
            .contact-info { margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #2563eb;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              z-index: 1000;
            }
            .print-button:hover {
              background: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">
            📄 Download as PDF
          </button>
          ${resume.optimized_content}
          <script>
            // Auto-focus for better UX
            window.focus();
          </script>
        </body>
        </html>
      `;

      // Try to open new window first
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        toast({
          title: "Resume ready for download",
          description: "Click 'Download as PDF' in the new window to save your resume.",
        });
      } else {
        // Fallback: create downloadable HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${resume.job_title || 'optimized'}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Resume downloaded",
          description: "HTML file downloaded. Open it in a browser and print to PDF.",
        });
      }

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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Resume Preview - {resume.job_title || 'Optimized Resume'}
          </DialogTitle>
          <DialogDescription>
            Your ATS-optimized resume has been generated. Review the content and download when ready.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto border rounded-md bg-white">
            <div className="p-6">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: resume.optimized_content }}
              />
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t bg-background">
            <div className="text-sm text-muted-foreground">
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
