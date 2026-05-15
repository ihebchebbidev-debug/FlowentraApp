# Memory: ai/data-queries
Updated: 2026-02-03

## AI Data Query Capabilities

The AI assistant can execute **100+ real-time data queries and actions** across all system modules. Queries support both English and French patterns.

### 🧠 Smart Intent Recognition (NEW!)
The AI now uses a **two-tier intent detection system**:
1. **Fast Regex Patterns** - Instant matching for common phrases
2. **LLM Fallback** - Uses lightweight model for fuzzy/conversational requests

**Supported Smart Actions:**
- `form_creation` - Create forms, checklists, surveys (even conversational: "hey can you make me a form...")
- `task_creation` - Personal tasks, todos, reminders
- `dispatch_assignment` - Assign dispatches to technicians
- `stock_modification` - Add/remove inventory
- `contact_lookup` - Find customer information
- `offer_creation` - Create quotes/offers
- `schedule_query` - Check who is working, availability
- `analytics_query` - Reports, statistics, performance

### 🆕 Advanced Analytics & Forecasting
- **Revenue Forecast**: "predict revenue", "forecast sales", "what will we make next month"
- **Period Comparison**: "compare this month vs last", "week over week", "period comparison"
- **Scheduling Optimization**: "scheduling recommendations", "optimize schedule", "who is overloaded"
- **Demand Forecast**: "demand forecast", "busiest days", "peak hours", "when are we busiest"
- **Anomaly Detection**: "anomaly detection", "find issues", "health check", "what is wrong"
- **Churn Risk Analysis**: "churn risk", "at risk customers", "dormant customers", "customer retention"
- **Profitability Analysis**: "profit margins", "most profitable", "margin analysis"
- **Technician Efficiency**: "technician efficiency", "efficiency score", "tech ranking"

**Smart Features:**
- Trend-based revenue prediction with confidence levels
- Period-over-period comparison (week/month)
- Workload distribution and overload detection
- Pattern analysis for busy periods
- Unusual sale/offer detection
- Customer inactivity alerts
- Profit margin by product
- Technician performance scoring (completion, on-time, first-time-fix)

### Dispatch Assignment Actions
- **Assign Dispatch**: "assign dispatch DISP-001 to Ahmed", "schedule DISP-001 for Sarah"
- **With Time**: "assign DISP-001 to Ahmed at 9:00", "plan dispatch DISP-001 for John at 14:00"
- **Confirm Assignment**: "confirm assign DISP-001 to Ahmed at 9:00"
- **Suggest Technician**: "who should I assign DISP-001 to", "best technician for DISP-001"
- **Availability Check**: "who is available for DISP-001", "suggest tech for dispatch DISP-001"

### Data Overview Queries
- **Articles/Inventory**: count, low stock alerts, search by name/SKU
- **Offers**: stats, pipeline value, conversion rate, search by number
- **Sales**: stats, revenue trends, monthly performance, search by number
- **Contacts**: count, customer stats, search by name/email/company
- **Users/Technicians**: stats, availability, workload, search by name
- **Service Orders**: stats, search by number
- **Dispatches**: stats, today's dispatches
- **Projects**: stats, search by name
- **Installations**: stats, warranty expiry, maintenance due, search by name
- **Dynamic Forms**: stats, list, search, active forms

### Planning & Dispatch Queries
- **Dispatch Lookup**: "dispatch #DISP-XXX", "status of dispatch DISP-XXX"
- **Service Order Lookup**: "service order #SO-XXX", "show service order SO-XXX"
- **Who is Working on Dispatch**: "who is working on dispatch DISP-XXX", "technicians on DISP-XXX"
- **Who is Working on Service Order**: "who is assigned to service order SO-XXX"
- **Technician Schedule**: "@John schedule", "planning for Ahmed", "what is Sarah's dispatches"
- **Unassigned Jobs**: "jobs needing planning", "unassigned jobs", "what needs planning"
- **Offer Status**: "status of offer OFF-XXX"
- **Sale Status**: "status of sale SAL-XXX"

### Action Queries
- **Task Completion**: "mark [task] as done", "complete [task]"
- **User Availability**: "is @John working today", "who is off"
- **Dispatch Assignment**: "assign dispatch DISP-XXX to [name]"

### Analytics Queries
- **Dashboard Summary**: comprehensive overview of all data
- **Today's Summary**: personalized daily briefing
- **Weekly Performance**: week-over-week metrics
- **Business Metrics**: KPIs and key metrics
- **Revenue Trends**: monthly revenue analysis
- **Conversion Rate**: offer-to-sale conversion
- **Technician Performance**: top performers ranking
- **Customer Stats**: top customers by revenue

### Lookup Queries
- **Notifications**: unread count and summary
- **Roles & Permissions**: overview
- **Currencies**: available currencies
- **Priorities**: priority levels
- **Leave Types**: vacation/leave options
- **Skills**: available technician skills
- **Locations**: warehouse/site locations

### Search Queries (by entity)
All search queries support: `find/search/show me/look up [entity] [search term]`
- Contacts, Articles, Offers, Sales, Projects, Installations, Service Orders, Users

### Pattern Examples
```
"how many sales" → getSalesStats
"today's tasks" → getTodaysTasks
"find contact John" → searchContacts("John")
"offer #OFF-001" → getOfferDetails("OFF-001")
"is @Ahmed working today" → checkUserWorkingToday("Ahmed")
"mark task 'Review report' as done" → markTaskComplete("Review report")
"low stock alerts" → getLowStockAlerts
"business metrics" → getBusinessMetrics
"dispatch DISP-001" → getDispatchDetails("DISP-001")
"who is working on service order SO-001" → getServiceOrderAssignees("SO-001")
"@Sarah schedule" → getTechnicianSchedule("Sarah")
"unassigned jobs" → getUnassignedJobs
"assign dispatch DISP-001 to Ahmed" → assignDispatchToTechnician("DISP-001", "Ahmed")
"who should I assign DISP-001 to" → suggestTechnicianForDispatch("DISP-001")
"confirm assign DISP-001 to Ahmed at 9:00" → executeDispatchAssignment("DISP-001", "Ahmed", "9:00")
"revenue forecast" → getRevenueForecast
"compare this month vs last" → getComparativeAnalytics("month")
"scheduling recommendations" → getSchedulingRecommendations
"demand forecast" → getDemandForecast
"anomaly detection" → getAnomalyDetection
"churn risk" → getChurnRiskAnalysis
"profitability analysis" → getProfitabilityAnalysis
"technician efficiency" → getTechnicianEfficiency
```
