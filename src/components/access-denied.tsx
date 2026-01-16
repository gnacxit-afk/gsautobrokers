import { TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function AccessDenied() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm m-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <TriangleAlert className="h-16 w-16 text-destructive" />
        <h3 className="text-2xl font-bold tracking-tight">
          Access Denied
        </h3>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
}
