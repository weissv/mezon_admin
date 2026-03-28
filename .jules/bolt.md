## 2025-02-23 - Removed Redundant DB Query in DashboardWidgetService
**Learning:** Found a case where `Promise.all` contained identical queries to Prisma (`prisma.attendance.count`) for populating `childrenPresent` and `childrenOnMeals`. This redundant query was fired on every dashboard load.
**Action:** When inspecting dashboard aggregations, look for identical queries being fired in parallel within `Promise.all` blocks. We can reuse the result of the first query to populate multiple variables.
