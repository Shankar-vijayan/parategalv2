// src/components/ChatMessage.tsx
import React from "react";
// Removed Avatar imports as they are no longer used
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import {
  FileText,
  Download,
  Check,
  CheckCheck,
  MessageSquareReply,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Define the Message interface, including file-related and reply-related properties
interface Message {
  id: string; // Unique ID for the message (can be temporary for optimistic updates)
  user: string; // Keep user for replyTo context
  avatar: string; // Keep avatar for internal logic if needed elsewhere, but not displayed here
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read"; // 'sent' from DB is shown as 'delivered' in UI for own messages
  fileUrl?: string;
  fileType?: "image" | "video" | "audio" | "document";
  // NEW: Reply-related properties (as per your desired structure)
  replyTo?: {
    id: string; // ID of the message being replied to
    user: string; // Sender of the message being replied to
    content: string; // Content of the message being replied to
  };
}

interface ChatMessageProps {
  message: Message;
  onReply?: (message: Message) => void; // Callback for replying to this message
}

const ChatMessage = ({ message, onReply }: ChatMessageProps) => {
  // Helper function to format timestamp using date-fns
  const formatDateTime = (date: Date) => {
    if (isToday(date)) {
      return `Today ${format(date, "h:mm a")}`;
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`;
    }
    return `${format(date, "MMM d, yyyy h:mm a")}`;
  };

  // Helper function to render text content with URL detection
  const renderMessageContent = (content: string) => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlPattern);

    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 underline hover:text-blue-200"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getStatusIcon = () => {
    if (!message.isOwn) return null;

    if (message.id.startsWith("temp-")) {
      return <Check className="w-3 h-3 text-gray-400/50" />;
    }

    switch (message.status) {
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case "read":
        return (
          <CheckCheck className="w-3 h-3 text-lime-300 drop-shadow-[0_0_5px_rgba(134,239,172,0.8)]" />
        );
      case "sent":
      default:
        return null;
    }
  };

  // Helper function to render file content based on fileType
  const renderFileContent = () => {
    if (!message.fileUrl || !message.fileType) {
      return null;
    }

    const commonMediaContainerClasses =
      "max-w-full rounded-lg overflow-hidden mt-2 mb-1";
    const actualMediaElementClasses = "max-w-full object-cover";

    switch (message.fileType) {
      case "image":
        return (
          <div className={cn(commonMediaContainerClasses, "bg-gray-100")}>
            <img
              src={message.fileUrl}
              alt="Shared Image"
              className={actualMediaElementClasses}
              onClick={() => window.open(message.fileUrl, "_blank")}
              style={{ cursor: "pointer" }}
            />
          </div>
        );
      case "video":
        return (
          <div className={cn(commonMediaContainerClasses, "bg-gray-100")}>
            <video controls className="w-full">
              <source src={message.fileUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "audio":
        return (
          <div className={cn(commonMediaContainerClasses, "bg-gray-100")}>
            <audio controls className="w-full">
              <source src={message.fileUrl} type="audio/mpeg" />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      case "document":
        const filename =
          message.fileUrl.split("/").pop()?.split("?")[0] || "Document File";
        return (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center space-x-2 p-3 rounded-md transition-colors mt-2 mb-1",
              message.isOwn
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
          >
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="flex-1 font-medium text-sm truncate">
              {filename}
            </span>
            <Download className="w-4 h-4 opacity-70" />
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex animate-fade-in group relative",
        message.isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          // Responsive max-widths based on screen size
          "flex flex-col overflow-visible max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[50%]"
        )}
      >
        <div
          className={cn(
            "overflow-visible px-4 py-2 rounded-2xl break-words relative",
            message.isOwn
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md"
              : "bg-white/10 text-white rounded-bl-md"
          )}
        >
          {message.replyTo && (
            <div
              className={cn(
                "border-l-2 pl-3 pb-2 mb-2 italic text-sm",
                message.isOwn
                  ? "border-emerald-300 text-emerald-100"
                  : "border-gray-400 text-gray-300"
              )}
            >
              <span className="font-semibold text-sm">
                {message.replyTo.user || "Someone"}
              </span>
              <p className="line-clamp-2 text-xs">{message.replyTo.content}</p>
            </div>
          )}

          {message.fileUrl && renderFileContent()}

          {message.content &&
            (!message.fileUrl ||
              (message.content !== `Shared a ${message.fileType}.` &&
                message.content !== `Shared a image.` &&
                message.content !== `Shared a video.` &&
                message.content !== `Shared a audio.` &&
                message.content !== `Shared a document.`)) && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {" "}
                {/* Added overflow-x-auto */}
                {renderMessageContent(message.content)}
              </p>
            )}

          {onReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(message)}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 rounded-full",
                "bg-gray-800/50 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10",
                message.isOwn ? "-left-8" : "-right-8"
              )}
              title="Reply to message"
            >
              <MessageSquareReply className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div
          className={cn(
            "flex items-center space-x-2 text-xs text-gray-400 w-full pt-1",
            message.isOwn ? "justify-end pr-1" : "justify-start pl-1"
          )}
        >
          <span>{formatDateTime(message.timestamp)}</span>
          {message.isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
