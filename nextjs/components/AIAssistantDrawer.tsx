// components/AIAssistantDrawer.tsx

"use client";

import { Bot, User } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { EMAIL } from "@/models/constants";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { Resizable } from "re-resizable";
import { createMCPClient } from "@/lib/mcp-client";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistantDrawer() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter(); // Add router
  const [drawerWidth, setDrawerWidth] = useState(650);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Handle resize functionality
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX;
      const newWidth = startWidthRef.current + deltaX;

      // Set min and max width constraints
      if (newWidth > 400 && newWidth < 1000) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = drawerWidth;
    setIsResizing(true);
  };

  // Initialize client when drawer opens
  const handleDrawerOpen = async () => {
    if (client) return; // Already initialized

    const cosmosDBMcpClient = await createMCPClient();
    if (cosmosDBMcpClient) {
      setClient(cosmosDBMcpClient);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !client) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      const toolsData = await client.listTools();

      // transform mcp tools into openai tools format
      // add email property to getOrders tool if not already added
      const openAITools = toolsData.tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.name === "getOrders" 
            ? { ...tool.inputSchema, properties: { ...tool.inputSchema.properties, email: { type: "string", default: EMAIL } } }
            : tool.inputSchema,
          strict: false,
        },
      }));
      console.log("openAI tools", openAITools);
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversationHistory: messages,
          tools: openAITools,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const r = await response.json();
      const result = JSON.parse(r.content);

      // Handle tool calls if present
      if (result.choices[0].finish_reason === "tool_calls") {
        const toolCalls = result.choices[0].message.tool_calls;

        for (const toolCall of toolCalls) {          

          console.log("toolCall:", toolCall);
          const toolResult = await client.callTool({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          });

          try {
            switch (toolCall.function.name) {
              case "searchProducts":
                console.log("Formatting searchProducts output...");
                const parsedResult = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

                // Parse the content structure which contains the product array
                if (parsedResult && parsedResult.content && Array.isArray(parsedResult.content)) {
                  // Look for text content that contains JSON string of products
                  const textContent = parsedResult.content.find((item: { type: string; text: any }) => item.type === "text" && item.text);

                  if (textContent && textContent.text) {
                    // Parse the JSON string in the text field
                    const productsArray = JSON.parse(textContent.text);

                    if (Array.isArray(productsArray) && productsArray.length > 0) {
                      // Extract product IDs from the array of product objects
                      const productIds = productsArray.filter((product) => product.id).map((product) => product.id);

                      if (productIds.length > 0) {
                        // Navigate to products page with IDs but keep drawer open
                        router.push(`/products?ids=${productIds.join(",")}`);

                        // Create a formatted list of products for display
                        const productsFormatted = `
                        ${productsArray.map((p) => `\n**${p.name}**: $${p.price}`).join("\n")}`;

                        const formattedResponse: Message = {
                          role: "assistant",
                          content: productsFormatted,
                        };
                        setMessages((prev) => [...prev, formattedResponse]);
                      }
                    }
                  }
                }
                break;
              case "getOrders":
                console.log("Formatting getOrders output...");
                const ordersResult = typeof toolResult === "string" ? JSON.parse(toolResult) : toolResult;

                if (ordersResult && ordersResult.content && Array.isArray(ordersResult.content)) {
                  const textContent = ordersResult.content.find((item: { type: string; text: any }) => item.type === "text" && item.text);

                  if (textContent && textContent.text) {
                    const orders = JSON.parse(textContent.text);

                    if (Array.isArray(orders) && orders.length > 0) {
                      const ordersFormatted = `\n# Your Orders:\n\n
    
                ${orders
                  .map(
                    (order) => `\n**Order ID**: ${order.id}
                \n**Date**: ${new Date(order.createdAt).toLocaleDateString()}
                \n**Status**: ${order.status}
                \n**Total**: $${order.total.toFixed(2)}
                \n**Items**: ${order.items.length} items
    
                ${order.items.map((item: any) => `\n- ${item.name} (${item.quantity}x) at $${item.price}`).join("\n")}`
                  )
                  .join("\n\n---\n\n")}`;

                      const formattedResponse: Message = {
                        role: "assistant",
                        content: ordersFormatted,
                      };
                      setMessages((prev) => [...prev, formattedResponse]);
                    } else {
                      const noOrdersResponse: Message = {
                        role: "assistant",
                        content: "No orders found for this email address.",
                      };
                      setMessages((prev) => [...prev, noOrdersResponse]);
                    }
                  }
                }
                break;
              default:
                console.log("No tool was called...");
                break;
            }
          } catch (parseError) {
            console.error("Error parsing tool result:", parseError);
          }
        }
      } else if (result.choices[0].message.content) {
        console.log("Not a tools call, displaying response...");
        // Handle normal message response
        const assistantMessage: Message = {
          role: "assistant",
          content: result.choices[0].message.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (e) {
      console.error(e);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) handleDrawerOpen();
  };

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="p-2 hover:bg-gray-100 rounded-full">
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        style={{ width: "auto", maxWidth: "none", padding: 0 }}
        className="overflow-visible"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('[data-state="closed"]')) {
            e.preventDefault();
          }
        }}
      >
        <Resizable
          defaultSize={{ width: drawerWidth, height: "100%" }}
          minWidth={400}
          maxWidth={1000}
          enable={{ left: true, right: false, top: false, bottom: false }}
          handleClasses={{ left: "w-2 bg-transparent hover:bg-blue-400 hover:opacity-50 cursor-ew-resize" }}
          onResizeStop={(e, direction, ref, d) => {
            setDrawerWidth(drawerWidth + d.width);
          }}
        >
          <div className="p-6 h-full">
            <SheetHeader>
              <SheetTitle>AI Shopping Assistant</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
              <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center mt-4">Ask me anything about our products!</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-2 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">{msg.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}</div>
                        <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === "assistant" ? "bg-white border prose prose-sm" : "bg-blue-500 text-white"}`}>{msg.role === "assistant" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." className="flex-1" />
                <Button type="submit">Send</Button>
              </form>
            </div>
          </div>
        </Resizable>
      </SheetContent>
    </Sheet>
  );
}
