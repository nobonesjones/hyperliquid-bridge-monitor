import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  percentChange?: number;
  className?: string;
}

export function StatCard({ title, value, percentChange, className }: StatCardProps) {
  const isPositive = percentChange !== undefined && percentChange >= 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        
        {percentChange !== undefined && (
          <div 
            className={cn(
              "stat-change",
              isPositive ? "stat-change-positive" : "stat-change-negative"
            )}
          >
            <ArrowUpIcon className={cn("h-3 w-3", !isPositive && "rotate-180")} />
            <span>{Math.abs(percentChange)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
