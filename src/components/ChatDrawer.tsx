import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  type: 'received' | 'sent' | 'system';
  text: string;
  timestamp: string;
  from: 'customer' | 'vendor' | 'system';
  campaignName?: string;
  campaignId?: string;
  isCampaign?: boolean;
  status?: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && userId) {
      loadChatHistory();
    }
  }, [isOpen, userId]);

  const loadChatHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/whatsapp/chat/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        setError('Failed to load chat history');
      }
    } catch (error) {
      setError('Error loading chat history');
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError('');

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      type: 'sent',
      text: messageText,
      timestamp: new Date().toISOString(),
      from: 'vendor'
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/whatsapp/chat/${userId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update the optimistic message with real data
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, id: result.messageId, timestamp: result.timestamp }
            : msg
        ));
      } else {
        // Revert optimistic update on failure
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setError('Failed to send message');
      }
    } catch (error) {
      // Revert optimistic update on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setError('Error sending message');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="w-96 bg-white shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{userId}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500">Loading chat history...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-500">No messages yet</div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.from === 'vendor' 
                    ? 'justify-end' 
                    : message.from === 'system' 
                    ? 'justify-center' 
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.from === 'vendor'
                      ? 'bg-blue-500 text-white'
                      : message.from === 'system'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.isCampaign ? (
                    <div>
                      <div className="text-sm font-medium flex items-center">
                        📢 {message.campaignName}
                      </div>
                      {message.status && (
                        <div className="text-xs mt-1 opacity-75">
                          Status: {message.status}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm">{message.text}</div>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      message.from === 'vendor' 
                        ? 'text-blue-100' 
                        : message.from === 'system'
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;
