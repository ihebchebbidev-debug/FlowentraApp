import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, Mail, Phone, Video, Clock, Send, Search, Filter, Calendar, User, TrendingUp } from "lucide-react";
import { PluginGate } from "@/modules/shared/plugins";

export function CommunicationModule() {
  const { t: _t } = useTranslation();

  const communications = [
    {
      id: 1,
      type: "email",
      subject: "Follow-up: Enterprise Demo Proposal",
      contact: "John Doe",
      company: "Acme Corp",
      date: "2 hours ago",
      status: "sent",
      priority: "high",
      preview: "Thank you for your interest in our enterprise solution. I wanted to follow up on our demo session..."
    },
    {
      id: 2,
      type: "call",
      subject: "Technical Discovery Call", 
      contact: "Jane Smith",
      company: "Tech Startup",
      date: "Yesterday",
      status: "completed",
      priority: "medium",
      duration: "45 min",
      preview: "Discussed technical requirements and integration capabilities"
    },
    {
      id: 3,
      type: "meeting",
      subject: "Contract Review Meeting",
      contact: "Mike Johnson", 
      company: "Consulting LLC",
      date: "Dec 15",
      status: "scheduled",
      priority: "high",
      duration: "1 hour",
      preview: "Final contract terms and pricing negotiation"
    },
    {
      id: 4,
      type: "email",
      subject: "Quarterly Business Review Invitation",
      contact: "Sarah Williams",
      company: "Global Industries",
      date: "3 hours ago",
      status: "delivered",
      priority: "medium",
      preview: "We'd like to schedule your quarterly business review to discuss performance..."
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'call': return Phone;
      case 'meeting': return Video;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'status-info';
      case 'delivered': return 'status-success';
      case 'completed': return 'status-success';
      case 'scheduled': return 'status-warning';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <PluginGate code="PL0027COMMUNICATION">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 shadow-soft">
                <MessageSquare className="h-10 w-10 text-accent" />
              </div>
              Communication Hub
            </h1>
            <p className="text-muted-foreground mt-3 text-xl">
              Manage all customer interactions and communications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="shadow-card hover-lift">
              <Send className="mr-2 h-4 w-4" />
              Compose
            </Button>
            <Button className="gradient-primary text-white shadow-medium hover-lift">
              <Plus className="mr-2 h-4 w-4" />
              New Communication
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-card border-0 gradient-card">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search communications by contact, company, or subject..."
                  className="pl-10 h-11 border-0 shadow-soft bg-background/80 focus:shadow-medium transition-all"
                />
              </div>
              <Button variant="outline" className="shadow-card hover-lift h-11 px-4">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" className="shadow-card hover-lift h-11 px-4">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-card border-0 hover-lift gradient-card group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <Badge className="status-success">+15%</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Emails Today</p>
                <p className="text-3xl font-bold text-foreground">42</p>
                <p className="text-xs text-muted-foreground">12 pending replies</p>
              </div>
            </CardContent>
          </Card>
        
          <Card className="shadow-card border-0 hover-lift gradient-card group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 transition-all">
                  <Phone className="h-6 w-6 text-success" />
                </div>
                <Badge className="status-info">+8%</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Calls This Week</p>
                <p className="text-3xl font-bold text-foreground">23</p>
                <p className="text-xs text-muted-foreground">Avg duration 28min</p>
              </div>
            </CardContent>
          </Card>
        
          <Card className="shadow-card border-0 hover-lift gradient-card group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-all">
                  <Video className="h-6 w-6 text-accent" />
                </div>
                <Badge className="status-warning">Upcoming</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Meetings Scheduled</p>
                <p className="text-3xl font-bold text-foreground">9</p>
                <p className="text-xs text-muted-foreground">Next in 2 hours</p>
              </div>
            </CardContent>
          </Card>
        
          <Card className="shadow-card border-0 hover-lift gradient-card group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-warning/10 group-hover:bg-warning/20 transition-all">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <Badge className="status-success">+12%</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Response Rate</p>
                <p className="text-3xl font-bold text-foreground">89%</p>
                <p className="text-xs text-muted-foreground">Above average</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Communications */}
        <Card className="shadow-card border-0 gradient-card">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">Recent Communications</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Latest interactions with your contacts and prospects
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {communications.map((comm) => {
                const IconComponent = getIcon(comm.type);
                return (
                  <div key={comm.id} className="group flex items-start gap-4 p-6 rounded-xl border border-border/10 hover:bg-background/60 transition-all duration-200 hover:shadow-medium">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl bg-${comm.type === 'email' ? 'primary' : comm.type === 'call' ? 'success' : 'accent'}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`h-6 w-6 text-${comm.type === 'email' ? 'primary' : comm.type === 'call' ? 'success' : 'accent'}`} />
                      </div>
                    </div>
                  
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground text-lg leading-tight">
                          {comm.subject}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={`${getPriorityColor(comm.priority)} text-xs px-2 py-1`}>
                            {comm.priority}
                          </Badge>
                          <Badge className={`${getStatusColor(comm.status)} text-xs`}>
                            {comm.status}
                          </Badge>
                        </div>
                      </div>
                    
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{comm.contact}</span>
                          <span>•</span>
                          <span>{comm.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{comm.date}</span>
                        </div>
                        {comm.duration && (
                          <div className="flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            <span>{comm.duration}</span>
                          </div>
                        )}
                      </div>
                    
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {comm.preview}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card className="shadow-card border-0 gradient-card">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">Email Integration</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Connect your email accounts for seamless communication tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/10 hover:bg-background/60 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Gmail Integration</p>
                    <p className="text-sm text-muted-foreground">user@company.com</p>
                  </div>
                </div>
                <Badge className="status-success">Connected</Badge>
              </div>
            
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/10 hover:bg-background/60 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Outlook Integration</p>
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="hover-lift">
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </PluginGate>
  );
}