import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Notification, NotificationPreferences } from "@shared/schema";

export function useNotifications() {
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60000, // Refetch every minute
  });

  const {
    data: unreadNotifications = [],
    isLoading: isLoadingUnread,
    refetch: refetchUnread
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/unread"],
    refetchInterval: 30000, // Refetch unread more frequently (every 30 seconds)
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}`, {
        status: "read"
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not mark notification as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      
      toast({
        title: "Notification deleted",
        description: "The notification has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not delete notification: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Clear all notifications
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/notifications");
    },
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      
      toast({
        title: "Notifications cleared",
        description: "All notifications have been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not clear notifications: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    notifications,
    unreadNotifications,
    isLoading,
    isLoadingUnread,
    error,
    refetch,
    refetchUnread,
    markAsRead: markAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    clearAllNotifications: clearAllNotificationsMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isClearing: clearAllNotificationsMutation.isPending,
  };
}

export function useNotificationPreferences() {
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      const res = await apiRequest("PATCH", "/api/notification-preferences", newPreferences);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/notification-preferences"], data);
      
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not update preferences: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
}