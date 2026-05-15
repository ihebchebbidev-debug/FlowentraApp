import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CollapsibleSearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  searchLabel?: string;
}

export function CollapsibleSearch({ 
  placeholder, 
  value, 
  onChange, 
  className,
  searchLabel
}: CollapsibleSearchProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!value) {
          setIsExpanded(false);
        }
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, value]);

  const handleSearchClick = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    onChange("");
    setIsExpanded(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearchClick}
          className="h-8 px-3 gap-2 hover:bg-muted/50 transition-all duration-150"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline text-[13px] text-muted-foreground">{searchLabel || t('search')}</span>
        </Button>
      ) : (
        <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={placeholder || t('search_placeholder')}
              value={value}
              onChange={handleInputChange}
              className="pl-9 pr-9 h-8 border-border/60 bg-background text-[13px] min-w-[200px] sm:min-w-[280px]"
            />
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {!value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 px-2"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}