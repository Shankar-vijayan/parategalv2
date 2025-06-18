// src/components/ChatRoom.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send,
  MessageCircle,
  LogOut,
  FileImage,
  FileVideo,
  FileAudio,
  Plus,
  FileText,
  Smile,
  MessageSquareReply,
  XCircle,
  Bell,
  BellOff,
} from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import { supabase } from "@/supabaseClient";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications"; // Ensure this path is correct

interface User {
  username: string;
  avatar: string;
  room: string;
}

interface RawMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  file_url: string | null;
  file_type: "image" | "video" | "audio" | "document" | null;
  replied_to_message_id: string | null;
}

interface Message {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  fileUrl?: string;
  fileType?: "image" | "video" | "audio" | "document";
  replyTo?: {
    id: string;
    user: string;
    content: string;
  };
}

interface ChatRoomProps {
  user: User;
}

const ChatRoom = ({ user }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  // Destructure `permission` here to use it in logs
  const { permission, requestPermission, sendNotification } =
    useBrowserNotifications();

  const getAvatarUrl = useCallback((username: string): string => {
    if (username === "Lilly") {
      return "https://lblczomeozfpjoboekci.supabase.co/storage/v1/object/public/chat-uploads/profile_picture/lilly_profile.jpg";
    } else if (username === "Bobby") {
      return "https://lblczomeozfpjoboekci.supabase.co/storage/v1/object/public/chat-uploads/profile_picture/bobby_profile.jpg";
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const formatMessage = useCallback(
    (rawMsg: RawMessage): Message => {
      const isOwnMessage = rawMsg.sender === user.username;
      let status: "sent" | "delivered" | "read" | undefined = rawMsg.status;
      if (isOwnMessage && status === "sent") {
        status = "delivered";
      }
      return {
        id: String(rawMsg.id),
        user: rawMsg.sender,
        avatar: getAvatarUrl(rawMsg.sender),
        content: rawMsg.message,
        timestamp: new Date(rawMsg.timestamp),
        isOwn: isOwnMessage,
        status: status,
        fileUrl: rawMsg.file_url || undefined,
        fileType: rawMsg.file_type || undefined,
        replyTo: rawMsg.replied_to_message_id
          ? { id: rawMsg.replied_to_message_id, user: "", content: "" }
          : undefined,
      };
    },
    [user.username, getAvatarUrl]
  );

  const processAndLinkMessages = useCallback(
    (rawMessages: RawMessage[]): Message[] => {
      const basicFormattedMessages: Message[] = rawMessages.map(formatMessage);
      const linkedMessages = basicFormattedMessages.map((msg) => {
        if (msg.replyTo?.id) {
          const repliedTo = basicFormattedMessages.find(
            (m) => m.id === msg.replyTo?.id
          );
          if (repliedTo) {
            return {
              ...msg,
              replyTo: {
                id: repliedTo.id,
                user: repliedTo.user,
                content: repliedTo.content,
              },
            };
          }
        }
        return msg;
      });
      return linkedMessages;
    },
    [formatMessage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.id;
            const message = messages.find((msg) => msg.id === messageId);
            if (
              message &&
              !message.isOwn &&
              message.status !== "read" &&
              !message.id.startsWith("temp-")
            ) {
              const { error } = await supabase
                .from("messages")
                .update({ status: "read" })
                .eq("id", message.id);
              if (error) {
                console.error("Error marking message as read:", error);
              }
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    messages.forEach((message) => {
      if (
        !message.isOwn &&
        message.status !== "read" &&
        !message.id.startsWith("temp-")
      ) {
        const element = messageRefs.current.get(message.id);
        if (element) {
          observer.observe(element);
        }
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [messages, user.username]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        setMessages(processAndLinkMessages(data as RawMessage[]));
        scrollToBottom();
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const newMsgFromDb = payload.new as RawMessage;

          // --- START ADDED CONSOLE LOGS FOR NOTIFICATION DEBUGGING ---
          console.log("--- New message event received ---");
          console.log("Event Type:", payload.eventType);
          console.log("Sender:", newMsgFromDb.sender);
          console.log("Your Username:", user.username);
          console.log(
            "Is sender different?",
            newMsgFromDb.sender !== user.username
          );
          console.log("Is document hidden (tab inactive)?", document.hidden);
          console.log("Current browser notification permission:", permission); // Log the permission state from the hook
          // --- END ADDED CONSOLE LOGS ---

          if (
            payload.eventType === "INSERT" &&
            newMsgFromDb.sender !== user.username &&
            document.hidden // This condition is crucial!
          ) {
            // --- START CONSOLE LOG FOR SUCCESSFUL NOTIFICATION CONDITIONS ---
            console.log("✅ All conditions met to attempt notification!");
            console.log(
              "Attempting to play sound and send notification for message:",
              newMsgFromDb.message
            );
            // --- END CONSOLE LOG ---

            new Audio("/notification.mp3")
              .play()
              .catch((e) => console.error("Error playing sound:", e));
            sendNotification(`New message from ${newMsgFromDb.sender}`, {
              body: newMsgFromDb.message,
              icon: getAvatarUrl(newMsgFromDb.sender),
              tag: "new-message",
            });
          } else {
            // --- START CONSOLE LOG FOR FAILED NOTIFICATION CONDITIONS ---
            // New webhook trigger for Lilly's messages
            if (
              payload.eventType === "INSERT" &&
              newMsgFromDb.sender === "Lilly"
            ) {
              console.log(
                "Detecting new message from Lilly, triggering webhook..."
              );
              fetch(
                "https://services.leadconnectorhq.com/hooks/u4CjdnxclGsXYlpRXmD3/webhook-trigger/bcf425c1-533d-4b74-a5eb-327a95d34e2a",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    user: "test1",
                    mobile_number: "7475747574",
                    status: "true",
                  }),
                }
              )
                .then((response) => response.json())
                .then((data) => console.log("Webhook success:", data))
                .catch((error) => console.error("Webhook error:", error));
            }

            // Original notification failure log
            console.log(
              "❌ Notification conditions NOT met. Not sending notification."
            );
            if (payload.eventType !== "INSERT")
              console.log("   - Reason: Event type is not INSERT.");
            if (newMsgFromDb.sender === user.username)
              console.log("   - Reason: Message is from yourself.");
            if (!document.hidden)
              console.log("   - Reason: Document is visible (tab is active).");
            // --- END CONSOLE LOG ---
          }

          setMessages((prevMessages) => {
            let currentRawMessages: RawMessage[] = prevMessages.map((msg) => ({
              id: msg.id,
              sender: msg.user,
              message: msg.content,
              timestamp: msg.timestamp.toISOString(),
              status: msg.status || "sent",
              file_url: msg.fileUrl || null,
              file_type: msg.fileType || null,
              replied_to_message_id: msg.replyTo?.id || null,
            }));
            let replaced = false;

            if (payload.eventType === "INSERT") {
              if (newMsgFromDb.sender === user.username) {
                if (newMsgFromDb.file_url === null) {
                  // Find and replace optimistic text message
                  const optimisticTextIndex = currentRawMessages.findIndex(
                    (msg) =>
                      msg.sender === user.username &&
                      String(msg.id).startsWith("temp-") &&
                      msg.file_url === null &&
                      msg.message === newMsgFromDb.message &&
                      msg.replied_to_message_id ===
                        newMsgFromDb.replied_to_message_id
                  );
                  if (optimisticTextIndex !== -1) {
                    currentRawMessages[optimisticTextIndex] = newMsgFromDb;
                    replaced = true;
                  }
                } else {
                  // Find and replace optimistic file message
                  const optimisticFileIndex = currentRawMessages.findIndex(
                    (msg) =>
                      msg.sender === user.username &&
                      String(msg.id).startsWith("temp-file-") &&
                      msg.file_type === newMsgFromDb.file_type &&
                      msg.message === newMsgFromDb.message && // Match by content for files
                      msg.replied_to_message_id ===
                        newMsgFromDb.replied_to_message_id
                  );
                  if (optimisticFileIndex !== -1) {
                    const oldMsg = prevMessages[optimisticFileIndex];
                    if (oldMsg.fileUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(oldMsg.fileUrl); // Clean up optimistic blob URL
                    }
                    currentRawMessages[optimisticFileIndex] = newMsgFromDb;
                    replaced = true;
                  }
                }
              }
              if (!replaced) {
                currentRawMessages.push(newMsgFromDb);
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedMsgFromDb = payload.new as RawMessage;
              currentRawMessages = currentRawMessages.map((msg) =>
                msg.id === String(updatedMsgFromDb.id) ? updatedMsgFromDb : msg
              );
            }
            return processAndLinkMessages(currentRawMessages);
          });
          setTimeout(scrollToBottom, 50); // Small delay to allow DOM to update before scrolling
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      messageRefs.current.clear(); // Clear refs on unmount
    };
  }, [
    user.username,
    getAvatarUrl,
    processAndLinkMessages,
    scrollToBottom,
    sendNotification,
    permission, // Add permission to this useEffect's dependency array so its value is fresh in the callback
  ]);

  useEffect(() => {
    const markOtherUserMessagesAsReadOnLogin = async () => {
      let otherSenderUsername: string | null =
        user.username === "Lilly"
          ? "Bobby"
          : user.username === "Bobby"
          ? "Lilly"
          : null;

      if (otherSenderUsername) {
        const { error } = await supabase
          .from("messages")
          .update({ status: "read" })
          .eq("sender", otherSenderUsername)
          .in("status", ["sent", "delivered"]); // Mark only unread messages
        if (error) {
          console.error(
            "Error updating messages to read status on login:",
            error
          );
        }
      }
    };

    if (user.username) {
      markOtherUserMessagesAsReadOnLogin();
    }
  }, [user.username]);

  const handleReply = useCallback((messageToReply: Message) => {
    setReplyingToMessage(messageToReply);
    setNewMessage(""); // Clear input when starting a reply
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !replyingToMessage) return; // Prevent sending empty messages without a reply

    const tempId = `temp-${Date.now()}`; // Optimistic UI ID

    const optimisticMessage: Message = {
      id: tempId,
      user: user.username,
      avatar: getAvatarUrl(user.username),
      content: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
      // Status is implicitly 'sent' for optimistic updates
      replyTo: replyingToMessage
        ? {
            id: replyingToMessage.id,
            user: replyingToMessage.user,
            content: replyingToMessage.content,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setReplyingToMessage(null); // Clear reply state after sending
    scrollToBottom(); // Scroll immediately for optimistic UI

    const messageToSend: Omit<RawMessage, "id" | "status"> & {
      status: "sent";
    } = {
      sender: user.username,
      message: optimisticMessage.content,
      timestamp: optimisticMessage.timestamp.toISOString(),
      status: "sent", // Always 'sent' initially from client
      file_url: null,
      file_type: null,
      replied_to_message_id: replyingToMessage?.id || null,
    };

    const { error } = await supabase.from("messages").insert([messageToSend]);

    if (error) {
      console.error("Error sending message:", error);
      // Revert optimistic update if sending fails
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line in input
      handleSendMessage();
    }
  };

  const handleFileUpload = async (
    type: "image" | "video" | "audio" | "document"
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      type === "image"
        ? "image/*"
        : type === "video"
        ? "video/*"
        : type === "audio"
        ? "audio/*"
        : ".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.ppt,.pptx"; // Common document types
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      const tempId = `temp-file-${Date.now()}`;
      const fileContentMessage = `Shared a ${type}.`; // Generic message for file sharing

      // Optimistic message for the UI
      const optimisticMessage: Message = {
        id: tempId,
        user: user.username,
        avatar: getAvatarUrl(user.username),
        content: fileContentMessage, // Show "Shared a image." etc.
        timestamp: new Date(),
        isOwn: true,
        fileUrl: URL.createObjectURL(file), // Create a temporary URL for preview
        fileType: type,
        replyTo: replyingToMessage
          ? {
              id: replyingToMessage.id,
              user: replyingToMessage.user,
              content: replyingToMessage.content,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setReplyingToMessage(null); // Clear reply state
      scrollToBottom();

      const fileName = `${Date.now()}_${file.name.replace(/\s/g, "_")}`; // Sanitize filename
      const filePath = `${user.username}/${fileName}`; // Store files under sender's username

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("chat-uploads")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          // Revert optimistic update on upload failure
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          return;
        }

        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from("chat-uploads")
          .getPublicUrl(uploadData.path);

        if (!publicUrlData.publicUrl) {
          console.error("Failed to get public URL for file.");
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          return;
        }

        const filePublicUrl = publicUrlData.publicUrl;

        // Insert message into database with the public URL
        const messageToSend: Omit<RawMessage, "id" | "status"> & {
          status: "sent";
        } = {
          sender: user.username,
          message: fileContentMessage,
          timestamp: optimisticMessage.timestamp.toISOString(),
          file_url: filePublicUrl,
          file_type: type,
          status: "sent",
          replied_to_message_id: replyingToMessage?.id || null,
        };

        const { error: dbError } = await supabase
          .from("messages")
          .insert([messageToSend]);

        if (dbError) {
          console.error("Error inserting file message into DB:", dbError);
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        }
      } catch (err) {
        console.error("Unexpected error during file upload:", err);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      } finally {
        setUploading(false);
      }
    };
    input.click(); // Programmatically click the hidden input
  };

  const handleLogout = () => {
    // Simple reload for logout, as user state is managed outside this component
    window.location.reload();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-red-to-br from-slate-600 via-emerald-650 to-slate-600">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-emerald-500/40 to-teal-500/40 backdrop-blur-lg border-b border-white/10 shadow-lg flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-white font-bold text-sm">Comrade Chat</h1>
            <p className="text-gray-300 text-xs opacity-80">Just you and me</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {permission === "default" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={requestPermission}
              className="text-white hover:bg-white/10"
              title="Enable Notifications"
            >
              <Bell className="w-5 h-5" />
            </Button>
          )}
          {permission === "denied" && (
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="text-gray-400 cursor-not-allowed"
              title="Notifications blocked"
            >
              <BellOff className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area - Simplified */}
      {/* Changed pb-[7rem] to pb-[8rem] to ensure messages are not hidden behind the input area on smaller screens. */}
      <div className="absolute inset-0 pt-16 pb-[8rem] flex flex-col">
        <ScrollArea className="flex-1 bg-emerald-950/20">
          <div className="space-y-4 py-4 px-4 sm:px-6">
            {" "}
            {/* <--- THIS IS CRUCIAL */}
            {messages.map((message) => (
              <div
                key={message.id}
                id={message.id}
                ref={(el) => {
                  if (el) {
                    messageRefs.current.set(message.id, el);
                  } else {
                    messageRefs.current.delete(message.id);
                  }
                }}
              >
                <ChatMessage message={message} onReply={handleReply} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-emerald-600/40 to-slate-600/40 backdrop-blur-lg border-t border-white/10 shadow-lg z-10">
        {replyingToMessage && (
          <div className="bg-white/15 border border-white/20 rounded-lg p-3 mb-3 flex items-center justify-between shadow-inner">
            <div className="flex items-center space-x-3 overflow-hidden">
              <MessageSquareReply className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-white">
                  Replying to {replyingToMessage.user}
                </span>
                <p className="text-xs text-gray-300 truncate opacity-90">
                  {replyingToMessage.content}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyingToMessage(null)}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              title="Cancel reply"
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        )}

        <div className="flex space-x-2 sm:space-x-3 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/15 p-2 rounded-full transition-colors"
                title="Share Files"
                disabled={uploading}
              >
                {uploading ? (
                  <span className="animate-spin text-white">🔄</span>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-white/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl">
              <div className="flex flex-col space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload("document")}
                  className="flex items-center justify-start space-x-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  disabled={uploading}
                >
                  <FileText className="w-4 h-4" />
                  <span>Document</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload("image")}
                  className="flex items-center justify-start space-x-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  disabled={uploading}
                >
                  <FileImage className="w-4 h-4" />
                  <span>Image</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload("audio")}
                  className="flex items-center justify-start space-x-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  disabled={uploading}
                >
                  <FileAudio className="w-4 h-4" />
                  <span>Audio</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileUpload("video")}
                  className="flex items-center justify-start space-x-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  disabled={uploading}
                >
                  <FileVideo className="w-4 h-4" />
                  <span>Video</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/15 p-2 rounded-full transition-colors"
                title="Insert Emoji"
                disabled={uploading}
              >
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            {/* Adjusted max-width for emoji picker to prevent horizontal overflow on small screens */}
            <PopoverContent
              side="top"
              align="start"
              className="w-[min(300px,calc(100vw-16px))] p-0 border-0 bg-transparent shadow-none"
            >
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                  setNewMessage((prev) => prev + emoji.native);
                  setShowEmojiPicker(false);
                }}
                theme="dark"
                perLine={7}
                skinTonePosition="none"
                previewPosition="none"
                searchPosition="none"
                navPosition="bottom"
                categories={[
                  "smileys",
                  "people",
                  "animals",
                  "food",
                  "travel",
                  "activities",
                  "objects",
                  "symbols",
                  "flags",
                ]}
                width="100%"
              />
            </PopoverContent>
          </Popover>

          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-xl h-12 px-4 shadow-inner text-base"
            disabled={uploading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !replyingToMessage) || uploading}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 rounded-xl h-12 w-12 flex-shrink-0 shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
