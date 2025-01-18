import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, MoreVertical, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Conversation {
  id: string;
  user_name: string;
  last_message: string;
  created_at: string;
  status: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'company';
  created_at: string;
}

export const Inbox = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
    subscribeToConversations();
  }, []);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    setConversations(data || []);
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Type guard to ensure sender_type is either 'user' or 'company'
    const validMessages = (data || []).map(msg => ({
      ...msg,
      sender_type: msg.sender_type === 'user' || msg.sender_type === 'company' 
        ? msg.sender_type 
        : 'user' // fallback to 'user' if invalid type
    })) as Message[];

    setMessages(validMessages);
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        () => {
          fetchMessages(conversation.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    setIsLoading(true);
    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          content: replyMessage,
          sender_type: 'company' as const,
        });

      if (messageError) throw messageError;

      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          last_message: replyMessage,
        })
        .eq('id', selectedConversation.id);

      if (conversationError) throw conversationError;

      setReplyMessage("");
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversation.last_message &&
        conversation.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-white">
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
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''
              }`}
              onClick={() => handleConversationSelect(conversation)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <div className="bg-primary text-white w-full h-full flex items-center justify-center">
                      {conversation.user_name[0]}
                    </div>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {conversation.user_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {conversation.last_message}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium">
              {selectedConversation ? selectedConversation.user_name : 'Inbox'}
            </h2>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        {selectedConversation ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_type === 'company' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.sender_type === 'company'
                        ? 'bg-chat-company text-white'
                        : 'bg-chat-user text-gray-800'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <Button size="icon" onClick={sendReply} disabled={isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
