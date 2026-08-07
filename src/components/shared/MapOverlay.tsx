import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { MapView, MapItem } from "./MapView";

interface MapOverlayProps {
  items: MapItem[];
  onViewItem: (item: MapItem) => void;
  onEditItem?: (item: MapItem) => void;
  onClose: () => void;
  isVisible: boolean;
}

export function MapOverlay({ items, onViewItem, onEditItem, onClose, isVisible }: MapOverlayProps) {
  if (!isVisible) return null;

  return (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription>
            View item locations on the map. Click on markers to see details.
          </CardDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <MapView
          items={items}
          onViewItem={onViewItem}
          onEditItem={onEditItem}
        />
      </CardContent>
      <hr className="border-border" />
    </>
  );
}