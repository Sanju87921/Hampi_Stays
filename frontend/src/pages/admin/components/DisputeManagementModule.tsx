import { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle, MessageSquare, Send, X, Loader2 } from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Button } from "../../../components/ui/Button";

export function DisputeManagementModule() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<any[]>('/admin/disputes');
      setDisputes(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedDispute) return;
    setIsSending(true);
    try {
      const newMessage = await apiClient.post(`/admin/disputes/${selectedDispute.id}/message`, {
        content: replyText
      });
      setSelectedDispute({
        ...selectedDispute,
        messages: [...(selectedDispute.messages || []), newMessage]
      });
      setReplyText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setIsResolving(true);
    try {
      await apiClient.patch(`/admin/disputes/${selectedDispute.id}/resolve`, { resolution: "RESOLVED" });
      toast.success("Dispute resolved successfully!");
      setDisputes(prev => prev.map(d => d.id === selectedDispute.id ? { ...d, status: 'RESOLVED' } : d));
      setSelectedDispute(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve dispute");
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500" /> Dispute Resolution Center
          </h2>
          <p className="text-sm text-navy-950/60 mt-1">Manage and resolve transaction disputes between travelers and guides.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* List */}
        <div className="bg-white rounded-3xl border border-sand-200 overflow-y-auto overflow-x-hidden p-4 space-y-3">
          {disputes.length === 0 ? (
            <div className="text-center py-12 text-navy-950/40">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active disputes</p>
            </div>
          ) : disputes.map((dispute) => (
            <div 
              key={dispute.id}
              onClick={() => setSelectedDispute(dispute)}
              className={`p-4 rounded-2xl cursor-pointer border transition-colors ${
                selectedDispute?.id === dispute.id ? "border-gold-500 bg-sand-50" : "border-sand-100 hover:border-gold-200"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  dispute.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {dispute.status}
                </span>
                <span className="text-[10px] text-navy-950/40 font-mono">#{dispute.id.slice(-6)}</span>
              </div>
              <p className="font-bold text-navy-950 text-sm mb-1 truncate">{dispute.subject}</p>
              <p className="text-xs text-navy-950/60 truncate">Reporter: {dispute.userName}</p>
            </div>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-sand-200 flex flex-col overflow-hidden">
          {selectedDispute ? (
            <>
              <div className="p-6 border-b border-sand-100 bg-sand-50/50 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-navy-950">{selectedDispute.subject}</h3>
                  <div className="flex gap-4 mt-2 text-xs text-navy-950/60">
                    <p><strong>User:</strong> {selectedDispute.userName} ({selectedDispute.userEmail})</p>
                    {selectedDispute.bookingId && <p><strong>Booking:</strong> #{selectedDispute.bookingId.slice(-6)}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedDispute.status !== 'RESOLVED' && (
                    <Button 
                      onClick={handleResolve} 
                      disabled={isResolving}
                      className="bg-emerald-600 text-white rounded-full text-xs h-8"
                    >
                      {isResolving ? "Resolving..." : "Mark Resolved"}
                    </Button>
                  )}
                  <button onClick={() => setSelectedDispute(null)} className="p-2 bg-white rounded-full text-navy-950 hover:bg-sand-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-sand-50/30">
                {selectedDispute.messages?.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.sender === 'ADMIN' 
                        ? 'bg-navy-950 text-white rounded-br-none' 
                        : 'bg-white border border-sand-200 text-navy-950 rounded-bl-none shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase ${msg.sender === 'ADMIN' ? 'text-gold-400' : 'text-navy-950/40'}`}>
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] opacity-50">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selectedDispute.status !== 'RESOLVED' && (
                <div className="p-4 bg-white border-t border-sand-100 flex gap-2">
                  <textarea 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type a response to the user..."
                    className="flex-1 p-3 rounded-2xl border border-sand-200 focus:border-gold-500 outline-none resize-none h-14 bg-sand-50"
                  />
                  <Button 
                    onClick={handleSendReply} 
                    disabled={isSending || !replyText.trim()}
                    className="h-14 rounded-2xl w-14 flex items-center justify-center p-0"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-navy-950/40 p-6 text-center">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-bold text-navy-950">Select a Dispute</p>
              <p className="text-sm">Click on a dispute from the list to view the conversation and take action.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
