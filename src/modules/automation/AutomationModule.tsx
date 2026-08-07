import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Play, Pause, Settings, ArrowRight } from "lucide-react";
import { formatStatValue } from "@/lib/formatters";
import { PluginGate } from "@/modules/shared/plugins";

export function AutomationModule() {
  const { t: _t } = useTranslation();

  const workflows = [
    {
      id: 1,
      name: "New Lead Welcome Sequence",
      description: "Automatically send welcome email and assign to sales rep",
      trigger: "New contact created",
      actions: 3,
      status: "active",
      lastRun: "2 hours ago",
      runs: 45
    },
    {
      id: 2,
      name: "Follow-up Reminder",
      description: "Send reminder to sales rep after 3 days of inactivity",
      trigger: "Deal stagnant for 3 days",
      actions: 2,
      status: "active",
      lastRun: "1 day ago",
      runs: 23
    },
    {
      id: 3,
      name: "Lead Scoring Update",
      description: "Automatically update lead score based on activities",
      trigger: "Contact activity recorded",
      actions: 1,
      status: "paused",
      lastRun: "5 days ago",
      runs: 156
    }
  ];

  const automationStats = [
    {
      label: "Active Workflows",
      value: "12",
      change: "+2",
      color: "text-green-600"
    },
    {
      label: "Total Runs",
      value: "1,248",
      change: "+156",
      color: "text-blue-600"
    },
    {
      label: "Time Saved",
      value: "24h",
      change: "+4h",
      color: "text-purple-600"
    },
    {
      label: "Success Rate",
      value: "94%",
      change: "+2%",
      color: "text-green-600"
    }
  ];

  return (
    <PluginGate code="PL0042AUTOMATION">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-4/10 shadow-soft">
                <Zap className="h-10 w-10 text-chart-4" />
              </div>
              Automation
            </h1>
            <p className="text-muted-foreground mt-3 text-xl">
              Automate repetitive tasks and streamline your workflow
            </p>
          </div>
          <Button className="gradient-primary text-white shadow-medium hover-lift px-6 py-3 text-base">
            <Plus className="mr-2 h-5 w-5" />
            Create Workflow
          </Button>
        </div>

        {/* Automation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {automationStats.map((stat, index) => (
            <Card key={index} className="border-border/50 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{formatStatValue(stat.value)}</p>
                  </div>
                  <Badge className="bg-green-500">{stat.change}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Start Templates</CardTitle>
            <CardDescription>
              Pre-built automation templates to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50 hover:shadow-medium transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Lead Nurturing</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically nurture leads with email sequences
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:shadow-medium transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Deal Assignment</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Auto-assign deals based on criteria
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:shadow-medium transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Follow-up Reminders</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Never miss a follow-up opportunity
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Active Workflows */}
        <Card className="border-border/50 shadow-soft">
          <CardHeader>
            <CardTitle className="text-foreground">Your Workflows</CardTitle>
            <CardDescription>
              Manage and monitor your automation workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      workflow.status === 'active' ? 'bg-green-500/10' : 'bg-gray-500/10'
                    }`}>
                      <Zap className={`h-6 w-6 ${
                        workflow.status === 'active' ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Trigger: {workflow.trigger}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.actions} actions
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Last run: {workflow.lastRun}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{workflow.runs} runs</p>
                      <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {workflow.status === 'active' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </PluginGate>
  );
}