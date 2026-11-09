// src/components/GroupChat.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  groupId: string;
  currentUserId: string;
}

interface Message {
  id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
}

export const GroupChat: React.FC<Props> = ({ groupId, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Load initial messages
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) {
        toast.error('Failed to load chat');
        console.error(error);
      } else {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };
    fetch();
  }, [groupId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const subscription = supabase
      .channel('public:group_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [groupId]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    const { error } = await supabase.from('group_messages').insert({
      group_id: groupId,
      sender_id: currentUserId,
      content: newMsg.trim(),
    });
    if (error) {
      toast.error('Failed to send message');
      console.error(error);
    } else {
      setNewMsg('');
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading chat…</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto mb-2">
            {messages.map((msg) => (
              <div key={msg.id} className="flex space-x-2">
                <span className="font-medium">
                  {msg.sender_id === currentUserId ? 'You' : msg.sender_id ?? 'System'}:
                </span>
                <span>{msg.content}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message…"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
};
