import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, MoreVertical } from "lucide-react";

interface Conversation {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  status: "open" | "resolved" | "waiting";
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    userName: "John Doe",
    lastMessage: "Hi, I need help with my order",
    timestamp: "2 min ago",
    status: "open",
  },
  {
    id: "2",
    userName: "Jane Smith",
    lastMessage: "Thank you for your assistance",
    timestamp: "1 hour ago",
    status: "resolved",
  },
];

export const Inbox = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <div className="bg-primary text-white w-full h-full flex items-center justify-center">
                      {conversation.userName[0]}
                    </div>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {conversation.userName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {conversation.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium">Inbox</h2>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Select a conversation to start chatting</p>
        </div>
      </div>
    </div>
  );
};