/**
 * Deploy Guide Dialog
 * Shows step-by-step instructions for deploying exported websites.
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ExternalLink, Globe, Code, Upload, Github } from 'lucide-react';

interface DeployGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: 'html' | 'react';
}

export function DeployGuide({ open, onOpenChange, format }: DeployGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Deploy Your {format === 'html' ? 'HTML' : 'React'} Website
          </DialogTitle>
          <DialogDescription>
            Free hosting options for your exported website.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {format === 'html' ? (
            <>
              <DeployOption
                icon={<Globe className="h-5 w-5 text-[#00c7b7]" />}
                title="Netlify Drop"
                description="Drag and drop your ZIP file — no account needed."
                steps={['Unzip the downloaded file', 'Go to app.netlify.com/drop', 'Drag the folder onto the page', 'Your site is live!']}
                link="https://app.netlify.com/drop"
              />
              <DeployOption
                icon={<Github className="h-5 w-5" />}
                title="GitHub Pages"
                description="Push to a GitHub repo and enable Pages."
                steps={['Create a new GitHub repository', 'Upload the unzipped files', 'Go to Settings → Pages', 'Select "main" branch → Save']}
                link="https://pages.github.com"
              />
              <DeployOption
                icon={<Upload className="h-5 w-5 text-blue-500" />}
                title="Any Web Host"
                description="Upload files via FTP to any hosting provider."
                steps={['Unzip the downloaded file', 'Connect to your host via FTP', 'Upload all files to public_html or www', 'Visit your domain']}
              />
            </>
          ) : (
            <>
              <DeployOption
                icon={<Code className="h-5 w-5" />}
                title="Vercel"
                description="Push to GitHub, import to Vercel — auto-deploys on every push."
                steps={['Unzip and push to a GitHub repo', 'Go to vercel.com/new', 'Import the repository', 'Vercel auto-detects Vite — click Deploy']}
                link="https://vercel.com/new"
              />
              <DeployOption
                icon={<Globe className="h-5 w-5 text-[#00c7b7]" />}
                title="Netlify"
                description="Connect your GitHub repo for automatic deployments."
                steps={['Push to GitHub', 'Go to app.netlify.com', 'Click "Add new site" → Import from Git', 'Build command: npm run build, Publish: dist']}
                link="https://app.netlify.com"
              />
              <DeployOption
                icon={<Upload className="h-5 w-5 text-orange-500" />}
                title="Manual Deploy"
                description="Build locally and upload the dist folder."
                steps={['Unzip the project', 'Run: npm install', 'Run: npm run build', 'Upload the "dist" folder to any web host']}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeployOption({
  icon,
  title,
  description,
  steps,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: string[];
  link?: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-xs flex items-center gap-1"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <ol className="text-xs text-muted-foreground space-y-1 pl-5 list-decimal">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
