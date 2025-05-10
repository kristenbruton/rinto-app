import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Send, Ship, Loader2 } from 'lucide-react';

type Message = {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
};

type Conversation = {
  id: number;
  user1Id: string;
  user2Id: string;
  listingId?: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  otherUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  listing?: {
    id: number;
    title: string;
  };
};

export default function Messages() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: isConversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
  });

  // Fetch messages for selected conversation
  const { 
    data: messages = [],
    isLoading: isMessagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: [`/api/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/conversations/${selectedConversation}/messages`, {
        content
      });
      return await response.json();
    },
    onSuccess: () => {
      setMessageContent('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-select first conversation if none is selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    
    sendMessageMutation.mutate(messageContent);
  };

  // Get other user in conversation
  const getOtherUser = (conversation: Conversation) => {
    if (!user) return null;
    
    const otherUserId = conversation.user1Id === user.id 
      ? conversation.user2Id 
      : conversation.user1Id;
    
    // Try to find other user in the conversation data
    return conversation.otherUser || {
      id: otherUserId,
      firstName: 'User',
      profileImageUrl: undefined
    };
  };

  // Format timestamp for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show only time
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, "MMM d, h:mm a");
    }
    
    // Otherwise show full date
    return format(date, "MMM d, yyyy, h:mm a");
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading font-bold mb-6">Messages</h1>

        {isConversationsLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Ship className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
              <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                You don't have any messages yet. Start a conversation by sending a message to a listing owner or renter.
              </p>
              <Button onClick={() => navigate('/search')}>
                Browse Watercraft
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <div className="md:col-span-1 border rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="p-4 border-b bg-neutral-50">
                <h2 className="font-semibold">Conversations</h2>
              </div>
              <div className="overflow-y-auto h-[calc(600px-57px)]">
                {conversations.map((conversation: Conversation) => {
                  const otherUser = getOtherUser(conversation);
                  return (
                    <div 
                      key={conversation.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-neutral-50 cursor-pointer transition-colors ${
                        selectedConversation === conversation.id ? 'bg-neutral-100' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-start">
                        <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                          <AvatarImage src={otherUser?.profileImageUrl} />
                          <AvatarFallback>
                            {otherUser?.firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-medium truncate">
                              {otherUser?.firstName} {otherUser?.lastName}
                            </h3>
                            <span className="text-xs text-neutral-500">
                              {format(new Date(conversation.updatedAt), "MMM d")}
                            </span>
                          </div>
                          {conversation.listing && (
                            <p className="text-xs text-neutral-600 flex items-center mb-1">
                              <Ship className="h-3 w-3 mr-1" />
                              {conversation.listing.title}
                            </p>
                          )}
                          <p className="text-sm text-neutral-500 truncate">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Messages */}
            <div className="md:col-span-2 border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b bg-neutral-50 flex items-center">
                    {conversations.map((conv: Conversation) => {
                      if (conv.id === selectedConversation) {
                        const otherUser = getOtherUser(conv);
                        return (
                          <div key={conv.id} className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={otherUser?.profileImageUrl} />
                              <AvatarFallback>
                                {otherUser?.firstName?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">
                                {otherUser?.firstName} {otherUser?.lastName}
                              </h3>
                              {conv.listing && (
                                <p className="text-xs text-neutral-600 flex items-center">
                                  <Ship className="h-3 w-3 mr-1" />
                                  {conv.listing.title}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Messages List */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-neutral-50">
                    {isMessagesLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-10 text-neutral-500">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <>
                        {messages.map((message: Message) => {
                          const isCurrentUser = message.senderId === user?.id;
                          const sender = isCurrentUser 
                            ? user 
                            : message.sender || { firstName: 'User' };
                          
                          return (
                            <div 
                              key={message.id}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="flex items-start max-w-[80%]">
                                {!isCurrentUser && (
                                  <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                                    <AvatarImage src={sender.profileImageUrl} />
                                    <AvatarFallback>
                                      {sender?.firstName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div>
                                  <div 
                                    className={`rounded-lg px-4 py-2 inline-block ${
                                      isCurrentUser 
                                        ? 'bg-primary text-white rounded-tr-none' 
                                        : 'bg-white border rounded-tl-none'
                                    }`}
                                  >
                                    {message.content}
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-1">
                                    {formatMessageTime(message.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-white">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <Input
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow"
                      />
                      <Button 
                        type="submit" 
                        size="icon"
                        disabled={!messageContent.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
