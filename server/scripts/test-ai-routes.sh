#!/bin/bash

# Test script for AI suggestion routes
# This script sends requests to the AI suggestion routes to verify they are working correctly

echo "🔍 Testing AI suggestion routes..."

# Get a sample user ID
USER_ID=1  # Replace with an actual user ID if needed

# Test getting AI suggestions
echo -e "\n📌 Testing GET /api/goals/$USER_ID/ai-suggestions"
curl -s -X GET "http://localhost:3000/api/goals/$USER_ID/ai-suggestions" | json_pp

# Test accepting a goal suggestion
echo -e "\n📌 Testing POST /api/ai-goals/{id}/accept"
echo "Enter a goal ID to accept:"
read GOAL_ID
curl -s -X POST "http://localhost:3000/api/ai-goals/$GOAL_ID/accept" -H "Content-Type: application/json" | json_pp

# Test rejecting a goal suggestion
echo -e "\n📌 Testing DELETE /api/ai-goals/{id}"
echo "Enter a goal ID to reject:"
read GOAL_ID
curl -s -X DELETE "http://localhost:3000/api/ai-goals/$GOAL_ID" -v

# Test accepting a task suggestion
echo -e "\n📌 Testing POST /api/ai-tasks/{id}/accept"
echo "Enter a task ID to accept:"
read TASK_ID
curl -s -X POST "http://localhost:3000/api/ai-tasks/$TASK_ID/accept" -H "Content-Type: application/json" | json_pp

# Test rejecting a task suggestion
echo -e "\n📌 Testing DELETE /api/ai-tasks/{id}"
echo "Enter a task ID to reject:"
read TASK_ID
curl -s -X DELETE "http://localhost:3000/api/ai-tasks/$TASK_ID" -v

# Test accepting a habit suggestion
echo -e "\n📌 Testing POST /api/ai-habits/{id}/accept"
echo "Enter a habit ID to accept:"
read HABIT_ID
curl -s -X POST "http://localhost:3000/api/ai-habits/$HABIT_ID/accept" -H "Content-Type: application/json" | json_pp

# Test rejecting a habit suggestion
echo -e "\n📌 Testing DELETE /api/ai-habits/{id}"
echo "Enter a habit ID to reject:"
read HABIT_ID
curl -s -X DELETE "http://localhost:3000/api/ai-habits/$HABIT_ID" -v

echo -e "\n✅ All tests completed"