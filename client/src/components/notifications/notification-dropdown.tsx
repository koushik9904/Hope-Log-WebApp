import { useState, useRef, useEffect } from "react";
import { formatDistance } from "date-fns";
import { 
  Bell,
  Check,
  Trash2,
  AlertCircle,
  Goal,
  Calendar,
  InfoIcon,
  X
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { Notification } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadNotifications,
    isLoading,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    isMarkingAsRead,
    isDeleting,
    isClearing
  } = useNotifications();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Calendar className="h-4 w-4 text-[#F5B8DB]" />;
      case 'goal':
        return <Goal className="h-4 w-4 text-[#9AAB63]" />;
      case 'streak':
        return <Check className="h-4 w-4 text-[#B6CAEB]" />;
      case 'system':
      default:
        return <InfoIcon className="h-4 w-4 text-[#F5D867]" />;
    }
  };
  
  // Format the notification date
  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification bell button with indicator */}
      <button 
        className="text-white hover:text-gray-200 bg-gray-700 p-2 rounded-full transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#F5B8DB] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
            {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
          </span>
        )}
      </button>
      
      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-medium text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => clearAllNotifications()}
                disabled={isClearing}
              >
                {isClearing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Clear all"
                )}
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#F5B8DB]" />
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    isProcessing={isMarkingAsRead || isDeleting}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">
                  You're all caught up! We'll notify you when there's something new.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  isProcessing: boolean;
}

function NotificationItem({ notification, onMarkAsRead, onDelete, isProcessing }: NotificationItemProps) {
  const isUnread = notification.status === "unread";
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Calendar className="h-4 w-4 text-[#F5B8DB]" />;
      case 'goal':
        return <Goal className="h-4 w-4 text-[#9AAB63]" />;
      case 'streak':
        return <Check className="h-4 w-4 text-[#B6CAEB]" />;
      case 'system':
      default:
        return <InfoIcon className="h-4 w-4 text-[#F5D867]" />;
    }
  };
  
  return (
    <div 
      className={cn(
        "p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors relative",
        isUnread && "bg-blue-50/30"
      )}
    >
      <div className="flex">
        <div className="p-2 bg-gray-100 rounded-full mr-3 flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-grow">
          <h4 className="text-sm font-medium text-gray-800">{notification.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
          <div className="flex items-center mt-2">
            <span className="text-xs text-gray-400">
              {typeof notification.createdAt === 'string' ? formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true }) : 'Just now'}
            </span>
            {isUnread && (
              <span className="ml-2 bg-[#F5B8DB] rounded-full w-2 h-2" />
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute top-2 right-2 flex space-x-1">
        {isUnread && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-blue-100 text-gray-500 hover:text-gray-700"
            onClick={onMarkAsRead}
            disabled={isProcessing}
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-full hover:bg-red-100 text-gray-500 hover:text-gray-700"
          onClick={onDelete}
          disabled={isProcessing}
          title="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}