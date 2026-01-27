import { useState } from 'react';
import { Bell, CheckCheck, Calendar, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { notifications } from '@/app/services/mockData';
import { toast } from 'sonner';

export function NotificationsScreen() {
  const [notificationsList, setNotificationsList] = useState(notifications);

  const handleMarkAllRead = () => {
    setNotificationsList((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    toast.success('All notifications marked as read');
  };

  const handleAcceptShift = (id: string) => {
    toast.success('Shift swap accepted');
    setNotificationsList((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDeclineShift = (id: string) => {
    toast.info('Shift swap declined');
    setNotificationsList((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'shift':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'leave':
        return <CheckCheck className="w-5 h-5 text-green-600" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notificationsList.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">
                You're all caught up!
              </p>
            </CardContent>
          </Card>
        ) : (
          notificationsList.map((notification) => (
            <Card
              key={notification.id}
              className={`shadow-md hover:shadow-lg transition-shadow ${
                !notification.read ? 'border-l-4 border-l-blue-600' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-xs">
                          New
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(notification.timestamp)}
                      </span>

                      {notification.actionable && notification.type === 'shift' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineShift(notification.id)}
                            className="h-7 text-xs"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptShift(notification.id)}
                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
