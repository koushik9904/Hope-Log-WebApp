/**
 * Automated test script for AI suggestion routes
 * 
 * This script tests the AI suggestion routes by:
 * 1. Getting AI suggestions for a user
 * 2. Accepting the first suggestion of each type
 * 3. Rejecting the second suggestion of each type (if available)
 */

import fetch from "node-fetch";
import { storage } from "../storage";

const baseUrl = "http://localhost:3000";
const userId = 1; // Change this to a valid user ID in your system

async function main() {
  try {
    console.log(`🔍 Testing AI suggestion routes for user ID: ${userId}`);
    
    // Get AI suggestions
    console.log("\n📌 Getting AI suggestions...");
    const suggestionsRes = await fetch(`${baseUrl}/api/goals/${userId}/ai-suggestions`);
    const suggestions = await suggestionsRes.json();
    
    console.log(`Found ${suggestions.goals?.length || 0} goals, ${suggestions.tasks?.length || 0} tasks, and ${suggestions.habits?.length || 0} habits`);
    
    // Test accepting and rejecting goals
    if (suggestions.goals && suggestions.goals.length > 0) {
      // Accept first goal
      const goalToAccept = suggestions.goals[0];
      console.log(`\n📌 Accepting goal: ${goalToAccept.name} (ID: ${goalToAccept.id})`);
      
      const acceptRes = await fetch(`${baseUrl}/api/ai-goals/${goalToAccept.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      console.log(`Response status: ${acceptRes.status}`);
      if (acceptRes.status === 200) {
        const acceptData = await acceptRes.json();
        console.log("Goal accepted successfully:", acceptData.id);
      } else {
        console.error("Failed to accept goal");
      }
      
      // Reject second goal if available
      if (suggestions.goals.length > 1) {
        const goalToReject = suggestions.goals[1];
        console.log(`\n📌 Rejecting goal: ${goalToReject.name} (ID: ${goalToReject.id})`);
        
        const rejectRes = await fetch(`${baseUrl}/api/ai-goals/${goalToReject.id}`, {
          method: "DELETE"
        });
        
        console.log(`Response status: ${rejectRes.status}`);
        if (rejectRes.status === 204) {
          console.log("Goal rejected successfully");
        } else {
          console.error("Failed to reject goal");
        }
      }
    } else {
      console.log("No goals available to test");
    }
    
    // Test accepting and rejecting tasks
    if (suggestions.tasks && suggestions.tasks.length > 0) {
      // Accept first task
      const taskToAccept = suggestions.tasks[0];
      console.log(`\n📌 Accepting task: ${taskToAccept.title} (ID: ${taskToAccept.id})`);
      
      const acceptRes = await fetch(`${baseUrl}/api/ai-tasks/${taskToAccept.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      console.log(`Response status: ${acceptRes.status}`);
      if (acceptRes.status === 200) {
        const acceptData = await acceptRes.json();
        console.log("Task accepted successfully:", acceptData.id);
      } else {
        console.error("Failed to accept task");
      }
      
      // Reject second task if available
      if (suggestions.tasks.length > 1) {
        const taskToReject = suggestions.tasks[1];
        console.log(`\n📌 Rejecting task: ${taskToReject.title} (ID: ${taskToReject.id})`);
        
        const rejectRes = await fetch(`${baseUrl}/api/ai-tasks/${taskToReject.id}`, {
          method: "DELETE"
        });
        
        console.log(`Response status: ${rejectRes.status}`);
        if (rejectRes.status === 204) {
          console.log("Task rejected successfully");
        } else {
          console.error("Failed to reject task");
        }
      }
    } else {
      console.log("No tasks available to test");
    }
    
    // Test accepting and rejecting habits
    if (suggestions.habits && suggestions.habits.length > 0) {
      // Accept first habit
      const habitToAccept = suggestions.habits[0];
      console.log(`\n📌 Accepting habit: ${habitToAccept.title} (ID: ${habitToAccept.id})`);
      
      const acceptRes = await fetch(`${baseUrl}/api/ai-habits/${habitToAccept.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      console.log(`Response status: ${acceptRes.status}`);
      if (acceptRes.status === 200) {
        const acceptData = await acceptRes.json();
        console.log("Habit accepted successfully:", acceptData.id);
      } else {
        console.error("Failed to accept habit");
      }
      
      // Reject second habit if available
      if (suggestions.habits.length > 1) {
        const habitToReject = suggestions.habits[1];
        console.log(`\n📌 Rejecting habit: ${habitToReject.title} (ID: ${habitToReject.id})`);
        
        const rejectRes = await fetch(`${baseUrl}/api/ai-habits/${habitToReject.id}`, {
          method: "DELETE"
        });
        
        console.log(`Response status: ${rejectRes.status}`);
        if (rejectRes.status === 204) {
          console.log("Habit rejected successfully");
        } else {
          console.error("Failed to reject habit");
        }
      }
    } else {
      console.log("No habits available to test");
    }
    
    console.log("\n✅ All tests completed");
    
  } catch (error) {
    console.error("❌ Error in test script:", error);
  } finally {
    process.exit(0);
  }
}

main();