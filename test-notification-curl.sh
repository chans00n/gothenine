#!/bin/bash

# Test send-notifications function
echo "Testing send-notifications function..."
curl -X POST https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcXRwZWtvaXFud3VneXpmcml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU3MTM5MCwiZXhwIjoyMDY3MTQ3MzkwfQ.1P-V1DEYNW29SARgaHmmMGuNUY4eYpMn7_HqQDz0B-s" \
  -H "Content-Type: application/json" \
  -d '{}'

echo -e "\n\nTesting check-daily-streaks function..."
curl -X POST https://xkqtpekoiqnwugyzfrit.supabase.co/functions/v1/check-daily-streaks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcXRwZWtvaXFud3VneXpmcml0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU3MTM5MCwiZXhwIjoyMDY3MTQ3MzkwfQ.1P-V1DEYNW29SARgaHmmMGuNUY4eYpMn7_HqQDz0B-s" \
  -H "Content-Type: application/json" \
  -d '{}'