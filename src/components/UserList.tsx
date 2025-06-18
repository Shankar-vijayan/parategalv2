
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  username: string;
  avatar: string;
  room: string;
}

interface UserListProps {
  currentUser: User;
}

const UserList = ({ currentUser }: UserListProps) => {
  // Determine the other user based on current user
  const otherUser = currentUser.username === 'Lilly' 
    ? {
        username: 'Bobby',
        avatar: 'https://lblczomeozfpjoboekci.supabase.co/storage/v1/object/public/chat-uploads/profile_picture/bobby_profile.jpg'
      }
    : {
        username: 'Lilly', 
        avatar: 'https://lblczomeozfpjoboekci.supabase.co/storage/v1/object/public/chat-uploads/profile_picture/lilly_profile.jpg'
      };

  const users = [
    {
      id: '1',
      username: currentUser.username,
      avatar: currentUser.avatar,
      status: 'online',
      isCurrentUser: true,
    },
    {
      id: '2',
      username: otherUser.username,
      avatar: otherUser.avatar,
      status: 'online',
      isCurrentUser: false,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/20">
        <h3 className="text-white font-semibold mb-2">Chat Members</h3>
        <p className="text-gray-400 text-sm">2 people in this chat</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                    {user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${getStatusColor(user.status)}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-white text-sm font-medium truncate">
                    {user.username}
                  </p>
                  {user.isCurrentUser && (
                    <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 text-xs">{getStatusText(user.status)}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserList;
